/**
 * Mapas-masmorras: drawing the map on a <canvas>.
 * Image coordinates are the pixels of the map image; the view maps them to the screen (scale + offset).
 * The players' image is a copy of the map with the GM print removed (area numbers, "porta secreta",
 * Oceano's E/A marks), cloned from nearby floor.
 */
import { MARKER_TYPES } from "./constants.mjs";

/* -------------------------------------------- */
/*  Images                                      */
/* -------------------------------------------- */

const cache = new Map();

/** Load (once) the map image. Calls `onReady` when it arrives (or fails). */
export function loadImage(src, onReady) {
  let entry = cache.get(src);
  if ( !entry ) {
    entry = { src, img: new Image(), ready: false, error: false, player: null, waiters: new Set() };
    cache.set(src, entry);
    entry.img.onload = () => {
      entry.ready = true;
      for ( const fn of entry.waiters ) fn(entry);
      entry.waiters.clear();
    };
    entry.img.onerror = () => {
      entry.error = true;
      for ( const fn of entry.waiters ) fn(entry);
      entry.waiters.clear();
    };
    entry.img.src = src;
  }
  if ( (entry.ready || entry.error) ) return entry;
  if ( onReady ) entry.waiters.add(onReady);
  return entry;
}

export function forgetImage(src) {
  cache.delete(src);
}

/**
 * The players' copy of the map: every patch replaced with floor from `dx,dy` away (or a flat floor
 * colour with grid dots), only inside floor cells, so walls next to a label are kept.
 */
export function playerImage(entry, map, grid) {
  if ( entry.player ) return entry.player;
  const img = entry.img;
  const cv = document.createElement("canvas");
  cv.width = img.naturalWidth || map.w;
  cv.height = img.naturalHeight || map.h;
  const ctx = cv.getContext("2d");
  ctx.drawImage(img, 0, 0, cv.width, cv.height);
  const sx = cv.width / map.w;
  const sy = cv.height / map.h;
  for ( const p of map.patches ) {
    ctx.save();
    ctx.scale(sx, sy);
    ctx.beginPath();
    if ( p.k === "c" ) ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    else ctx.rect(p.x, p.y, p.w, p.h);
    ctx.clip();
    if ( p.k === "c" ) {
      /* only inside floor cells */
      ctx.beginPath();
      const c0 = Math.floor((p.x - p.r - map.ox) / map.cell);
      const c1 = Math.floor((p.x + p.r - map.ox) / map.cell);
      const r0 = Math.floor((p.y - p.r - map.oy) / map.cell);
      const r1 = Math.floor((p.y + p.r - map.oy) / map.cell);
      for ( let r = r0; r <= r1; r++ ) {
        for ( let c = c0; c <= c1; c++ ) {
          if ( grid.walk(grid.idx(c, r)) ) ctx.rect(map.ox + c * map.cell - 0.5, map.oy + r * map.cell - 0.5, map.cell + 1, map.cell + 1);
        }
      }
      ctx.clip();
    }
    if ( p.fill ) {
      ctx.fillStyle = `rgb(${p.fill[0]},${p.fill[1]},${p.fill[2]})`;
      ctx.fillRect(p.x - (p.r ?? 0) - 2, p.y - (p.r ?? 0) - 2, (p.r ?? 0) * 2 + 4, (p.r ?? 0) * 2 + 4);
      /* the printed grid dots */
      ctx.fillStyle = `rgba(${Math.round(p.fill[0] * 0.55)},${Math.round(p.fill[1] * 0.55)},${Math.round(p.fill[2] * 0.55)},0.8)`;
      for ( let y = map.oy; y < map.h; y += map.cell ) {
        if ( Math.abs(y - p.y) > p.r + 2 ) continue;
        for ( let x = map.ox; x < map.w; x += map.cell ) if ( Math.abs(x - p.x) <= p.r + 2 ) ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
      }
    }
    else {
      const w = p.k === "c" ? p.r * 2 + 2 : p.w;
      const h = p.k === "c" ? p.r * 2 + 2 : p.h;
      const x = p.k === "c" ? p.x - p.r - 1 : p.x;
      const y = p.k === "c" ? p.y - p.r - 1 : p.y;
      ctx.drawImage(img, (x + p.dx) * sx, (y + p.dy) * sy, w * sx, h * sy, x, y, w, h);
    }
    ctx.restore();
  }
  entry.player = cv;
  return cv;
}

