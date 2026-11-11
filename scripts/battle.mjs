/**
 * Mapas-masmorras: turn an area of the dungeon map into a battle Scene (Foundry v13).
 * The area is cropped from the players' image (no GM print), scaled to 100 px per square and
 * uploaded to Data/worlds/<world>/mapas-masmorras/; the Scene gets a 1,5 m square grid, walls and
 * doors built from the map grid, darkness for the light level, the party's tokens near the party
 * and the encounter's actors near the marker, and optionally a combat.
 */
import { LIGHTS, MODULE_ID, MODULE_TITLE, TEMPLATES } from "./constants.mjs";
import { MAPS } from "./maps-data.mjs";
import { DUNGEONS } from "./dungeons.mjs";
import { getState, gridFor, imagePath, saveState } from "./state.mjs";
import { loadImage, playerImage } from "./render.mjs";
import { guardActions } from "./errors.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const GRID_PX = 100;
const MAX_PX = 8192;

const DARKNESS = { clara: 0, penumbra: 0.55, submersa: 0.45, escura: 0.95, breu: 1 };

function readForm(form) {
  const out = {};
  for ( const el of form.querySelectorAll("[name]") ) out[el.getAttribute("name")] = el.type === "checkbox" ? el.checked : el.value;
  return out;
}

/** Characters assigned to players. */
function partyActors() {
  const seen = new Set();
  const out = [];
  for ( const u of game.users ?? [] ) {
    const a = u.character;
    if ( !u.isGM && a && !seen.has(a.id) ) {
      seen.add(a.id);
      out.push(a);
    }
  }
  return out;
}

function awaitImage(src) {
  return new Promise((resolve, reject) => {
    const entry = loadImage(src, e => (e.error ? reject(new Error(`Imagem não encontrada: ${src}`)) : resolve(e)));
    if ( entry.ready ) resolve(entry);
    else if ( entry.error ) reject(new Error(`Imagem não encontrada: ${src}`));
  });
}

/** Free floor cells near an anchor (breadth first inside the rectangle), for tokens of w x h squares. */
function placer(grid, rect, taken) {
  const inside = (c, r) => c >= rect.c0 && c <= rect.c1 && r >= rect.r0 && r <= rect.r1;
  const freeBlock = (c, r, w, h) => {
    for ( let dr = 0; dr < h; dr++ ) {
      for ( let dc = 0; dc < w; dc++ ) {
        if ( !inside(c + dc, r + dr) ) return false;
        const i = grid.idx(c + dc, r + dr);
        if ( !grid.walk(i) || taken.has(i) ) return false;
      }
    }
    return true;
  };
  return (anchor, w = 1, h = 1) => {
    const [ac, ar] = anchor;
    const seen = new Set();
    const queue = [[ac, ar]];
    seen.add(`${ac},${ar}`);
    for ( let k = 0; k < queue.length && k < 4000; k++ ) {
      const [c, r] = queue[k];
      if ( freeBlock(c, r, w, h) ) {
        for ( let dr = 0; dr < h; dr++ ) for ( let dc = 0; dc < w; dc++ ) taken.add(grid.idx(c + dc, r + dr));
        return [c, r];
      }
      for ( const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]] ) {
        const key = `${c + dc},${r + dr}`;
        if ( seen.has(key) || !inside(c + dc, r + dr) ) continue;
        seen.add(key);
        queue.push([c + dc, r + dr]);
      }
    }
    return null;
  };
}

/** Floor cell of the rectangle closest to (c, r). */
function nearestFloor(grid, rect, c, r) {
  let best = null;
  for ( let rr = rect.r0; rr <= rect.r1; rr++ ) {
    for ( let cc = rect.c0; cc <= rect.c1; cc++ ) {
      if ( !grid.walk(grid.idx(cc, rr)) ) continue;
      const d = Math.hypot(cc - c, rr - r);
      if ( !best || d < best.d ) best = { c: cc, r: rr, d };
    }
  }
  return best ? [best.c, best.r] : [rect.c0, rect.r0];
}

/**
 * Build the battle scene.
 * opts: { n, rect, name, light, torches, party: [actorId], enemies: [{uuid, count}], hidden, combat, activate, closeMaps, markerId }
 */
