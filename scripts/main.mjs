/**
 * Mapas-masmorras: entry point.
 * Opening the map (everybody): the "Mapas-masmorras" button in the Token controls, a keybinding
 * (unassigned by default) or `game.modules.get("mapas-masmorras").api.open()`.
 */
import { MODULE_ID, MODULE_TITLE } from "./constants.mjs";
import { MAPS } from "./maps-data.mjs";
import { currentDungeon, getState, registerSettings } from "./state.mjs";
import { MapApp } from "./map-app.mjs";
import { listenSocket, showToAll } from "./broadcast.mjs";
import { registerQueries, requestMove } from "./moves.mjs";
import { watchUncaught } from "./errors.mjs";

let timer = null;
function scheduleRefresh() {
  clearTimeout(timer);
  timer = setTimeout(() => MapApp.refresh(), 30);
}

Hooks.once("init", () => {
  watchUncaught();
  registerSettings(scheduleRefresh);
  registerQueries();
  game.keybindings.register(MODULE_ID, "abrir", {
    name: "Abrir o mapa da masmorra",
    editable: [],
    restricted: false,
    onDown: () => {
      MapApp.open();
      return true;
    }
  });
});

Hooks.once("ready", () => {
  listenSocket();
  const module = game.modules.get(MODULE_ID);
  if ( module ) {
    module.api = {
      /** Open the map (GM: optionally another dungeon, 1-20). */
      open: n => MapApp.open({ n }),
      /** GM: make dungeon n the current one and open it for everybody. */
      show: n => showToAll(n ?? currentDungeon()),
      /** Copy of a dungeon's state. */
      state: n => getState(n ?? currentDungeon()),
      /** Move the party to column c, row r (GM moves; a player asks the GM). */
      move: (n, c, r) => requestMove(n, r * MAPS[n].cols + c)
    };
  }
});

function onSettingChanged(setting) {
  if ( String(setting?.key ?? "").startsWith(`${MODULE_ID}.`) ) scheduleRefresh();
}
Hooks.on("createSetting", onSettingChanged);
Hooks.on("updateSetting", onSettingChanged);

/* v13: controls is a record of controls, each with a record of tools. Visible to everybody. */
Hooks.on("getSceneControlButtons", controls => {
  const tokens = controls?.tokens;
  if ( !tokens?.tools ) return;
  tokens.tools.mapasMasmorras = {
    name: "mapasMasmorras",
    title: MODULE_TITLE,
    icon: "fa-solid fa-dungeon",
    order: Object.keys(tokens.tools).length,
    button: true,
    visible: true,
    onChange: () => MapApp.open()
  };
});
