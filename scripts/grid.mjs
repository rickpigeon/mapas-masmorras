/**
 * Mapas-masmorras: the grid engine (pure, no Foundry calls; the tests import it).
 * Cells are indexed i = r * cols + c. Floor cells can be walked; thin walls and doors live on
 * the edges between cells (wallR/doorR: right edge of the cell, wallB/doorB: bottom edge).
 * Movement: 8 directions, no corner cutting, doors open. Sight: walls, doors and solid cells block.
 */
import { unpackBits } from "./constants.mjs";

export class Grid {
  /**
   * @param {object} map    entry of MAPS
   * @param {object} edits  { on: [i...], off: [i...] } cells the GM added to / removed from the floor
   */
  constructor(map, edits = {}) {
    this.map = map;
    this.cols = map.cols;
    this.rows = map.rows;
    this.size = map.cols * map.rows;
    const n = this.size;
    this.floor = unpackBits(map.mask, n);
    this.wallR = unpackBits(map.wallR, n);
    this.wallB = unpackBits(map.wallB, n);
    this.doorR = unpackBits(map.doorR, n);
    this.doorB = unpackBits(map.doorB, n);
    for ( const i of edits.on ?? [] ) if ( i >= 0 && i < n ) this.floor[i] = 1;
    for ( const i of edits.off ?? [] ) if ( i >= 0 && i < n ) this.floor[i] = 0;
  }

  idx(c, r) {
    return (c < 0 || r < 0 || c >= this.cols || r >= this.rows) ? -1 : r * this.cols + c;
  }

  cr(i) {
    return [i % this.cols, Math.floor(i / this.cols)];
  }

  walk(i) {
    return i >= 0 && i < this.size && this.floor[i] === 1;
  }

  /** Edge between two orthogonal neighbours: "wall", "door" or null. */
  edge(i, j) {
    const [c1, r1] = this.cr(i);
    const [c2, r2] = this.cr(j);
    if ( r1 === r2 && Math.abs(c1 - c2) === 1 ) {
      const k = c1 < c2 ? i : j;
      if ( this.wallR[k] ) return "wall";
      if ( this.doorR[k] ) return "door";
      return null;
    }
    if ( c1 === c2 && Math.abs(r1 - r2) === 1 ) {
      const k = r1 < r2 ? i : j;
      if ( this.wallB[k] ) return "wall";
      if ( this.doorB[k] ) return "door";
      return null;
    }
    return "wall";
  }

  /** One orthogonal step: both cells floor and no wall between (doors can be crossed). */
  canStep(i, j) {
    return this.walk(i) && this.walk(j) && this.edge(i, j) !== "wall";
  }

