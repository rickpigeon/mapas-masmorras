/**
 * Mapas-masmorras: storage. Each dungeon has its own world setting `estado-N` (so a move only
 * sends that dungeon to the clients). World settings can only be written by a GM; players change
 * the state through the GM's client (CONFIG.queries, see moves.mjs).
 * Note: world settings reach every client, so a player who digs in the browser console could read
 * the GM markers. The map never shows them to players.
 */
import { LIGHTS, MARKER_TYPES, MODULE_ID, TRIGGERS, packBits, unpackBits } from "./constants.mjs";
import { MAPS } from "./maps-data.mjs";
import { DUNGEONS, GUARDIAN_AREA } from "./dungeons.mjs";
import { Grid } from "./grid.mjs";

export const DUNGEON_IDS = Object.keys(MAPS).map(Number).sort((a, b) => a - b);

export function registerSettings(onChange) {
  const changed = () => onChange?.();
  for ( const n of DUNGEON_IDS ) {
    game.settings.register(MODULE_ID, `estado-${n}`, { scope: "world", config: false, type: Object, default: {}, onChange: changed });
  }
  game.settings.register(MODULE_ID, "atual", {
    name: "Masmorra atual",
    hint: "A masmorra que os jogadores veem ao abrir o mapa.",
    scope: "world",
    config: true,
    type: Number,
    choices: Object.fromEntries(DUNGEON_IDS.map(n => [n, `${n}ª · Desafio de ${DUNGEONS[n].god}`])),
    default: 1,
    onChange: changed
  });
  game.settings.register(MODULE_ID, "pasta", {
    name: "Pasta das imagens dos mapas",
    hint: "Pasta dentro dos dados do Foundry (Data) com os arquivos masmorra-01.webp … masmorra-20.webp. Padrão: mapas-masmorras (ou seja, Data/mapas-masmorras).",
    scope: "world",
    config: true,
    type: String,
    default: "mapas-masmorras",
    onChange: changed
  });
  game.settings.register(MODULE_ID, "imagemGrupo", {
    name: "Imagem do grupo no mapa",
    hint: "Opcional: caminho de uma imagem para o marcador do grupo. Vazio = um disco roxo.",
    scope: "world",
    config: true,
    type: String,
    default: "",
    onChange: changed
  });
}

const safeGet = (key, fallback) => {
  try {
    return game.settings.get(MODULE_ID, key);
  } catch {
    return fallback;
  }
};

export function currentDungeon() {
  const n = Number(safeGet("atual", 1));
  return MAPS[n] ? n : 1;
}

export function imagePath(n, state) {
  if ( state?.image ) return state.image;
  const folder = String(safeGet("pasta", "mapas-masmorras") || "mapas-masmorras").replace(/\/+$/, "");
  return `${folder}/${MAPS[n].file}`;
}

/* -------------------------------------------- */
/*  Markers                                     */
/* -------------------------------------------- */

const text = (v, max = 400) => String(v ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);
const oneOf = (v, catalog, fallback) => (Object.hasOwn(catalog, v) ? v : fallback);
const bool = (v, fallback = false) => (v === undefined ? fallback : v === true || v === "true" || v === "on");
const intIn = (v, min, max, fallback) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export function normalizeMarker(raw = {}, map) {
  const cols = map?.cols ?? 999;
  const rows = map?.rows ?? 999;
  const actors = Array.isArray(raw.actors) ? raw.actors.slice(0, 20).map(a => ({
    uuid: text(a?.uuid, 200), name: text(a?.name, 80), img: text(a?.img, 400), count: intIn(a?.count, 1, 20, 1)
  })).filter(a => a.uuid) : [];
  const area = raw.battle && typeof raw.battle === "object"
    ? { c0: intIn(raw.battle.c0, 0, cols - 1, 0), r0: intIn(raw.battle.r0, 0, rows - 1, 0), c1: intIn(raw.battle.c1, 0, cols - 1, 0), r1: intIn(raw.battle.r1, 0, rows - 1, 0) }
    : null;
  return {
    id: text(raw.id, 32) || foundry.utils.randomID(),
    type: oneOf(raw.type, MARKER_TYPES, "nota"),
    c: intIn(raw.c, 0, cols - 1, 0),
    r: intIn(raw.r, 0, rows - 1, 0),
    label: text(raw.label, 4),
    title: text(raw.title, 120) || MARKER_TYPES[oneOf(raw.type, MARKER_TYPES, "nota")].label,
    gmText: text(raw.gmText, 2000),
    playerText: text(raw.playerText, 1000),
    revealed: bool(raw.revealed, false),
    trigger: oneOf(raw.trigger, TRIGGERS, "nenhum"),
    revealOnTrigger: bool(raw.revealOnTrigger, true),
    triggered: bool(raw.triggered, false),
    done: bool(raw.done, false),
    actors,
    battle: area,
    sceneId: text(raw.sceneId, 32),
    book: bool(raw.book, false)
  };
}

