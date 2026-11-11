/**
 * Mapas-masmorras: marker editor (GM). Traps, encounters, events, notes and the dungeon's own
 * features. Drag actors from the sidebar onto the window to list who fights in an encounter.
 */
import { MARKER_TYPES, MODULE_ID, MODULE_TITLE, TEMPLATES, TRIGGERS, escapeHTML } from "./constants.mjs";
import { MAPS } from "./maps-data.mjs";
import { getState, normalizeMarker, saveState } from "./state.mjs";
import { guardActions, reportError } from "./errors.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const choices = (catalog, value) => Object.entries(catalog).map(([key, v]) => ({
  value: key, label: typeof v === "string" ? v : v.label, selected: key === value
}));

function readForm(form) {
  const out = {};
  for ( const el of form.querySelectorAll("[name]") ) out[el.getAttribute("name")] = el.type === "checkbox" ? el.checked : el.value;
  return out;
}

export class MarkerEditor extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.n = options.n;
    this.isNew = !!options.isNew;
    this.draft = normalizeMarker(options.marker ?? {}, MAPS[this.n]);
  }

  static DEFAULT_OPTIONS = {
    classes: ["mapas-masmorras", "mm-marker-app"],
    tag: "form",
    window: { icon: "fa-solid fa-location-dot", resizable: true },
    position: { width: 560, height: 720 },
    form: { handler: MarkerEditor.#onSubmit, submitOnChange: false, closeOnSubmit: true },
    actions: guardActions({
      removeActor: MarkerEditor.#onRemoveActor,
      remove: MarkerEditor.#onRemove,
      battle: MarkerEditor.#onBattle,
      areaAround: MarkerEditor.#onAreaAround,
      openScene: MarkerEditor.#onOpenScene
    })
  };

  static PARTS = {
    form: { template: `${TEMPLATES}/marker.hbs`, scrollable: [".mm-scroll"] }
  };

  /** Open the editor of a marker (by id) or a new one at { c, r }. */
  static open(n, id, at = null) {
    if ( !game.user.isGM ) return null;
    const state = getState(n);
    let marker = id ? state.markers.find(m => m.id === id) : null;
    const isNew = !marker;
    if ( !marker ) marker = normalizeMarker({ type: "armadilha", c: at?.c ?? state.party[0], r: at?.r ?? state.party[1], title: "" }, MAPS[n]);
    const appId = `${MODULE_ID}-marcador-${marker.id}`;
    const existing = foundry.applications.instances.get(appId);
    if ( existing ) {
      existing.bringToFront?.();
      return existing;
    }
    const app = new MarkerEditor({ id: appId, n, marker, isNew });
    app.render({ force: true });
    return app;
  }

  get title() {
    return this.isNew ? "Novo marcador" : `Marcador: ${this.draft.title}`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const m = this.draft;
    const map = MAPS[this.n];
    Object.assign(context, {
      m,
      isNew: this.isNew,
      types: choices(MARKER_TYPES, m.type),
      triggers: choices(TRIGGERS, m.trigger),
      cols: map.cols - 1,
      rows: map.rows - 1,
      hasBattle: !!m.battle,
      battle: m.battle ?? { c0: Math.max(0, m.c - 5), r0: Math.max(0, m.r - 5), c1: Math.min(map.cols - 1, m.c + 5), r1: Math.min(map.rows - 1, m.r + 5) },
      actors: m.actors,
      hasActors: m.actors.length > 0,
      scene: m.sceneId ? game.scenes?.get(m.sceneId) ?? null : null
    });
    return context;
  }

  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    const el = this.element;
    el.addEventListener("dragover", event => {
      event.preventDefault();
      el.classList.add("is-dragover");
    });
    el.addEventListener("dragleave", event => {
      if ( !el.contains(event.relatedTarget) ) el.classList.remove("is-dragover");
    });
    el.addEventListener("drop", event => {
      event.preventDefault();
      el.classList.remove("is-dragover");
      this.#onDrop(event).catch(err => reportError(err, "soltar ator"));
    });
  }

  #form() {
    return this.element.tagName === "FORM" ? this.element : this.element.querySelector("form");
  }

  /** Current form values (keeps id, actors and battle area). */
  #current() {
    const v = readForm(this.#form());
    const actors = this.draft.actors.map((a, i) => ({ ...a, count: Number(v[`actorCount${i}`]) || a.count }));
    const battle = v.useBattle ? { c0: v.bc0, r0: v.br0, c1: v.bc1, r1: v.br1 } : null;
    return normalizeMarker({ ...this.draft, ...v, id: this.draft.id, actors, battle, sceneId: this.draft.sceneId, book: this.draft.book }, MAPS[this.n]);
  }

  async #onDrop(event) {
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch {
      return;
    }
    if ( data?.type !== "Actor" || !data.uuid ) {
      ui.notifications.warn(`${MODULE_TITLE}: solte aqui atores da barra lateral (ou de um compêndio).`);
      return;
    }
    const actor = await fromUuid(data.uuid);
    if ( !actor ) return;
    this.draft = this.#current();
    const found = this.draft.actors.find(a => a.uuid === actor.uuid);
    if ( found ) found.count += 1;
    else this.draft.actors.push({ uuid: actor.uuid, name: actor.name, img: actor.img, count: 1 });
    if ( this.draft.type === "nota" || this.draft.type === "area" ) this.draft.type = "encontro";
    this.render();
  }

  static async #onRemoveActor(event, target) {
    const i = Number(target.dataset.index);
    this.draft = this.#current();
    this.draft.actors.splice(i, 1);
    this.render();
  }

  static async #onAreaAround() {
    this.draft = this.#current();
    const map = MAPS[this.n];
    const m = this.draft;
    m.battle = { c0: Math.max(0, m.c - 6), r0: Math.max(0, m.r - 6), c1: Math.min(map.cols - 1, m.c + 6), r1: Math.min(map.rows - 1, m.r + 6) };
    this.render();
  }

  static async #onSubmit() {
    const marker = this.#current();
    const state = getState(this.n);
    const i = state.markers.findIndex(m => m.id === marker.id);
    if ( i >= 0 ) state.markers[i] = marker;
    else state.markers.push(marker);
    await saveState(state);
  }

  static async #onRemove() {
    if ( this.isNew ) return this.close();
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Excluir marcador" },
      content: `<p>Excluir <strong>${escapeHTML(this.draft.title)}</strong> do mapa?</p>`,
      rejectClose: false,
      modal: true
    });
    if ( !ok ) return;
    const state = getState(this.n);
    state.markers = state.markers.filter(m => m.id !== this.draft.id);
    await saveState(state);
    await this.close();
  }

  static async #onBattle() {
    const marker = this.#current();
    const state = getState(this.n);
    const i = state.markers.findIndex(m => m.id === marker.id);
    if ( i >= 0 ) state.markers[i] = marker;
    else state.markers.push(marker);
    await saveState(state);
    const map = MAPS[this.n];
    const rect = marker.battle ?? { c0: Math.max(0, marker.c - 6), r0: Math.max(0, marker.r - 6), c1: Math.min(map.cols - 1, marker.c + 6), r1: Math.min(map.rows - 1, marker.r + 6) };
    const { BattleApp } = await import("./battle.mjs");
    BattleApp.open(this.n, { rect, markerId: marker.id });
    await this.close();
  }

  static async #onOpenScene() {
    const scene = game.scenes?.get(this.draft.sceneId);
    if ( !scene ) throw new Error("A cena desse encontro não existe mais.");
    await scene.view();
  }
}