  /** Neighbours a walker can move to (diagonals only when both orthogonal ways are open). */
  moves(i) {
    const [c, r] = this.cr(i);
    const out = [];
    for ( const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] ) {
      const j = this.idx(c + dc, r + dr);
      if ( j >= 0 && this.canStep(i, j) ) out.push(j);
    }
    for ( const [dc, dr] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] ) {
      const j = this.idx(c + dc, r + dr);
      const a = this.idx(c + dc, r);
      const b = this.idx(c, r + dr);
      if ( j < 0 || a < 0 || b < 0 || !this.walk(j) ) continue;
      if ( this.canStep(i, a) && this.canStep(a, j) && this.canStep(i, b) && this.canStep(b, j) ) out.push(j);
    }
    return out;
  }

  /**
   * Shortest walk (breadth first). `allowed(i)` limits the cells used (players only walk what they know).
   * Returns the cells from `from` to `to` (both included) or null.
   */
  path(from, to, allowed = null) {
    if ( !this.walk(from) || !this.walk(to) ) return null;
    if ( from === to ) return [from];
    const prev = new Int32Array(this.size).fill(-1);
    prev[from] = from;
    const queue = [from];
    for ( let h = 0; h < queue.length; h++ ) {
      const i = queue[h];
      for ( const j of this.moves(i) ) {
        if ( prev[j] !== -1 ) continue;
        if ( allowed && j !== to && !allowed(j) ) continue;
        prev[j] = i;
        if ( j === to ) {
          const out = [to];
          for ( let k = i; k !== from; k = prev[k] ) out.push(k);
          out.push(from);
          return out.reverse();
        }
        queue.push(j);
      }
    }
    return null;
  }

  /** Does the edge between two orthogonal neighbours stop sight? (walls and closed doors do) */
  blocksSight(i, j) {
    return this.edge(i, j) !== null;
  }

  /**
   * Cells seen from `from` within `radius` squares, with line of sight (centre to centre).
   * Floor cells are seen through floor; the first solid cell on a line is seen too (its wall face).
   * Returns a Uint8Array (1 = seen).
   */
  visible(from, radius) {
    const seen = new Uint8Array(this.size);
    if ( from < 0 || from >= this.size ) return seen;
    seen[from] = 1;
    const [sc, sr] = this.cr(from);
    const R = Math.max(0, radius);
    const rr = Math.ceil(R) + 1;
    for ( let r = sr - rr; r <= sr + rr; r++ ) {
      for ( let c = sc - rr; c <= sc + rr; c++ ) {
        const t = this.idx(c, r);
        if ( t < 0 || t === from ) continue;
        if ( Math.hypot(c - sc, r - sr) > R + 0.5 ) continue;
        if ( this.lineOfSight(sc, sr, c, r) ) seen[t] = 1;
      }
    }
    return seen;
  }

  /** Grid walk (Amanatides & Woo) from the centre of (c0,r0) to the centre of (c1,r1). */
  lineOfSight(c0, r0, c1, r1) {
    let c = c0;
    let r = r0;
    const dx = c1 - c0;
    const dy = r1 - r0;
    const stepC = Math.sign(dx);
    const stepR = Math.sign(dy);
    const tDeltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDeltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
    let tMaxX = dx !== 0 ? 0.5 * tDeltaX : Infinity;
    let tMaxY = dy !== 0 ? 0.5 * tDeltaY : Infinity;
    const target = this.idx(c1, r1);
    for ( let guard = 0; guard < 400; guard++ ) {
      if ( c === c1 && r === r1 ) return true;
      const cur = this.idx(c, r);
      if ( cur !== this.idx(c0, r0) && !this.walk(cur) ) return false;
      const eps = 1e-9;
      if ( Math.abs(tMaxX - tMaxY) < eps ) {
        /* through a corner: blocked only if both ways round are blocked */
        const a = this.idx(c + stepC, r);
        const b = this.idx(c, r + stepR);
        const n = this.idx(c + stepC, r + stepR);
        const viaA = a >= 0 && (a === target || this.walk(a)) && !this.blocksSight(cur, a) && (a === target || !this.blocksSight(a, n));
        const viaB = b >= 0 && (b === target || this.walk(b)) && !this.blocksSight(cur, b) && (b === target || !this.blocksSight(b, n));
        if ( !viaA && !viaB ) return false;
        c += stepC;
        r += stepR;
        tMaxX += tDeltaX;
        tMaxY += tDeltaY;
      }
      else if ( tMaxX < tMaxY ) {
        const n = this.idx(c + stepC, r);
        if ( n < 0 || this.blocksSight(cur, n) ) return false;
        c += stepC;
        tMaxX += tDeltaX;
      }
      else {
        const n = this.idx(c, r + stepR);
        if ( n < 0 || this.blocksSight(cur, n) ) return false;
        r += stepR;
        tMaxY += tDeltaY;
      }
    }
    return false;
  }

  /**
   * Walls of a rectangle of cells for a battle scene, in cell units relative to (c0, r0):
   * borders between floor and solid cells (or the rectangle edge), thin walls, and doors.
   * Collinear pieces of the same kind are merged. Returns [{ x0, y0, x1, y1, door }].
   */
  battleWalls(c0, r0, c1, r1) {
    const segs = [];
    const inside = (c, r) => c >= c0 && c <= c1 && r >= r0 && r <= r1;
    const floorIn = (c, r) => inside(c, r) && this.walk(this.idx(c, r));
    for ( let r = r0; r <= r1; r++ ) {
      for ( let c = c0; c <= c1; c++ ) {
        if ( !floorIn(c, r) ) continue;
        const i = this.idx(c, r);
        const x = c - c0;
        const y = r - r0;
        /* right edge */
        if ( !floorIn(c + 1, r) ) segs.push({ x0: x + 1, y0: y, x1: x + 1, y1: y + 1, door: false });
        else if ( this.wallR[i] ) segs.push({ x0: x + 1, y0: y, x1: x + 1, y1: y + 1, door: false });
        else if ( this.doorR[i] ) segs.push({ x0: x + 1, y0: y, x1: x + 1, y1: y + 1, door: true });
        /* bottom edge */
        if ( !floorIn(c, r + 1) ) segs.push({ x0: x, y0: y + 1, x1: x + 1, y1: y + 1, door: false });
        else if ( this.wallB[i] ) segs.push({ x0: x, y0: y + 1, x1: x + 1, y1: y + 1, door: false });
        else if ( this.doorB[i] ) segs.push({ x0: x, y0: y + 1, x1: x + 1, y1: y + 1, door: true });
        /* left and top edges only against solid cells (floor neighbours were handled from their side) */
        if ( !floorIn(c - 1, r) ) segs.push({ x0: x, y0: y, x1: x, y1: y + 1, door: false });
        if ( !floorIn(c, r - 1) ) segs.push({ x0: x, y0: y, x1: x + 1, y1: y, door: false });
      }
    }
    return mergeSegments(segs);
  }
}

/** Merge touching collinear unit segments of the same kind (walls stay walls, doors stay single). */
export function mergeSegments(segs) {
  const key = s => `${s.door ? "d" : "w"}|${s.x0 === s.x1 ? `v${s.x0}` : `h${s.y0}`}`;
  const groups = new Map();
  for ( const s of segs ) {
    const k = key(s);
    if ( !groups.has(k) ) groups.set(k, []);
    groups.get(k).push(s);
  }
  const out = [];
  for ( const [k, list] of groups ) {
    const vertical = k.includes("|v");
    const door = k.startsWith("d");
    const spans = list.map(s => (vertical ? [Math.min(s.y0, s.y1), Math.max(s.y0, s.y1)] : [Math.min(s.x0, s.x1), Math.max(s.x0, s.x1)]))
      .sort((a, b) => a[0] - b[0]);
    const fixed = vertical ? list[0].x0 : list[0].y0;
    let cur = null;
    const flush = () => {
      if ( !cur ) return;
      out.push(vertical ? { x0: fixed, y0: cur[0], x1: fixed, y1: cur[1], door } : { x0: cur[0], y0: fixed, x1: cur[1], y1: fixed, door });
    };
    for ( const sp of spans ) {
      /* doors are never merged: each door edge stays its own door */
      if ( cur && !door && sp[0] <= cur[1] ) cur[1] = Math.max(cur[1], sp[1]);
      else {
        flush();
        cur = [sp[0], sp[1]];
      }
    }
    flush();
  }
  return out;
}
