/**
 * Mapas-masmorras: socket messages from the GM to everybody on `module.mapas-masmorras`.
 *   { type: "open", n, from }   open the map of dungeon n (it is also made the current dungeon)
 *   { type: "close", from }     close the map window (a battle scene is starting)
 * Only messages sent by a GM are obeyed.
 */
import { MODULE_ID, MODULE_TITLE, SOCKET } from "./constants.mjs";
import { reportError } from "./errors.mjs";
import { MapApp } from "./map-app.mjs";

export async function showToAll(n) {
  if ( !game.user.isGM ) return;
  await game.settings.set(MODULE_ID, "atual", Number(n));
  game.socket.emit(SOCKET, { type: "open", n: Number(n), from: game.user.id });
  MapApp.open({ n });
  ui.notifications.info(`${MODULE_TITLE}: mapa aberto para todos os jogadores.`);
}

export function closeForAll() {
  if ( !game.user.isGM ) return;
  game.socket.emit(SOCKET, { type: "close", from: game.user.id });
}

export function listenSocket() {
  game.socket.on(SOCKET, data => {
    try {
      if ( !data || typeof data !== "object" ) return;
      if ( !game.users.get(data.from)?.isGM ) return;
      if ( data.type === "open" ) MapApp.open({ n: Number(data.n) });
      else if ( data.type === "close" && !game.user.isGM ) foundry.applications.instances.get(`${MODULE_ID}-mapa`)?.close();
    } catch ( err ) {
      reportError(err, "socket");
    }
  });
}
