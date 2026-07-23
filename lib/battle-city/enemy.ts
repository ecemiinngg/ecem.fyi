// ── Enemy AI Agent ───────────────────────────────────────────────
// 3 doğma noktasından sırayla 20 tank (ekranda max 4). Rastgele
// gezinme + %60 üsse yönelme + önü kırılabilir duvarsa ateş etme.

import {
  DX, DY, FIELD, GRID, SUB, TANK, Tile,
  type Dir, type Enemy, type EnemyKind, type GameState,
} from './types';
import { tileAt } from './map';
import { moveTank, overlaps, positionFree, setTankDir } from './collision';
import { enemyHasBullet, fireFromTank } from './bullets';

export const TOTAL_ENEMIES = 20;
export const MAX_ACTIVE = 4;
const BONUS_INDICES = new Set([3, 10, 17]); // kırmızı yanıp sönen tanklar

export const ENEMY_STATS: Record<EnemyKind, {
  speed: number; hp: number; bulletSpeed: number; score: number;
}> = {
  normal: { speed: 60, hp: 1, bulletSpeed: 240, score: 100 },
  fast:   { speed: 115, hp: 1, bulletSpeed: 240, score: 200 },
  power:  { speed: 70, hp: 1, bulletSpeed: 430, score: 300 },
  armor:  { speed: 55, hp: 4, bulletSpeed: 240, score: 400 },
};

const SPAWN_XS = [0, FIELD / 2 - TANK / 2, FIELD - TANK];

// Bölüm başına 20 tanklık kadro; seviye arttıkça zırhlı/hızlı artar
export function rosterFor(levelNumber: number): EnemyKind[] {
  const armor = Math.min(6, 2 + levelNumber);
  const fast = Math.min(6, 3 + Math.floor(levelNumber / 2));
  const power = Math.min(5, 2 + Math.floor(levelNumber / 2));
  const normal = TOTAL_ENEMIES - armor - fast - power;
  const list: EnemyKind[] = [
    ...Array<EnemyKind>(normal).fill('normal'),
    ...Array<EnemyKind>(fast).fill('fast'),
    ...Array<EnemyKind>(power).fill('power'),
    ...Array<EnemyKind>(armor).fill('armor'),
  ];
  // basit karıştırma
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function trySpawn(state: GameState) {
  const x = SPAWN_XS[state.nextSpawnIdx % SPAWN_XS.length];
  // doğma noktası doluysa bu kareyi pas geç
  if (!positionFree(state, x, 0, -999)) return;

  const kind = state.roster[state.spawned];
  const stats = ENEMY_STATS[kind];
  state.enemies.push({
    id: state.enemyIdSeq++,
    x, y: 0,
    dir: 2,
    speed: stats.speed,
    moving: true,
    kind,
    hp: stats.hp,
    maxHp: stats.hp,
    bonus: BONUS_INDICES.has(state.spawned),
    appear: 1.0,
    turnTimer: 1 + Math.random() * 2,
    fireTimer: 0.8 + Math.random(),
  });
  state.nextSpawnIdx++;
  state.spawned++;
  state.spawnTimer = Math.max(1.2, 3 - state.levelNumber * 0.15);
}

// PRD: önü kapanınca / periyodik olarak %60 ihtimalle üsse yönel
function chooseDir(e: Enemy): Dir {
  if (Math.random() < 0.6) {
    const cx = e.x + TANK / 2;
    const options: Dir[] = [];
    if (e.y + TANK < 24 * SUB) options.push(2, 2); // aşağı ağırlıklı
    options.push(cx > FIELD / 2 ? 3 : 1);          // yatayda üsse doğru
    return options[Math.floor(Math.random() * options.length)];
  }
  return Math.floor(Math.random() * 4) as Dir;
}

// Namlunun önündeki 2 hücrede kırılabilir duvar var mı?
function destructibleAhead(state: GameState, e: Enemy): boolean {
  const mx = e.x + TANK / 2 + DX[e.dir] * (TANK / 2 + 2);
  const my = e.y + TANK / 2 + DY[e.dir] * (TANK / 2 + 2);
  for (let step = 0; step < 2; step++) {
    const cx = Math.floor((mx + DX[e.dir] * step * SUB) / SUB);
    const cy = Math.floor((my + DY[e.dir] * step * SUB) / SUB);
    if (cx < 0 || cy < 0 || cx >= GRID || cy >= GRID) return false;
    const t = tileAt(state.map, cx, cy);
    if (t === Tile.BRICK) return true;
    if (t === Tile.STEEL || t === Tile.HQ) return false;
  }
  return false;
}

// Oyuncu ya da üsle aynı şeritte ve o yöne bakıyor mu?
function targetAligned(state: GameState, e: Enemy): boolean {
  const ecx = e.x + TANK / 2, ecy = e.y + TANK / 2;
  const targets: Array<{ x: number; y: number }> = [
    { x: FIELD / 2, y: 25 * SUB }, // üs
  ];
  if (state.playerAlive) {
    targets.push({ x: state.player.x + TANK / 2, y: state.player.y + TANK / 2 });
  }
  for (const t of targets) {
    if (Math.abs(t.x - ecx) < SUB && ((e.dir === 2 && t.y > ecy) || (e.dir === 0 && t.y < ecy))) return true;
    if (Math.abs(t.y - ecy) < SUB && ((e.dir === 1 && t.x > ecx) || (e.dir === 3 && t.x < ecx))) return true;
  }
  return false;
}

export function updateEnemies(state: GameState, dt: number) {
  // doğma zamanlayıcısı
  if (state.spawned < TOTAL_ENEMIES && state.enemies.length < MAX_ACTIVE) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) trySpawn(state);
  }

  const frozen = state.freezeTimer > 0;

  for (const e of state.enemies) {
    if (e.appear > 0) {
      e.appear -= dt;
      continue;
    }
    if (frozen) continue;

    e.turnTimer -= dt;
    e.fireTimer -= dt;

    const moved = moveTank(state, e, e.speed * dt, e.id);
    if (!moved || e.turnTimer <= 0) {
      setTankDir(e, chooseDir(e));
      e.turnTimer = 0.8 + Math.random() * 2;
    }

    if (e.fireTimer <= 0) {
      const wants = destructibleAhead(state, e) || targetAligned(state, e) || Math.random() < 0.35;
      if (wants && !enemyHasBullet(state, e.id)) {
        fireFromTank(state, e, {
          fromPlayer: false,
          ownerId: e.id,
          speed: ENEMY_STATS[e.kind].bulletSpeed,
          power: 1,
        });
      }
      e.fireTimer = 0.5 + Math.random() * 1.3;
    }
  }
}

// Bomba bonusu: ekrandaki tüm aktif düşmanları yok et
export function activeEnemies(state: GameState): Enemy[] {
  return state.enemies.filter(e => e.appear <= 0);
}

export function enemyRectOverlapsSpawn(state: GameState): boolean {
  return SPAWN_XS.some(x =>
    state.enemies.some(e => overlaps(x, 0, TANK, TANK, e.x, e.y, TANK, TANK)),
  );
}
