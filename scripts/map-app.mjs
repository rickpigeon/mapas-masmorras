/**
 * Mapas-masmorras: the map window (everybody). Players see the map of the current dungeon with fog,
 * light around the party and the markers the GM revealed, and click to move when the GM allows it.
 * The GM sees everything (fog only darkens), picks any dungeon, and has the tools and the side panel.
 */
import { LIGHTS, MARKER_TYPES, MODULE_ID, MODULE_TITLE, TEMPLATES, TRIGGERS, escapeHTML, packBits, rollDie } from "./constants.mjs";
import { MAPS } from "./maps-data.mjs";
import { DUNGEONS } from "./dungeons.mjs";
import { DUNGEON_IDS, currentDungeon, exploredBits, getState, gridFor, imagePath, normalizeMarker, presetMarkers, saveState, sightRadius } from "./state.mjs";
import { drawFrame, fogCanvas, loadImage, playerImage } from "./render.mjs";
import { requestMove } from "./moves.mjs";
import { guardActions, reportError } from "./errors.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const APP_ID = `${MODULE_ID}-mapa`;

const TOOLS = {
  mover: { label: "Mover o grupo", icon: "fa-solid fa-person-walking" },
  marcador: { label: "Marcadores (clique numa casa)", icon: "fa-solid fa-location-dot" },
  nevoa: { label: "Névoa (arraste para revelar ou esconder)", icon: "fa-solid fa-smog" },
  chao: { label: "Chão (arraste para marcar onde se anda)", icon: "fa-solid fa-border-all" },
  batalha: { label: "Campo de batalha (arraste um retângulo)", icon: "fa-solid fa-chess-board" }
};

/** Parse "1–2: texto" / "3: texto" rows of a table. */
function tableRows(table) {
  return table.linhas.map(line => {
    const m = line.match(/^([\d,]+)(?:[–-](\d+))?:\s*(.*)$/);
    const a = m ? Number(m[1].replace(",", ".")) : 0;
    return { a, b: m && m[2] ? Number(m[2]) : a, text: m ? m[3] : line };
  });
}

/** Random encounter on the dungeon table (Nimb picks the table with 1d20, p. 158). */
export function rollEncounter(n) {
  const log = [];
  let table = DUNGEONS[n].tabela;
  let source = n;
  if ( n === 18 ) {
    const pick = rollDie(20);
    const other = DUNGEONS[pick]?.tabela;
    if ( pick !== 18 && other && pick !== 20 ) {
      table = other;
      source = pick;
      log.push(`1d20 = ${pick} (tabela de ${DUNGEONS[pick].god})`);
    }
    else log.push(`1d20 = ${pick} (tabela de Nimb)`);
  }
  if ( !table ) return { text: DUNGEONS[n].encontros, log: ["Esta masmorra não tem tabela de encontros."] };
  const rows = tableRows(table);
  if ( source === 18 ) {
    const row = rows[Math.floor(Math.random() * rows.length)];
    log.push(`${table.dado} (linha ${row.a})`);
    return { text: row.text, log };
  }
  const faces = Number(table.dado.replace("1d", "")) || 6;
  const roll = rollDie(faces);
  const row = rows.find(r => roll >= r.a && roll <= r.b) ?? rows[0];
  log.push(`${table.dado} = ${roll}`);
  return { text: row.text, log };
}

