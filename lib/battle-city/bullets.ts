// ── Projectile & FX Agent ────────────────────────────────────────
// Mermi ömrü, mermi-arazi/tank/mermi çarpışma sonuçları ve patlama
// efektleri. Sonuçlar events kanalıyla Game State ajanına bildirilir.

import {
  DX, DY, FIELD, SUB, TANK, Tile,
  type Bullet, type Dir, type GameState, type Tank,
} from './types';
import { setTile, tileAt } from './map';
import { bulletStops, overlaps } from './collision';
import { sfxShoot } from './sfx';

export const BULLET_SIZE = 6;

export function addExplosion(state: GameState, x: number, y: number, big: boolean) {
  state.explosions.push({ x, y, t: 0, dur: big ? 0.5 : 0.25, big });
}

export function addPopup(state: GameState, x: number, y: number, text: string) {
  state.popups.push({ x, y, text, t: 0 });
}

export function fireFromTank(
  state: GameState,
  tank: Tank,
  opts: { fromPlayer: boolean; ownerId: number; speed: number; power: number },
) {
  const cx = tank.x + TANK / 2 + DX[tank.dir] * (TANK / 2);
  const cy = tank.y + TANK / 2 + DY[tank.dir] * (TANK / 2);
  state.bullets.push({
    x: cx, y: cy, dir: tank.dir,
    speed: opts.speed,
    fromPlayer: opts.fromPlayer,
    ownerId: opts.ownerId,
    power: opts.power,
  });
  if (opts.fromPlayer) sfxShoot();
}

// Tuğlayı mermi genişliğinde, dik eksende 2 hücrelik şerit halinde aşındır
function erodeAt(state: GameState, b: Bullet, cx: number, cy: number, t: Tile) {
  const destroyable = t === Tile.BRICK || (t === Tile.STEEL && b.power >= 2);
  if (!destroyable) return;
  setTile(state.map, cx, cy, Tile.EMPTY);
  if (b.dir === 0 || b.dir === 2) {
    const off = b.x - cx * SUB;
    const nx = off < SUB / 2 ? cx - 1 : cx + 1;
    const nt = tileAt(state.map, nx, cy);
    if (nt === Tile.BRICK || (nt === Tile.STEEL && b.power >= 2)) setTile(state.map, nx, cy, Tile.EMPTY);
  } else {
    const off = b.y - cy * SUB;
    const ny = off < SUB / 2 ? cy - 1 : cy + 1;
    const nt = tileAt(state.map, cx, ny);
    if (nt === Tile.BRICK || (nt === Tile.STEEL && b.power >= 2)) setTile(state.map, cx, ny, Tile.EMPTY);
  }
}

// Mermi-arazi teması: true → mermi yok olur
function hitTiles(state: GameState, b: Bullet): boolean {
  const h = BULLET_SIZE / 2;
  const cx0 = Math.floor((b.x - h) / SUB);
  const cy0 = Math.floor((b.y - h) / SUB);
  const cx1 = Math.floor((b.x + h - 0.01) / SUB);
  const cy1 = Math.floor((b.y + h - 0.01) / SUB);
  let stopped = false;
  for (let cy = cy0; cy <= cy1; cy++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      const t = tileAt(state.map, cx, cy);
      if (!bulletStops(t)) continue;
      stopped = true;
      if (t === Tile.HQ) {
        if (state.hqAlive) state.events.push({ type: 'hqDestroyed' });
      } else {
        erodeAt(state, b, cx, cy, t);
      }
    }
  }
  return stopped;
}

export function updateBullets(state: GameState, dt: number) {
  const dead = new Set<Bullet>();

  for (const b of state.bullets) {
    b.x += DX[b.dir] * b.speed * dt;
    b.y += DY[b.dir] * b.speed * dt;
  }

  // Mermi vs mermi: oyuncu ve düşman mermisi çarpışırsa ikisi de yok olur
  for (let i = 0; i < state.bullets.length; i++) {
    for (let j = i + 1; j < state.bullets.length; j++) {
      const a = state.bullets[i], c = state.bullets[j];
      if (a.fromPlayer === c.fromPlayer || dead.has(a) || dead.has(c)) continue;
      if (overlaps(
        a.x - BULLET_SIZE / 2, a.y - BULLET_SIZE / 2, BULLET_SIZE, BULLET_SIZE,
        c.x - BULLET_SIZE / 2, c.y - BULLET_SIZE / 2, BULLET_SIZE, BULLET_SIZE,
      )) {
        dead.add(a);
        dead.add(c);
      }
    }
  }

  for (const b of state.bullets) {
    if (dead.has(b)) continue;

    // saha dışı
    if (b.x < 0 || b.x > FIELD || b.y < 0 || b.y > FIELD) {
      dead.add(b);
      addExplosion(state, b.x, b.y, false);
      continue;
    }

    // arazi
    if (hitTiles(state, b)) {
      dead.add(b);
      addExplosion(state, b.x, b.y, false);
      continue;
    }

    const bx = b.x - BULLET_SIZE / 2;
    const by = b.y - BULLET_SIZE / 2;

    // düşman mermisi → oyuncu
    if (!b.fromPlayer && state.playerAlive) {
      const p = state.player;
      if (overlaps(bx, by, BULLET_SIZE, BULLET_SIZE, p.x, p.y, TANK, TANK)) {
        dead.add(b);
        if (p.shield > 0) {
          addExplosion(state, b.x, b.y, false);
        } else {
          state.events.push({ type: 'playerHit', x: p.x + TANK / 2, y: p.y + TANK / 2 });
        }
        continue;
      }
    }

    // oyuncu mermisi → düşman
    if (b.fromPlayer) {
      for (const e of state.enemies) {
        if (e.appear > 0) continue;
        if (!overlaps(bx, by, BULLET_SIZE, BULLET_SIZE, e.x, e.y, TANK, TANK)) continue;
        dead.add(b);
        e.hp -= 1;
        if (e.hp <= 0) {
          state.events.push({
            type: 'enemyKilled', kind: e.kind, bonus: e.bonus,
            x: e.x + TANK / 2, y: e.y + TANK / 2,
          });
          state.enemies = state.enemies.filter(en => en !== e);
        } else {
          addExplosion(state, b.x, b.y, false);
        }
        break;
      }
    }
  }

  if (dead.size) state.bullets = state.bullets.filter(b => !dead.has(b));
}

export function updateFX(state: GameState, dt: number) {
  for (const ex of state.explosions) ex.t += dt;
  state.explosions = state.explosions.filter(ex => ex.t < ex.dur);
  for (const p of state.popups) p.t += dt;
  state.popups = state.popups.filter(p => p.t < 0.9);
}

export function playerBulletCount(state: GameState): number {
  return state.bullets.filter(b => b.fromPlayer).length;
}

export function enemyHasBullet(state: GameState, id: number): boolean {
  return state.bullets.some(b => !b.fromPlayer && b.ownerId === id);
}

export type { Dir };
