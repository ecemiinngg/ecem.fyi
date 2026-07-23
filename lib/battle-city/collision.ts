// ── Physics & Collision Agent ────────────────────────────────────
// AABB çarpışma testleri, tank hareket çözümü (köşe yuvarlama dahil)
// ve arazi geçilebilirlik kuralları. Diğer ajanlar buradan sorar.

import {
  DX, DY, FIELD, GRID, SUB, TANK, Tile,
  type GameState, type Tank,
} from './types';
import { tileAt } from './map';

export function overlaps(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// Tanklar için geçilmez araziler (PRD: çalı ve buz geçilir)
function tankBlocked(t: Tile): boolean {
  return t === Tile.BRICK || t === Tile.STEEL || t === Tile.WATER || t === Tile.HQ;
}

// Mermiyi durduran araziler (su ve çalının üzerinden geçer)
export function bulletStops(t: Tile): boolean {
  return t === Tile.BRICK || t === Tile.STEEL || t === Tile.HQ;
}

export function canTankMoveTo(map: Uint8Array, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x + TANK > FIELD || y + TANK > FIELD) return false;
  const cx0 = Math.floor(x / SUB);
  const cy0 = Math.floor(y / SUB);
  const cx1 = Math.floor((x + TANK - 0.01) / SUB);
  const cy1 = Math.floor((y + TANK - 0.01) / SUB);
  for (let cy = cy0; cy <= cy1; cy++)
    for (let cx = cx0; cx <= cx1; cx++)
      if (tankBlocked(tileAt(map, cx, cy))) return false;
  return true;
}

// Tankın merkezi buz üzerinde mi?
export function tankOnIce(map: Uint8Array, t: Tank): boolean {
  const cx = Math.floor((t.x + TANK / 2) / SUB);
  const cy = Math.floor((t.y + TANK / 2) / SUB);
  return tileAt(map, cx, cy) === Tile.ICE;
}

// self: 'player' veya düşman id'si — kendisiyle çarpışmayı atla
function hitsOtherTank(state: GameState, x: number, y: number, self: 'player' | number): boolean {
  if (self !== 'player' && state.playerAlive) {
    const p = state.player;
    if (overlaps(x, y, TANK, TANK, p.x, p.y, TANK, TANK)) return true;
  }
  for (const e of state.enemies) {
    if (self !== 'player' && e.id === self) continue;
    if (overlaps(x, y, TANK, TANK, e.x, e.y, TANK, TANK)) return true;
  }
  return false;
}

export function positionFree(state: GameState, x: number, y: number, self: 'player' | number): boolean {
  return canTankMoveTo(state.map, x, y) && !hitsOtherTank(state, x, y, self);
}

// Yön 90° değişince grid'e oturt (PRD: köşelere takılmama mekanizması)
export function setTankDir(t: Tank, d: import('./types').Dir) {
  if (t.dir % 2 !== d % 2) {
    t.x = Math.round(t.x / SUB) * SUB;
    t.y = Math.round(t.y / SUB) * SUB;
  }
  t.dir = d;
}

// Tankı yönünde ilerletmeyi dene; tıkanırsa dik eksende en yakın
// grid çizgisine doğru kaydırarak köşeyi yuvarla.
export function moveTank(state: GameState, t: Tank, dist: number, self: 'player' | number): boolean {
  const nx = t.x + DX[t.dir] * dist;
  const ny = t.y + DY[t.dir] * dist;
  if (positionFree(state, nx, ny, self)) {
    t.x = nx; t.y = ny;
    return true;
  }

  // köşe yuvarlama: dik eksendeki sapmayı grid'e doğru azalt
  if (t.dir === 0 || t.dir === 2) {
    const target = Math.round(t.x / SUB) * SUB;
    if (target !== t.x) {
      const step = Math.sign(target - t.x) * Math.min(dist, Math.abs(target - t.x));
      if (positionFree(state, t.x + step, t.y, self)) {
        t.x += step;
        return true;
      }
    }
  } else {
    const target = Math.round(t.y / SUB) * SUB;
    if (target !== t.y) {
      const step = Math.sign(target - t.y) * Math.min(dist, Math.abs(target - t.y));
      if (positionFree(state, t.x, t.y + step, self)) {
        t.y += step;
        return true;
      }
    }
  }
  return false;
}