export async function createBattle(opts) {
  if ( !game.user.isGM ) throw new Error("Só o mestre cria campos de batalha.");
  const n = opts.n;
  const map = MAPS[n];
  const state = getState(n);
  const grid = gridFor(n, state);
  const rect = {
    c0: Math.max(0, Math.min(opts.rect.c0, opts.rect.c1)), r0: Math.max(0, Math.min(opts.rect.r0, opts.rect.r1)),
    c1: Math.min(map.cols - 1, Math.max(opts.rect.c0, opts.rect.c1)), r1: Math.min(map.rows - 1, Math.max(opts.rect.r0, opts.rect.r1))
  };
  const cols = rect.c1 - rect.c0 + 1;
  const rows = rect.r1 - rect.r0 + 1;
  if ( cols < 2 || rows < 2 ) throw new Error("A área precisa ter pelo menos 2 × 2 casas.");
  const gs = Math.max(50, Math.min(GRID_PX, Math.floor(MAX_PX / Math.max(cols, rows))));
  ui.notifications.info(`${MODULE_TITLE}: montando o campo de batalha (${cols} × ${rows} casas)…`);

  /* 1. crop the players' image */
  const entry = await awaitImage(imagePath(n, state));
  const source = playerImage(entry, map, grid);
  const k = source.width / map.w;
  const cv = document.createElement("canvas");
  cv.width = cols * gs;
  cv.height = rows * gs;
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const sx = (map.ox + rect.c0 * map.cell) * k;
  const sy = (map.oy + rect.r0 * map.cell) * k;
  ctx.drawImage(source, sx, sy, cols * map.cell * k, rows * map.cell * k, 0, 0, cv.width, cv.height);
  const blob = await new Promise(res => cv.toBlob(res, "image/webp", 0.9));
  if ( !blob ) throw new Error("O navegador não conseguiu gerar a imagem do campo de batalha.");
  const ext = blob.type === "image/webp" ? "webp" : "png";
  const file = new File([blob], `masmorra-${String(n).padStart(2, "0")}-batalha-${Date.now()}.${ext}`, { type: blob.type });

  /* 2. upload to the world folder */
  const FP = foundry.applications.apps.FilePicker.implementation;
  const dir = `worlds/${game.world.id}/${MODULE_ID}`;
  try {
    await FP.createDirectory("data", dir);
  } catch {
    /* it already exists */
  }
  const up = await FP.upload("data", dir, file, {}, { notify: false });
  const src = up?.path ?? `${dir}/${file.name}`;

  /* 3. the scene */
  const light = opts.light ?? state.light;
  const sceneData = {
    name: opts.name || `Desafio de ${DUNGEONS[n].god}: campo de batalha`,
    width: cols * gs,
    height: rows * gs,
    padding: 0,
    backgroundColor: "#000000",
    background: { src },
    grid: { type: CONST.GRID_TYPES.SQUARE, size: gs, distance: 1.5, units: "m", alpha: 0.18 },
    tokenVision: true,
    fog: { exploration: true },
    environment: { darknessLevel: DARKNESS[light] ?? 0, globalLight: { enabled: light === "clara" } },
    initial: { x: Math.round(cols * gs / 2), y: Math.round(rows * gs / 2), scale: 0.8 },
    navigation: true,
    flags: { [MODULE_ID]: { dungeon: n, rect } }
  };
  const SceneCls = CONFIG.Scene.documentClass;
  const scene = await SceneCls.create(sceneData);

  /* 4. walls and doors from the map grid */
  const walls = grid.battleWalls(rect.c0, rect.r0, rect.c1, rect.r1).map(w => ({
    c: [w.x0 * gs, w.y0 * gs, w.x1 * gs, w.y1 * gs],
    door: w.door ? CONST.WALL_DOOR_TYPES.DOOR : CONST.WALL_DOOR_TYPES.NONE
  }));
  if ( walls.length ) await scene.createEmbeddedDocuments("Wall", walls);

  /* 5. tokens */
  const taken = new Set();
  const place = placer(grid, rect, taken);
  const tokenData = [];
  const partyAnchor = nearestFloor(grid, rect, state.party[0], state.party[1]);
  for ( const id of opts.party ?? [] ) {
    const actor = game.actors.get(id);
    if ( !actor ) continue;
    const proto = actor.prototypeToken;
    const at = place(partyAnchor, Math.max(1, Math.round(proto?.width ?? 1)), Math.max(1, Math.round(proto?.height ?? 1)));
    if ( !at ) continue;
    const td = await actor.getTokenDocument({ x: (at[0] - rect.c0) * gs, y: (at[1] - rect.r0) * gs });
    const data = td.toObject();
    data.sight = { ...(data.sight ?? {}), enabled: true };
    if ( opts.torches ) data.light = { ...(data.light ?? {}), bright: 6, dim: 9, color: "#ff9a3c", alpha: 0.3, animation: { type: "torch", speed: 3, intensity: 3 } };
    tokenData.push(data);
  }
  const marker = opts.markerId ? state.markers.find(m => m.id === opts.markerId) : null;
  const enemyAnchor = marker ? nearestFloor(grid, rect, marker.c, marker.r) : nearestFloor(grid, rect, Math.round((rect.c0 + rect.c1) / 2), Math.round((rect.r0 + rect.r1) / 2));
  for ( const e of opts.enemies ?? [] ) {
    const actor = await fromUuid(e.uuid);
    if ( !actor || actor.documentName !== "Actor" ) continue;
    const proto = actor.prototypeToken;
    for ( let i = 0; i < (e.count || 1); i++ ) {
      const at = place(enemyAnchor, Math.max(1, Math.round(proto?.width ?? 1)), Math.max(1, Math.round(proto?.height ?? 1)));
      if ( !at ) break;
      const td = await actor.getTokenDocument({ x: (at[0] - rect.c0) * gs, y: (at[1] - rect.r0) * gs, hidden: !!opts.hidden });
      tokenData.push(td.toObject());
    }
  }
  let tokens = [];
  if ( tokenData.length ) tokens = await scene.createEmbeddedDocuments("Token", tokenData);

  /* 6. combat */
  if ( opts.combat && tokens.length ) {
    const CombatCls = CONFIG.Combat.documentClass;
    const combat = await CombatCls.create({ scene: scene.id, active: true });
    await combat.createEmbeddedDocuments("Combatant", tokens.map(t => ({ tokenId: t.id, sceneId: scene.id, actorId: t.actorId, hidden: t.hidden })));
  }

  /* 7. remember it on the marker */
  if ( marker ) {
    marker.sceneId = scene.id;
    marker.triggered = true;
    marker.battle = rect;
    await saveState(state);
  }

  if ( opts.closeMaps ) {
    const { closeForAll } = await import("./broadcast.mjs");
    closeForAll();
  }
  if ( opts.activate ) await scene.activate();
  else await scene.view();
  ui.notifications.info(`${MODULE_TITLE}: campo de batalha "${scene.name}" criado (${walls.length} paredes, ${tokens.length} tokens).`);
  return scene;
}