export class MapApp extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.ui = {
      n: options.n ?? currentDungeon(),
      tool: "mover",
      panel: true,
      playerView: false,
      view: null,
      hover: -1,
      path: null,
      pathOk: true,
      rect: null,
      brush: null,
      encounter: null,
      focusMarker: options.focus ?? null
    };
    this.anim = null;
    this.lastMoveAt = null;
  }

  static DEFAULT_OPTIONS = {
    id: APP_ID,
    classes: ["mapas-masmorras", "mm-map-app"],
    window: { title: "Mapas-masmorras", icon: "fa-solid fa-dungeon", resizable: true },
    position: { width: 1220, height: 820 },
    actions: guardActions({
      tool: MapApp.#onTool,
      toggleLock: MapApp.#onToggleLock,
      showAll: MapApp.#onShowAll,
      playerView: MapApp.#onPlayerView,
      center: MapApp.#onCenter,
      fit: MapApp.#onFit,
      togglePanel: MapApp.#onTogglePanel,
      revealAll: MapApp.#onRevealAll,
      hideAll: MapApp.#onHideAll,
      partyToStart: MapApp.#onPartyToStart,
      resetFloor: MapApp.#onResetFloor,
      resetMarkers: MapApp.#onResetMarkers,
      rollEncounter: MapApp.#onRollEncounter,
      encounterMarker: MapApp.#onEncounterMarker,
      editMarker: MapApp.#onEditMarker,
      toggleReveal: MapApp.#onToggleReveal,
      newMarker: MapApp.#onNewMarker
    })
  };

  static PARTS = {
    main: { template: `${TEMPLATES}/map.hbs` }
  };

  /** Open (or bring forward) the map. GM: any dungeon; players: the current one. */
  static open({ n = null, focus = null } = {}) {
    const target = game.user.isGM ? (n ?? currentDungeon()) : currentDungeon();
    const existing = foundry.applications.instances.get(APP_ID);
    if ( existing ) {
      if ( existing.ui.n !== target ) {
        existing.ui.n = target;
        existing.ui.view = null;
      }
      if ( focus ) existing.ui.focusMarker = focus;
      existing.render({ force: true });
      existing.bringToFront?.();
      return existing;
    }
    const app = new MapApp({ n: target, focus });
    app.render({ force: true });
    return app;
  }

  static refresh() {
    const app = foundry.applications.instances.get(APP_ID);
    if ( !app?.rendered ) return;
    if ( !game.user.isGM && app.ui.n !== currentDungeon() ) {
      app.ui.n = currentDungeon();
      app.ui.view = null;
    }
    app.render();
  }

  get title() {
    const info = DUNGEONS[this.ui.n];
    return `Mapas-masmorras: Desafio de ${info.god} (${this.ui.n}ª masmorra)`;
  }

  get isGM() {
    return game.user.isGM;
  }

  /** GM looking at the map as a player would. */
  get asPlayer() {
    return !this.isGM || this.ui.playerView;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const n = this.ui.n;
    this.mstate = getState(n);
    this.grid = gridFor(n, this.mstate);
    const s = this.mstate;
    const info = DUNGEONS[n];
    const gm = this.isGM;
    const markers = s.markers.map(m => ({
      ...m,
      typeLabel: MARKER_TYPES[m.type].label,
      icon: MARKER_TYPES[m.type].icon,
      glyph: m.label || MARKER_TYPES[m.type].glyph,
      color: MARKER_TYPES[m.type].color,
      triggerLabel: m.trigger === "nenhum" ? "" : TRIGGERS[m.trigger]
    }));
    Object.assign(context, {
      gm,
      n,
      info,
      locked: s.locked,
      panel: gm && this.ui.panel,
      playerView: this.ui.playerView,
      dungeons: DUNGEON_IDS.map(k => ({ value: k, label: `${k}ª · ${DUNGEONS[k].god}`, selected: k === n, current: k === currentDungeon() })),
      isCurrent: n === currentDungeon(),
      tools: Object.entries(TOOLS).map(([key, t]) => ({ key, ...t, active: key === this.ui.tool })),
      lights: Object.entries(LIGHTS).map(([key, l]) => ({ value: key, label: l.label, selected: key === s.light })),
      radius: s.radius,
      radiusAuto: sightRadius({ ...s, radius: 0 }),
      remember: s.remember,
      maxSteps: s.maxSteps,
      image: s.image,
      imageDefault: imagePath(n, { image: "" }),
      markers,
      markerCount: markers.length,
      encounter: this.ui.encounter,
      hasTable: !!info.tabela || n === 18,
      partyCell: `${s.party[0]}, ${s.party[1]}`
    });
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const stage = this.element.querySelector(".mm-stage");
    const canvas = this.element.querySelector("canvas.mm-canvas");
    if ( !stage || !canvas ) return;
    this.stage = stage;
    this.canvas = canvas;
    this.tip = this.element.querySelector(".mm-tip");
    this.#bindCanvas();
    this.#bindPanel();
    this.#resize();
    this.observer?.disconnect();
    this.observer = new ResizeObserver(() => {
      this.#resize();
      this.draw();
    });
    this.observer.observe(stage);
    this.#prepareLayers();
    /* animate a fresh move */
    const at = this.mstate.move?.at ?? 0;
    if ( this.lastMoveAt !== null && at > this.lastMoveAt && this.mstate.move.path.length > 1 ) this.#animate(this.mstate.move.path);
    this.lastMoveAt = at;
    if ( this.ui.focusMarker ) {
      const m = this.mstate.markers.find(x => x.id === this.ui.focusMarker);
      this.ui.focusMarker = null;
      if ( m ) this.#centerOn(m.c, m.r, Math.max(this.ui.view?.scale ?? 1, 1.6));
    }
    this.draw();
  }

  async close(options) {
    this.observer?.disconnect();
    if ( this.anim ) cancelAnimationFrame(this.anim.raf);
    return super.close(options);
  }

  /* -------------------------------------------- */
  /*  Layers and drawing                          */
  /* -------------------------------------------- */

  #prepareLayers() {
    const n = this.ui.n;
    const map = MAPS[n];
    const src = imagePath(n, this.mstate);
    this.src = src;
    this.entry = loadImage(src, () => {
      if ( this.rendered && this.src === src ) this.draw();
    });
    const party = this.grid.idx(this.mstate.party[0], this.mstate.party[1]);
    this.seen = this.grid.visible(party, sightRadius(this.mstate));
    this.explored = exploredBits(this.mstate);
    this.fog = fogCanvas(map, this.grid, this.explored, this.seen, this.mstate.party, sightRadius(this.mstate), !this.asPlayer);
    const groupImg = game.settings.get(MODULE_ID, "imagemGrupo");
    this.partyImg = groupImg ? loadImage(groupImg, () => this.rendered && this.draw()) : null;
  }

  #resize() {
    if ( !this.canvas || !this.stage ) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(50, this.stage.clientWidth);
    const h = Math.max(50, this.stage.clientHeight);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.dpr = dpr;
    if ( !this.ui.view ) this.#initialView();
  }

  #initialView() {
    const map = MAPS[this.ui.n];
    const w = this.stage.clientWidth;
    const h = this.stage.clientHeight;
    const fit = Math.min(w / map.w, h / map.h);
    if ( this.asPlayer ) {
      this.ui.view = { scale: Math.max(fit, 1.4), x: 0, y: 0 };
      this.#centerOn(this.mstate.party[0], this.mstate.party[1], this.ui.view.scale);
    }
    else this.ui.view = { scale: fit, x: (w - map.w * fit) / 2, y: (h - map.h * fit) / 2 };
  }

  #centerOn(c, r, scale) {
    const map = MAPS[this.ui.n];
    const w = this.stage?.clientWidth ?? 800;
    const h = this.stage?.clientHeight ?? 600;
    const s = scale ?? this.ui.view?.scale ?? 1;
    const px = map.ox + (c + 0.5) * map.cell;
    const py = map.oy + (r + 0.5) * map.cell;
    this.ui.view = { scale: s, x: w / 2 - px * s, y: h / 2 - py * s };
  }

  /** Markers this viewer may see. */
  #visibleMarkers() {
    if ( !this.asPlayer ) return this.mstate.markers;
    return this.mstate.markers.filter(m => {
      if ( !m.revealed ) return false;
      const i = this.grid.idx(m.c, m.r);
      return this.explored[i] || this.seen[i];
    });
  }

  draw() {
    if ( !this.canvas ) return;
    const ctx = this.canvas.getContext("2d");
    const map = MAPS[this.ui.n];
    const dpr = this.dpr || 1;
    const view = this.ui.view ?? { scale: 1, x: 0, y: 0 };
    const entry = this.entry;
    let image = null;
    let message = "Carregando o mapa…";
    if ( entry?.ready ) image = this.asPlayer ? playerImage(entry, map, this.grid) : entry.img;
    else if ( entry?.error ) message = `Imagem não encontrada: ${this.src}. Copie as imagens dos mapas para Data/${game.settings.get(MODULE_ID, "pasta") || "mapas-masmorras"} (veja o README).`;
    const party = this.anim?.pos ?? {
      x: map.ox + (this.mstate.party[0] + 0.5) * map.cell,
      y: map.oy + (this.mstate.party[1] + 0.5) * map.cell
    };
    drawFrame({
      ctx,
      width: this.canvas.width,
      height: this.canvas.height,
      view: { scale: view.scale * dpr, x: view.x * dpr, y: view.y * dpr },
      map,
      grid: this.grid,
      image,
      message,
      fog: this.fog,
      markers: this.#visibleMarkers(),
      party,
      partyImg: this.partyImg?.ready ? this.partyImg.img : null,
      gm: !this.asPlayer,
      hover: this.ui.hover,
      path: this.ui.path,
      pathOk: this.ui.pathOk,
      rect: this.ui.rect,
      brush: this.ui.brush,
      floorEdit: !this.asPlayer && this.ui.tool === "chao"
    });
  }

  #animate(path) {
    const map = MAPS[this.ui.n];
    const pts = path.map(i => {
      const [c, r] = this.grid.cr(i);
      return { x: map.ox + (c + 0.5) * map.cell, y: map.oy + (r + 0.5) * map.cell };
    });
    const per = 110;
    const t0 = performance.now();
    if ( this.anim ) cancelAnimationFrame(this.anim.raf);
    this.anim = { pos: pts[0], raf: 0 };
    const step = now => {
      const t = Math.max(0, (now - t0) / per);
      const k = Math.min(pts.length - 1, Math.floor(t));
      const f = Math.min(1, t - k);
      const a = pts[k];
      const b = pts[Math.min(pts.length - 1, k + 1)];
      this.anim.pos = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
      this.draw();
      if ( t < pts.length - 1 ) this.anim.raf = requestAnimationFrame(step);
      else {
        this.anim = null;
        this.draw();
      }
    };
    this.anim.raf = requestAnimationFrame(step);
  }

  /* -------------------------------------------- */
  /*  Pointer                                     */
  /* -------------------------------------------- */

  #cellAt(event) {
    const map = MAPS[this.ui.n];
    const rect = this.canvas.getBoundingClientRect();
    const v = this.ui.view;
    const x = (event.clientX - rect.left - v.x) / v.scale;
    const y = (event.clientY - rect.top - v.y) / v.scale;
    const c = Math.floor((x - map.ox) / map.cell);
    const r = Math.floor((y - map.oy) / map.cell);
    return this.grid.idx(c, r);
  }

  #known(i) {
    return this.explored[i] === 1 || this.seen[i] === 1;
  }

  #bindCanvas() {
    const cv = this.canvas;
    cv.addEventListener("contextmenu", e => e.preventDefault());
    cv.addEventListener("wheel", event => {
      event.preventDefault();
      const rect = cv.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      const v = this.ui.view;
      const factor = Math.exp(-event.deltaY * 0.0015);
      const s = Math.min(6, Math.max(0.25, v.scale * factor));
      this.ui.view = { scale: s, x: mx - (mx - v.x) * (s / v.scale), y: my - (my - v.y) * (s / v.scale) };
      this.draw();
    }, { passive: false });
    cv.addEventListener("pointerdown", event => {
      try {
        cv.setPointerCapture(event.pointerId);
      } catch {
        /* synthetic or already released pointer */
      }
      const cell = this.#cellAt(event);
      this.drag = { x0: event.clientX, y0: event.clientY, button: event.button, moved: false, vx: this.ui.view.x, vy: this.ui.view.y, start: cell, mode: null };
      const tool = this.asPlayer ? "mover" : this.ui.tool;
      if ( event.button === 0 && (tool === "nevoa" || tool === "chao") && cell >= 0 ) {
        this.ui.brush = new Uint8Array(this.grid.size);
        this.drag.mode = tool === "nevoa" ? (this.explored[cell] ? "hide" : "reveal") : (this.grid.walk(cell) ? "off" : "on");
        this.#paint(cell);
      }
      if ( event.button === 0 && tool === "batalha" && cell >= 0 ) {
        const [c, r] = this.grid.cr(cell);
        this.ui.rect = { c0: c, r0: r, c1: c, r1: r };
      }
    });
    cv.addEventListener("pointermove", event => {
      try {
        this.#onPointerMove(event);
      } catch ( err ) {
        reportError(err, "mapa");
      }
    });
    cv.addEventListener("pointerup", event => {
      const d = this.drag;
      this.drag = null;
      if ( !d ) return;
      const tool = this.asPlayer ? "mover" : this.ui.tool;
      const cell = this.#cellAt(event);
      Promise.resolve().then(async () => {
        if ( this.ui.brush ) {
          const brush = this.ui.brush;
          this.ui.brush = null;
          await this.#commitBrush(brush, d.mode);
          return;
        }
        if ( tool === "batalha" && this.ui.rect && d.button === 0 ) {
          const rect = this.ui.rect;
          this.ui.rect = null;
          const { BattleApp } = await import("./battle.mjs");
          BattleApp.open(this.ui.n, { rect });
          this.draw();
          return;
        }
        if ( d.moved || d.button !== 0 || cell < 0 ) return;
        await this.#click(cell, tool);
      }).catch(err => reportError(err, "mapa"));
    });
    cv.addEventListener("pointerleave", () => {
      this.ui.hover = -1;
      this.ui.path = null;
      if ( this.tip ) this.tip.hidden = true;
      this.draw();
    });
  }

  #onPointerMove(event) {
    const d = this.drag;
    const cell = this.#cellAt(event);
    const tool = this.asPlayer ? "mover" : this.ui.tool;
    if ( d ) {
      const dx = event.clientX - d.x0;
      const dy = event.clientY - d.y0;
      if ( Math.hypot(dx, dy) > 4 ) d.moved = true;
      if ( this.ui.brush && cell >= 0 ) {
        this.#paint(cell);
        this.draw();
        return;
      }
      if ( this.ui.rect && cell >= 0 && d.start >= 0 ) {
        const [c0, r0] = this.grid.cr(d.start);
        const [c1, r1] = this.grid.cr(cell);
        this.ui.rect = { c0: Math.min(c0, c1), r0: Math.min(r0, r1), c1: Math.max(c0, c1), r1: Math.max(r0, r1) };
        this.draw();
        return;
      }
      if ( d.moved ) {
        this.ui.view = { ...this.ui.view, x: d.vx + dx, y: d.vy + dy };
        this.draw();
      }
      return;
    }
    if ( cell === this.ui.hover ) return;
    this.ui.hover = cell;
    this.ui.path = null;
    if ( tool === "mover" && cell >= 0 && this.grid.walk(cell) ) {
      const from = this.grid.idx(this.mstate.party[0], this.mstate.party[1]);
      if ( this.asPlayer ) {
        if ( this.#known(cell) ) {
          this.ui.path = this.grid.path(from, cell, i => this.#known(i));
          this.ui.pathOk = !this.mstate.locked && (!this.mstate.maxSteps || (this.ui.path?.length ?? 0) - 1 <= this.mstate.maxSteps);
        }
      }
      else {
        this.ui.path = this.grid.path(from, cell);
        this.ui.pathOk = true;
      }
    }
    this.#tooltip(event, cell);
    this.draw();
  }

  #tooltip(event, cell) {
    if ( !this.tip ) return;
    const [c, r] = cell >= 0 ? this.grid.cr(cell) : [-1, -1];
    const list = this.#visibleMarkers().filter(m => m.c === c && m.r === r);
    const steps = this.ui.path ? this.ui.path.length - 1 : 0;
    const parts = [];
    for ( const m of list ) {
      const body = this.asPlayer ? m.playerText : [m.gmText, m.playerText ? `Jogadores: ${m.playerText}` : ""].filter(Boolean).join("\n");
      parts.push(`<strong>${escapeHTML(m.title)}</strong>${body ? `<br>${escapeHTML(body).replace(/\n/g, "<br>")}` : ""}`);
    }
    if ( steps > 0 ) parts.push(`<span class="mm-tip-steps">${steps} ${steps === 1 ? "passo" : "passos"} · ${String(steps * 1.5).replace(".", ",")} m${this.ui.pathOk ? "" : (this.mstate.locked ? " · movimento travado" : " · passa do limite")}</span>`);
    if ( !parts.length ) {
      this.tip.hidden = true;
      return;
    }
    this.tip.innerHTML = parts.join("<hr>");
    const rect = this.stage.getBoundingClientRect();
    this.tip.style.left = `${Math.min(rect.width - 260, event.clientX - rect.left + 16)}px`;
    this.tip.style.top = `${Math.min(rect.height - 40, event.clientY - rect.top + 16)}px`;
    this.tip.hidden = false;
  }

  #paint(cell) {
    const [c, r] = this.grid.cr(cell);
    const radius = this.ui.tool === "nevoa" ? 1 : 0;
    for ( let dr = -radius; dr <= radius; dr++ ) {
      for ( let dc = -radius; dc <= radius; dc++ ) {
        const j = this.grid.idx(c + dc, r + dr);
        if ( j >= 0 ) this.ui.brush[j] = 1;
      }
    }
  }

  async #commitBrush(brush, mode) {
    const state = getState(this.ui.n);
    if ( mode === "reveal" || mode === "hide" ) {
      const bits = exploredBits(state);
      for ( let i = 0; i < brush.length; i++ ) if ( brush[i] ) bits[i] = mode === "reveal" ? 1 : 0;
      state.explored = packBits(bits);
    }
    else {
      const base = gridFor(this.ui.n, { edits: {} });
      const on = new Set(state.edits.on);
      const off = new Set(state.edits.off);
      for ( let i = 0; i < brush.length; i++ ) {
        if ( !brush[i] ) continue;
        const want = mode === "on";
        on.delete(i);
        off.delete(i);
        if ( want && !base.walk(i) ) on.add(i);
        if ( !want && base.walk(i) ) off.add(i);
      }
      state.edits = { on: [...on], off: [...off] };
    }
    await saveState(state);
  }

  async #click(cell, tool) {
    const n = this.ui.n;
    if ( tool === "mover" ) {
      if ( this.asPlayer && !this.isGM ) {
        if ( this.mstate.locked ) {
          ui.notifications.warn(`${MODULE_TITLE}: o mestre travou o movimento.`);
          return;
        }
        if ( !this.#known(cell) ) return;
      }
      await requestMove(n, cell);
      return;
    }
    if ( tool === "marcador" ) {
      const [c, r] = this.grid.cr(cell);
      const { MarkerEditor } = await import("./marker-editor.mjs");
      const here = this.mstate.markers.filter(m => m.c === c && m.r === r);
      if ( here.length ) MarkerEditor.open(n, here[here.length - 1].id);
      else MarkerEditor.open(n, null, { c, r });
    }
  }

  /* -------------------------------------------- */
  /*  Panel inputs                                */
  /* -------------------------------------------- */

  #bindPanel() {
    const sel = this.element.querySelector("select[name=dungeon]");
    sel?.addEventListener("change", () => {
      this.ui.n = Number(sel.value);
      this.ui.view = null;
      this.ui.encounter = null;
      this.render();
    });
    for ( const el of this.element.querySelectorAll("[data-state-field]") ) {
      el.addEventListener("change", () => {
        this.#setField(el.dataset.stateField, el.type === "checkbox" ? el.checked : el.value).catch(err => reportError(err, "painel"));
      });
    }
  }

  async #setField(field, value) {
    const state = getState(this.ui.n);
    if ( field === "light" ) state.light = value;
    else if ( field === "radius" ) state.radius = Number(value) || 0;
    else if ( field === "remember" ) state.remember = !!value;
    else if ( field === "maxSteps" ) state.maxSteps = Number(value) || 0;
    else if ( field === "image" ) state.image = String(value).trim();
    else return;
    await saveState(state);
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  static #gm() {
    if ( !game.user.isGM ) throw new Error("Só o mestre usa essa ferramenta.");
  }

  static async #onTool(event, target) {
    MapApp.#gm();
    this.ui.tool = target.dataset.tool;
    this.ui.path = null;
    this.render();
  }

  static async #onToggleLock() {
    MapApp.#gm();
    const state = getState(this.ui.n);
    state.locked = !state.locked;
    await saveState(state);
    ui.notifications.info(`${MODULE_TITLE}: movimento dos jogadores ${state.locked ? "travado" : "liberado"}.`);
  }

  static async #onShowAll() {
    MapApp.#gm();
    const { showToAll } = await import("./broadcast.mjs");
    await showToAll(this.ui.n);
  }

  static async #onPlayerView() {
    MapApp.#gm();
    this.ui.playerView = !this.ui.playerView;
    this.render();
  }

  static async #onCenter() {
    this.#centerOn(this.mstate.party[0], this.mstate.party[1], Math.max(this.ui.view?.scale ?? 1, 1.4));
    this.draw();
  }

  static async #onFit() {
    this.ui.view = null;
    this.#resize();
    this.draw();
  }

  static async #onTogglePanel() {
    this.ui.panel = !this.ui.panel;
    this.render();
  }

  static async #onRevealAll() {
    MapApp.#gm();
    const state = getState(this.ui.n);
    const grid = gridFor(this.ui.n, state);
    const bits = new Uint8Array(grid.size);
    for ( let i = 0; i < grid.size; i++ ) bits[i] = 1;
    state.explored = packBits(bits);
    await saveState(state);
  }

  static async #onHideAll() {
    MapApp.#gm();
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Esconder o mapa" },
      content: "<p>Apagar tudo o que os jogadores já exploraram nesta masmorra? (Eles continuam vendo o que está ao redor do grupo.)</p>",
      rejectClose: false,
      modal: true
    });
    if ( !ok ) return;
    const state = getState(this.ui.n);
    state.explored = "";
    await saveState(state);
  }

  static async #onPartyToStart() {
    MapApp.#gm();
    const state = getState(this.ui.n);
    state.party = [...MAPS[this.ui.n].start];
    state.move = null;
    await saveState(state);
  }

  static async #onResetFloor() {
    MapApp.#gm();
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Desfazer edições do chão" },
      content: "<p>Voltar o chão desta masmorra ao que veio do livro?</p>",
      rejectClose: false,
      modal: true
    });
    if ( !ok ) return;
    const state = getState(this.ui.n);
    state.edits = { on: [], off: [] };
    await saveState(state);
  }

  static async #onResetMarkers() {
    MapApp.#gm();
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Marcadores do livro" },
      content: "<p>Recolocar os marcadores do livro (áreas, chegada e portal)? Os seus marcadores continuam; os do livro voltam ao estado inicial.</p>",
      rejectClose: false,
      modal: true
    });
    if ( !ok ) return;
    const state = getState(this.ui.n);
    const own = state.markers.filter(m => !m.book);
    state.markers = [...presetMarkers(this.ui.n), ...own];
    await saveState(state);
  }

  static async #onRollEncounter() {
    MapApp.#gm();
    this.ui.encounter = rollEncounter(this.ui.n);
    this.render();
  }

  static async #onEncounterMarker() {
    MapApp.#gm();
    const enc = this.ui.encounter;
    if ( !enc ) return;
    const state = getState(this.ui.n);
    const map = MAPS[this.ui.n];
    state.markers.push(normalizeMarker({
      type: "encontro", c: state.party[0], r: state.party[1], title: "Encontro aleatório",
      gmText: `${enc.text} (${enc.log.join(" → ")})`, revealed: false
    }, map));
    await saveState(state);
    this.ui.encounter = null;
  }

  static async #onEditMarker(event, target) {
    MapApp.#gm();
    const id = target.closest("[data-marker-id]")?.dataset.markerId;
    const { MarkerEditor } = await import("./marker-editor.mjs");
    const m = this.mstate.markers.find(x => x.id === id);
    if ( m ) {
      this.#centerOn(m.c, m.r, Math.max(this.ui.view?.scale ?? 1, 1.2));
      this.draw();
    }
    MarkerEditor.open(this.ui.n, id);
  }

  static async #onToggleReveal(event, target) {
    MapApp.#gm();
    const id = target.closest("[data-marker-id]")?.dataset.markerId;
    const state = getState(this.ui.n);
    const m = state.markers.find(x => x.id === id);
    if ( !m ) return;
    m.revealed = !m.revealed;
    await saveState(state);
  }

  static async #onNewMarker() {
    MapApp.#gm();
    const { MarkerEditor } = await import("./marker-editor.mjs");
    MarkerEditor.open(this.ui.n, null, { c: this.mstate.party[0], r: this.mstate.party[1] });
  }
}
