/**
 * Mapas-masmorras: constants and small helpers. Labels are Portuguese (no lang files).
 */
export const MODULE_ID = "mapas-masmorras";
export const MODULE_TITLE = "Mapas-masmorras";
export const SOCKET = `module.${MODULE_ID}`;
export const TEMPLATES = `modules/${MODULE_ID}/templates`;
export const QUERY_MOVE = `${MODULE_ID}.mover`;

/** Kinds of marker the GM can place. `color` is the disc on the map. */
export const MARKER_TYPES = {
  armadilha: { label: "Armadilha", color: "#c0392b", glyph: "!", icon: "fa-solid fa-burst" },
  encontro: { label: "Encontro", color: "#7b1f1f", glyph: "⚔", icon: "fa-solid fa-skull" },
  evento: { label: "Evento", color: "#b9770e", glyph: "★", icon: "fa-solid fa-star" },
  tesouro: { label: "Tesouro", color: "#b7950b", glyph: "$", icon: "fa-solid fa-gem" },
  porta: { label: "Porta / passagem", color: "#5d4037", glyph: "D", icon: "fa-solid fa-door-closed" },
  especial: { label: "Especial da masmorra", color: "#6c3483", glyph: "✦", icon: "fa-solid fa-hat-wizard" },
  nota: { label: "Nota", color: "#1f618d", glyph: "i", icon: "fa-solid fa-note-sticky" },
  area: { label: "Área do livro", color: "#145a32", glyph: "#", icon: "fa-solid fa-hashtag" },
  portal: { label: "Portal", color: "#4a235a", glyph: "P", icon: "fa-solid fa-circle-dot" }
};

/** What happens when the party steps on a marker. */
export const TRIGGERS = {
  nenhum: "Nada (só informação)",
  parar: "Para o grupo e avisa o mestre",
  travar: "Para o grupo, avisa o mestre e trava o movimento"
};

/** Simple light presets: how far (in squares) the party sees with line of sight. */
export const LIGHTS = {
  clara: { label: "Clara (12 quadrados)", radius: 12 },
  penumbra: { label: "Penumbra (8 quadrados)", radius: 8 },
  submersa: { label: "Submersa (6 quadrados = 9 m)", radius: 6 },
  escura: { label: "Escura, com tocha (4 quadrados = 6 m)", radius: 4 },
  breu: { label: "Breu (2 quadrados)", radius: 2 }
};

export const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

/** The game's random source when Foundry is there, Math.random otherwise. */
export function random() {
  try {
    const fn = globalThis.CONFIG?.Dice?.randomUniform;
    if ( typeof fn === "function" ) {
      const v = fn();
      if ( Number.isFinite(v) && v >= 0 && v < 1 ) return v;
    }
  } catch {
    /* fall through */
  }
  return Math.random();
}

export const rollDie = faces => 1 + Math.floor(random() * faces);

/* -------------------------------------------- */
/*  Bit layers (base64, bit i = cell i)          */
/* -------------------------------------------- */

const fromB64 = s => {
  if ( typeof atob === "function" ) {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for ( let i = 0; i < bin.length; i++ ) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(globalThis.Buffer.from(s, "base64"));
};
const toB64 = bytes => {
  if ( typeof btoa === "function" ) {
    let bin = "";
    for ( let i = 0; i < bytes.length; i++ ) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  return globalThis.Buffer.from(bytes).toString("base64");
};

/** base64 -> Uint8Array of 0/1 with n entries. */
export function unpackBits(b64, n) {
  const out = new Uint8Array(n);
  if ( !b64 ) return out;
  let bytes;
  try {
    bytes = fromB64(b64);
  } catch {
    return out;
  }
  for ( let i = 0; i < n; i++ ) out[i] = (bytes[i >> 3] >> (i & 7)) & 1;
  return out;
}

/** Uint8Array (or any 0/1 list) -> base64. */
export function packBits(bits) {
  const bytes = new Uint8Array(Math.ceil(bits.length / 8));
  for ( let i = 0; i < bits.length; i++ ) if ( bits[i] ) bytes[i >> 3] |= 1 << (i & 7);
  return toB64(bytes);
}