export class BattleApp extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.n = options.n;
    this.rect = options.rect;
    this.markerId = options.markerId ?? null;
  }

  static DEFAULT_OPTIONS = {
    classes: ["mapas-masmorras", "mm-battle-app"],
    tag: "form",
    window: { title: "Campo de batalha", icon: "fa-solid fa-chess-board", resizable: true },
    position: { width: 520, height: "auto" },
    form: { handler: BattleApp.#onSubmit, submitOnChange: false, closeOnSubmit: true },
    actions: guardActions({})
  };

  static PARTS = {
    form: { template: `${TEMPLATES}/battle.hbs` }
  };

  static open(n, { rect, markerId = null } = {}) {
    if ( !game.user.isGM ) return null;
    const app = new BattleApp({ id: `${MODULE_ID}-batalha-${Date.now()}`, n, rect, markerId });
    app.render({ force: true });
    return app;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const state = getState(this.n);
    const map = MAPS[this.n];
    const marker = this.markerId ? state.markers.find(m => m.id === this.markerId) : null;
    const r = this.rect;
    Object.assign(context, {
      god: DUNGEONS[this.n].god,
      name: `Desafio de ${DUNGEONS[this.n].god}: ${marker?.title || "campo de batalha"}`,
      rect: r,
      cols: map.cols - 1,
      rows: map.rows - 1,
      size: `${r.c1 - r.c0 + 1} × ${r.r1 - r.r0 + 1} casas (${String((r.c1 - r.c0 + 1) * 1.5).replace(".", ",")} × ${String((r.r1 - r.r0 + 1) * 1.5).replace(".", ",")} m)`,
      lights: Object.entries(LIGHTS).map(([key, l]) => ({ value: key, label: l.label.replace(/ \(.*\)$/, ""), selected: key === state.light })),
      torches: ["escura", "breu"].includes(state.light),
      party: partyActors().map(a => ({ id: a.id, name: a.name, img: a.img })),
      enemies: marker?.actors ?? [],
      hasEnemies: (marker?.actors ?? []).length > 0,
      markerTitle: marker?.title ?? ""
    });
    return context;
  }

  static async #onSubmit(event, form) {
    const v = readForm(form);
    const state = getState(this.n);
    const marker = this.markerId ? state.markers.find(m => m.id === this.markerId) : null;
    const party = [...form.querySelectorAll("input[data-party]")].filter(el => el.checked).map(el => el.dataset.party);
    const enemies = (marker?.actors ?? []).map((a, i) => ({ uuid: a.uuid, count: Number(v[`enemy${i}`]) || 0 })).filter(e => e.count > 0);
    await createBattle({
      n: this.n,
      rect: { c0: Number(v.c0), r0: Number(v.r0), c1: Number(v.c1), r1: Number(v.r1) },
      name: String(v.name ?? "").trim(),
      light: v.light,
      torches: !!v.torches,
      party,
      enemies,
      hidden: !!v.hidden,
      combat: !!v.combat,
      activate: !!v.activate,
      closeMaps: !!v.closeMaps,
      markerId: this.markerId
    });
  }
}