/** The markers a dungeon starts with: the book areas, the arrival and the exit portal. */
export function presetMarkers(n) {
  const map = MAPS[n];
  const info = DUNGEONS[n];
  const out = [];
  let k = 0;
  const id = () => `livro${String(n).padStart(2, "0")}m${String(k++).padStart(2, "0")}`;
  out.push(normalizeMarker({ id: id(), type: "portal", label: "C", c: map.start[0], r: map.start[1], title: "Chegada", gmText: "Portal de chegada da masmorra (p. 50).", playerText: "O círculo de luz púrpura por onde vocês chegaram.", revealed: true, book: true }, map));
  const guardian = GUARDIAN_AREA[n];
  let exitPlaced = false;
  for ( const a of map.areas ) {
    const area = info.areas[a.a] ?? info.areas[String(a.a).replace(/[a-z]$/i, "")];
    const [name, page, note] = area ?? [`Área ${a.a}`, info.page, ""];
    const kind = a.extra ? "nota" : "area";
    out.push(normalizeMarker({
      id: id(), type: kind, label: String(a.a).slice(0, 3), c: a.c, r: a.r,
      title: a.extra ? `${name} (${a.a})` : `Área ${a.a}: ${name}`,
      gmText: `${note}${note ? " " : ""}(p. ${page})`, revealed: false, book: true
    }, map));
    if ( !exitPlaced && String(a.a) === guardian ) {
      out.push(normalizeMarker({ id: id(), type: "portal", label: "S", c: a.c, r: Math.min(map.rows - 1, a.r + 1), title: "Portal de saída", gmText: "O círculo só aparece ou funciona depois que o Guardião é vencido (p. 50). Mova o marcador para onde quiser.", playerText: "Um círculo de luz púrpura.", revealed: false, book: true }, map));
      exitPlaced = true;
    }
  }
  if ( n === 2 ) out.push(normalizeMarker({ id: id(), type: "porta", label: "S", c: 28, r: 28, title: "Porta secreta", gmText: "Marcada no mapa do livro, entre o corredor e a Área 1.", book: true }, map));
  return out;
}

/* -------------------------------------------- */
/*  Dungeon state                               */
/* -------------------------------------------- */

const indexList = (v, size) => (Array.isArray(v) ? [...new Set(v.map(Number).filter(i => Number.isInteger(i) && i >= 0 && i < size))] : []);

export function normalizeState(raw, n) {
  const map = MAPS[n];
  const info = DUNGEONS[n];
  const size = map.cols * map.rows;
  const s = raw && typeof raw === "object" ? raw : {};
  const fresh = !Array.isArray(s.markers);
  const party = Array.isArray(s.party) && s.party.length === 2 ? [intIn(s.party[0], 0, map.cols - 1, map.start[0]), intIn(s.party[1], 0, map.rows - 1, map.start[1])] : [...map.start];
  const move = s.move && typeof s.move === "object" && Array.isArray(s.move.path)
    ? { path: s.move.path.map(Number).filter(i => i >= 0 && i < size).slice(0, 400), at: Number(s.move.at) || 0 }
    : null;
  return {
    n,
    party,
    explored: typeof s.explored === "string" ? s.explored : "",
    locked: bool(s.locked, true),
    light: oneOf(s.light, LIGHTS, info.light),
    radius: intIn(s.radius, 0, 40, 0),
    remember: s.remember === undefined ? info.remember : bool(s.remember, info.remember),
    maxSteps: intIn(s.maxSteps, 0, 200, 0),
    markers: fresh ? presetMarkers(n) : s.markers.map(m => normalizeMarker(m, map)),
    edits: { on: indexList(s.edits?.on, size), off: indexList(s.edits?.off, size) },
    image: text(s.image, 400),
    move,
    seq: intIn(s.seq, 0, Number.MAX_SAFE_INTEGER, 0)
  };
}

export function getState(n) {
  return normalizeState(safeGet(`estado-${n}`, {}), n);
}

export async function saveState(state) {
  if ( !game.user.isGM ) throw new Error("Só o mestre grava o estado da masmorra.");
  const n = state.n;
  const clean = normalizeState({ ...state, seq: (state.seq ?? 0) + 1 }, n);
  await game.settings.set(MODULE_ID, `estado-${n}`, clean);
  return clean;
}

/** Grid with the GM's floor edits applied. */
export function gridFor(n, state) {
  return new Grid(MAPS[n], state?.edits ?? {});
}

export function sightRadius(state) {
  return state.radius || LIGHTS[state.light]?.radius || 8;
}

/** Explored cells as a Uint8Array. */
export function exploredBits(state) {
  const map = MAPS[state.n];
  return unpackBits(state.explored, map.cols * map.rows);
}

/** Add what the party sees from `cells` to the explored layer (or replace it, when the fog forgets). */
export function exploreFrom(state, grid, cells) {
  const size = grid.size;
  const bits = state.remember ? exploredBits(state) : new Uint8Array(size);
  const radius = sightRadius(state);
  for ( const i of cells ) {
    const seen = grid.visible(i, radius);
    for ( let k = 0; k < size; k++ ) if ( seen[k] ) bits[k] = 1;
  }
  state.explored = packBits(bits);
  return state;
}
