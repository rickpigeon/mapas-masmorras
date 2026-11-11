/**
 * Mapas-masmorras: moving the party. The GM's client is the authority: players ask through
 * `CONFIG.queries["mapas-masmorras.mover"]` (answered by the active GM), the GM moves directly.
 * A move walks the shortest known path and stops on the first marker with a trigger.
 */
import { MODULE_TITLE, QUERY_MOVE, escapeHTML } from "./constants.mjs";
import { MAPS } from "./maps-data.mjs";
import { DUNGEONS } from "./dungeons.mjs";
import { currentDungeon, exploreFrom, exploredBits, getState, gridFor, saveState, sightRadius } from "./state.mjs";

/** Whisper to every GM (plain chat card, no roll modes involved). */
export async function whisperGM(html) {
  const gms = game.users.filter(u => u.isGM).map(u => u.id);
  const cls = CONFIG.ChatMessage?.documentClass ?? globalThis.ChatMessage;
  return cls.create({ content: `<div class="mapas-masmorras mm-chat">${html}</div>`, whisper: gms, speaker: { alias: MODULE_TITLE } });
}

/**
 * Run a move on this (GM) client.
 * @returns {Promise<{ok: boolean, reason?: string, steps?: number, stoppedAt?: object}>}
 */
export async function performMove(n, target, { isGM = false, userName = "" } = {}) {
  if ( !game.user.isGM ) return { ok: false, reason: "Só o mestre executa movimentos." };
  if ( !MAPS[n] ) return { ok: false, reason: "Masmorra desconhecida." };
  const state = getState(n);
  const grid = gridFor(n, state);
  if ( !isGM && state.locked ) return { ok: false, reason: "O mestre travou o movimento." };
  if ( !isGM && n !== currentDungeon() ) return { ok: false, reason: "Essa não é a masmorra atual." };
  const from = grid.idx(state.party[0], state.party[1]);
  if ( !grid.walk(target) ) return { ok: false, reason: "Não dá para andar aí." };
  let allowed = null;
  if ( !isGM ) {
    const known = exploredBits(state);
    const seen = grid.visible(from, sightRadius(state));
    allowed = i => known[i] === 1 || seen[i] === 1;
    if ( !allowed(target) ) return { ok: false, reason: "Vocês ainda não conhecem esse lugar." };
  }
  let path = grid.path(from, target, allowed);
  if ( !path ) return { ok: false, reason: "Não há caminho conhecido até lá." };
  let limited = false;
  if ( !isGM && state.maxSteps > 0 && path.length - 1 > state.maxSteps ) {
    path = path.slice(0, state.maxSteps + 1);
    limited = true;
  }
  /* walk until a marker with a trigger */
  let stoppedAt = null;
  const walked = [path[0]];
  for ( let k = 1; k < path.length; k++ ) {
    const cell = path[k];
    walked.push(cell);
    const [c, r] = grid.cr(cell);
    const hit = state.markers.find(m => m.c === c && m.r === r && m.trigger !== "nenhum" && !m.triggered && !m.done);
    if ( hit ) {
      stoppedAt = hit;
      hit.triggered = true;
      if ( hit.revealOnTrigger ) hit.revealed = true;
      if ( hit.trigger === "travar" ) state.locked = true;
      break;
    }
  }
  const last = walked[walked.length - 1];
  state.party = grid.cr(last);
  state.move = { path: walked, at: Date.now() };
  exploreFrom(state, grid, state.remember ? walked : [last]);
  await saveState(state);
  if ( stoppedAt ) {
    const info = DUNGEONS[n];
    const who = userName ? ` (movido por ${escapeHTML(userName)})` : "";
    await whisperGM(`<strong>${escapeHTML(stoppedAt.title)}</strong>: o grupo parou aqui no Desafio de ${escapeHTML(info.god)}${who}.${stoppedAt.trigger === "travar" ? " O movimento foi travado." : ""}${stoppedAt.gmText ? `<br><small>${escapeHTML(stoppedAt.gmText)}</small>` : ""}`);
    ui.notifications.info(`${MODULE_TITLE}: o grupo parou em "${stoppedAt.title}".`);
  }
  return {
    ok: true,
    steps: walked.length - 1,
    limited,
    stoppedAt: stoppedAt ? { title: stoppedAt.revealed ? stoppedAt.title : "", text: stoppedAt.revealed ? stoppedAt.playerText : "" } : null
  };
}

/** Register the query handler (every client registers it; only GMs are asked). */
export function registerQueries() {
  CONFIG.queries[QUERY_MOVE] = async data => {
    const n = Number(data?.n);
    const target = Number(data?.target);
    const user = game.users.get(data?.userId);
    return performMove(n, target, { isGM: false, userName: user?.name ?? "" });
  };
}

/** Ask for a move: the GM moves directly, a player asks the active GM. */
export async function requestMove(n, target) {
  if ( game.user.isGM ) return performMove(n, target, { isGM: true });
  const gm = game.users.activeGM;
  if ( !gm ) {
    ui.notifications.warn(`${MODULE_TITLE}: nenhum mestre conectado para mover o grupo.`);
    return { ok: false, reason: "Nenhum mestre conectado." };
  }
  const res = await gm.query(QUERY_MOVE, { n, target, userId: game.user.id }, { timeout: 10000 });
  if ( !res?.ok ) ui.notifications.warn(`${MODULE_TITLE}: ${res?.reason ?? "o mestre não respondeu."}`);
  else if ( res.stoppedAt ) ui.notifications.info(`${MODULE_TITLE}: o grupo parou${res.stoppedAt.title ? `: ${res.stoppedAt.title}` : ". Algo chamou a atenção do mestre."}`);
  else if ( res.limited ) ui.notifications.info(`${MODULE_TITLE}: o grupo andou só até o limite de passos.`);
  return res;
}