/* -------------------------------------------- */
/*  Fog and light                               */
/* -------------------------------------------- */

/**
 * Per-cell darkness. Solid cells take the state of their brightest floor neighbour, so walls next
 * to what was seen show. Seen cells get a little darker towards the edge of the light.
 */
export function fogCanvas(map, grid, explored, seen, party, radius, gmView) {
  const { cols, rows } = map;
  const cv = document.createElement("canvas");
  cv.width = cols;
  cv.height = rows;
  const ctx = cv.getContext("2d");
  const data = ctx.createImageData(cols, rows);
  const A_UNKNOWN = gmView ? 0.55 : 1;
  const A_MEMORY = gmView ? 0.32 : 0.6;
  const [pc, pr] = party;
  const level = i => (seen[i] ? 2 : explored[i] ? 1 : 0);
  for ( let r = 0; r < rows; r++ ) {
    for ( let c = 0; c < cols; c++ ) {
      const i = r * cols + c;
      let lv = level(i);
      if ( !grid.walk(i) && lv < 2 ) {
        for ( let dr = -1; dr <= 1; dr++ ) {
          for ( let dc = -1; dc <= 1; dc++ ) {
            const j = grid.idx(c + dc, r + dr);
            if ( j >= 0 && grid.walk(j) ) lv = Math.max(lv, level(j));
          }
        }
      }
      let a;
      if ( lv === 2 ) {
        const d = Math.hypot(c - pc, r - pr) / Math.max(1, radius);
        a = Math.min(0.45, 0.42 * d * d) * (gmView ? 0.6 : 1);
      }
      else a = lv === 1 ? A_MEMORY : A_UNKNOWN;
      const o = i * 4;
      data.data[o] = 8;
      data.data[o + 1] = 6;
      data.data[o + 2] = 14;
      data.data[o + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(data, 0, 0);
  return { cv, outside: A_UNKNOWN };
}

/* -------------------------------------------- */
/*  Frame                                       */
/* -------------------------------------------- */

/**
 * opts: { ctx, width, height, view: {scale, x, y}, map, grid, image (canvas|img|null), fog, markers,
 *         party: {x, y} (image px), partyImg, gm, hover: cell|-1, path: [cells], rect: {c0,r0,c1,r1}|null,
 *         brush: Uint8Array|null, floorEdit: bool, message }
 */
export function drawFrame(o) {
  const { ctx, width, height, view, map } = o;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#08060e";
  ctx.fillRect(0, 0, width, height);
  if ( !o.image ) {
    ctx.fillStyle = "#d9cfb8";
    ctx.font = "16px Signika, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(o.message ?? "Carregando o mapa…", width / 2, height / 2);
    return;
  }
  ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(o.image, 0, 0, map.w, map.h);
  const cell = map.cell;
  const gx = map.ox;
  const gy = map.oy;
  const gw = map.cols * cell;
  const gh = map.rows * cell;

  /* floor editing view */
  if ( o.floorEdit ) {
    for ( let r = 0; r < map.rows; r++ ) {
      for ( let c = 0; c < map.cols; c++ ) {
        const i = r * map.cols + c;
        ctx.fillStyle = o.grid.walk(i) ? "rgba(60,200,90,0.28)" : "rgba(200,40,40,0.12)";
        ctx.fillRect(gx + c * cell, gy + r * cell, cell, cell);
      }
    }
    ctx.lineWidth = 2 / view.scale;
    for ( let i = 0; i < o.grid.size; i++ ) {
      const [c, r] = o.grid.cr(i);
      if ( o.grid.wallR[i] || o.grid.doorR[i] ) {
        ctx.strokeStyle = o.grid.wallR[i] ? "rgba(220,30,30,0.9)" : "rgba(255,200,0,0.95)";
        ctx.beginPath();
        ctx.moveTo(gx + (c + 1) * cell, gy + r * cell);
        ctx.lineTo(gx + (c + 1) * cell, gy + (r + 1) * cell);
        ctx.stroke();
      }
      if ( o.grid.wallB[i] || o.grid.doorB[i] ) {
        ctx.strokeStyle = o.grid.wallB[i] ? "rgba(220,30,30,0.9)" : "rgba(255,200,0,0.95)";
        ctx.beginPath();
        ctx.moveTo(gx + c * cell, gy + (r + 1) * cell);
        ctx.lineTo(gx + (c + 1) * cell, gy + (r + 1) * cell);
        ctx.stroke();
      }
    }
  }

  /* fog: a tiny canvas (one pixel per cell) stretched with smoothing gives soft edges */
  if ( o.fog ) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(o.fog.cv, gx, gy, gw, gh);
    ctx.fillStyle = `rgba(8,6,14,${o.fog.outside})`;
    ctx.fillRect(0, 0, map.w, gy);
    ctx.fillRect(0, gy + gh, map.w, map.h - gy - gh);
    ctx.fillRect(0, gy, gx, gh);
    ctx.fillRect(gx + gw, gy, map.w - gx - gw, gh);
    ctx.restore();
  }

  /* hover and path */
  if ( o.path?.length > 1 ) {
    ctx.fillStyle = o.pathOk === false ? "rgba(220,60,60,0.85)" : "rgba(255,230,140,0.9)";
    for ( const i of o.path.slice(1) ) {
      const [c, r] = o.grid.cr(i);
      ctx.beginPath();
      ctx.arc(gx + (c + 0.5) * cell, gy + (r + 0.5) * cell, cell * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if ( o.hover >= 0 ) {
    const [c, r] = o.grid.cr(o.hover);
    ctx.strokeStyle = "rgba(255,240,200,0.9)";
    ctx.lineWidth = 1.5 / view.scale;
    ctx.strokeRect(gx + c * cell + 0.5, gy + r * cell + 0.5, cell - 1, cell - 1);
  }
  if ( o.brush ) {
    ctx.fillStyle = "rgba(120,200,255,0.25)";
    for ( let i = 0; i < o.brush.length; i++ ) {
      if ( !o.brush[i] ) continue;
      const [c, r] = o.grid.cr(i);
      ctx.fillRect(gx + c * cell, gy + r * cell, cell, cell);
    }
  }
  if ( o.rect ) {
    const { c0, r0, c1, r1 } = o.rect;
    ctx.fillStyle = "rgba(190,40,40,0.15)";
    ctx.strokeStyle = "rgba(240,80,60,0.95)";
    ctx.lineWidth = 2 / view.scale;
    ctx.fillRect(gx + c0 * cell, gy + r0 * cell, (c1 - c0 + 1) * cell, (r1 - r0 + 1) * cell);
    ctx.strokeRect(gx + c0 * cell, gy + r0 * cell, (c1 - c0 + 1) * cell, (r1 - r0 + 1) * cell);
  }

  /* markers */
  for ( const m of o.markers ) {
    const type = MARKER_TYPES[m.type] ?? MARKER_TYPES.nota;
    const x = gx + (m.c + 0.5) * cell;
    const y = gy + (m.r + 0.5) * cell;
    const rad = Math.max(cell * 0.36, 9 / view.scale);
    ctx.save();
    ctx.globalAlpha = o.gm && !m.revealed ? 0.78 : 1;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fillStyle = m.done ? "#6d6d6d" : type.color;
    ctx.fill();
    ctx.lineWidth = Math.max(1, 1.6 / view.scale) + 0.6;
    ctx.strokeStyle = "#f6edd9";
    if ( o.gm && !m.revealed ) ctx.setLineDash([3 / view.scale + 1, 2 / view.scale + 1]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.max(cell * 0.42, 11 / view.scale).toFixed(1)}px Signika, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(m.label || type.glyph, x, y + 0.5);
    if ( o.gm && m.trigger !== "nenhum" && !m.triggered ) {
      ctx.beginPath();
      ctx.arc(x + rad * 0.8, y - rad * 0.8, rad * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = m.trigger === "travar" ? "#e74c3c" : "#f1c40f";
      ctx.fill();
    }
    ctx.restore();
  }

  /* the party */
  if ( o.party ) {
    const { x, y } = o.party;
    const rad = Math.max(cell * 0.46, 12 / view.scale);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fillStyle = "#5b2c83";
    ctx.fill();
    ctx.shadowBlur = 0;
    if ( o.partyImg ) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, rad - 1.5, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(o.partyImg, x - rad, y - rad, rad * 2, rad * 2);
      ctx.restore();
    }
    else {
      ctx.fillStyle = "#f6edd9";
      for ( const [dx, dy] of [[-0.4, 0.17], [0.4, 0.17], [0, -0.35]] ) {
        ctx.beginPath();
        ctx.arc(x + dx * rad, y + dy * rad, rad * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "#f6edd9";
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
