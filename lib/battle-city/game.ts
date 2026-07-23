// ── Game State & Economy Agent ───────────────────────────────────
// Oyun akışı (menü / oyun / pause / game over / bölüm geçme),
// power-up ekonomisi, skor ve diğer ajanların orkestrasyonu.

import {
  STAGE_CURTAIN_DURATION, TANK, Tile,
  type GameState, type InputState, type PowerKind,
} from './types';
import { LEVEL_COUNT, buildMap, findPowerUpSpot, setHQFort } from './map';
import { overlaps } from './collision';
import { createPlayer, respawnPlayer, updatePlayer } from './player';
import { ENEMY_STATS, TOTAL_ENEMIES, rosterFor, updateEnemies } from './enemy';
import { addExplosion, addPopup, updateBullets, updateFX } from './bullets';
import { sfxExplode, sfxHit, sfxPower } from './sfx';

const POWER_KINDS: PowerKind[] = ['helmet', 'clock', 'shovel', 'star', 'grenade', 'life'];
const START_LIVES = 3;

// Ulaşılan en yüksek bölümü tarayıcıda sakla → yeni oyunda seçilebilsin
const STAGE_STORAGE_KEY = 'battle-city-max-stage';

function loadMaxStage(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const v = parseInt(window.localStorage.getItem(STAGE_STORAGE_KEY) ?? '1', 10);
    return Number.isFinite(v) && v >= 1 ? v : 1;
  } catch {
    return 1;
  }
}

function saveMaxStage(n: number) {
  try {
    window.localStorage.setItem(STAGE_STORAGE_KEY, String(n));
  } catch {
    // gizli mod vb. — kalıcılık olmadan devam et
  }
}

export function createGame(): GameState {
  return {
    phase: 'menu',
    levelIndex: 0,
    levelNumber: 1,
    menuStage: 1,
    maxStageReached: loadMaxStage(),
    map: buildMap(0),
    player: createPlayer(),
    playerAlive: true,
    respawnTimer: 0,
    lives: START_LIVES,
    score: 0,
    enemies: [],
    enemyIdSeq: 1,
    roster: rosterFor(1),
    spawned: 0,
    spawnTimer: 0.5,
    nextSpawnIdx: 0,
    bullets: [],
    explosions: [],
    popups: [],
    powerUp: null,
    freezeTimer: 0,
    shovelTimer: 0,
    hqAlive: true,
    clearTimer: 0,
    stageTimer: 0,
    events: [],
    time: 0,
  };
}

export function startLevel(state: GameState, levelNumber: number, fresh: boolean) {
  const keptLevel = fresh ? 0 : state.player.level;
  state.levelNumber = levelNumber;
  state.levelIndex = (levelNumber - 1) % LEVEL_COUNT;
  // yeni bölüme ulaşınca menüden seçilebilir hale gelir
  if (levelNumber > state.maxStageReached) {
    state.maxStageReached = levelNumber;
    saveMaxStage(levelNumber);
  }
  state.map = buildMap(state.levelIndex);
  state.player = createPlayer();
  state.player.level = keptLevel;
  state.playerAlive = true;
  state.respawnTimer = 0;
  if (fresh) {
    state.lives = START_LIVES;
    state.score = 0;
  }
  state.enemies = [];
  state.roster = rosterFor(state.levelNumber);
  state.spawned = 0;
  state.spawnTimer = 0.5;
  state.nextSpawnIdx = 0;
  state.bullets = [];
  state.explosions = [];
  state.popups = [];
  state.powerUp = null;
  state.freezeTimer = 0;
  state.shovelTimer = 0;
  state.hqAlive = true;
  state.clearTimer = 0;
  state.events = [];
  // atari usulü: önce "STAGE N" perdesi, sonra oyun başlar
  state.phase = 'stage';
  state.stageTimer = STAGE_CURTAIN_DURATION;
}

function applyPowerUp(state: GameState, kind: PowerKind) {
  const p = state.player;
  switch (kind) {
    case 'helmet':
      p.shield = 10;
      break;
    case 'clock':
      state.freezeTimer = 10;
      break;
    case 'shovel':
      state.shovelTimer = 20;
      setHQFort(state.map, Tile.STEEL);
      break;
    case 'star':
      p.level = Math.min(3, p.level + 1);
      break;
    case 'grenade': {
      for (const e of state.enemies.filter(en => en.appear <= 0)) {
        addExplosion(state, e.x + TANK / 2, e.y + TANK / 2, true);
        state.score += ENEMY_STATS[e.kind].score;
      }
      state.enemies = state.enemies.filter(en => en.appear > 0);
      sfxExplode(true);
      break;
    }
    case 'life':
      state.lives += 1;
      break;
  }
  state.score += 500;
  sfxPower();
}

// Mermi/çarpışma ajanlarından gelen olayları işle
function processEvents(state: GameState) {
  for (const ev of state.events) {
    if (ev.type === 'enemyKilled') {
      const score = ENEMY_STATS[ev.kind].score;
      state.score += score;
      addExplosion(state, ev.x, ev.y, true);
      addPopup(state, ev.x, ev.y, String(score));
      sfxExplode(true);
      if (ev.bonus) {
        const spot = findPowerUpSpot(state.map);
        const kind = POWER_KINDS[Math.floor(Math.random() * POWER_KINDS.length)];
        state.powerUp = { kind, x: spot.x, y: spot.y, ttl: 15 };
      }
    } else if (ev.type === 'playerHit') {
      if (!state.playerAlive) continue;
      state.playerAlive = false;
      addExplosion(state, ev.x, ev.y, true);
      sfxExplode(true);
      state.lives -= 1;
      if (state.lives <= 0) {
        state.phase = 'gameover';
      } else {
        state.respawnTimer = 1.2;
      }
    } else if (ev.type === 'hqDestroyed') {
      if (!state.hqAlive) continue;
      state.hqAlive = false;
      addExplosion(state, 13 * 20, 25 * 20, true);
      sfxExplode(true);
      state.phase = 'gameover';
    }
  }
  state.events = [];
}

export function update(state: GameState, input: InputState, dt: number) {
  state.time += dt;

  if (state.phase === 'menu') {
    // ◄ ► ile ulaşılan bölümlerden biri seçilir
    if (input.leftPressed) state.menuStage = Math.max(1, state.menuStage - 1);
    if (input.rightPressed) state.menuStage = Math.min(state.maxStageReached, state.menuStage + 1);
    if (input.startPressed) startLevel(state, state.menuStage, true);
  } else if (state.phase === 'stage') {
    state.stageTimer -= dt;
    if (input.startPressed) state.stageTimer = 0; // Enter perdeyi atlar
    if (state.stageTimer <= 0) state.phase = 'playing';
  } else if (state.phase === 'gameover') {
    updateFX(state, dt);
    if (input.startPressed) {
      state.phase = 'menu';
    }
  } else if (state.phase === 'paused') {
    if (input.pausePressed) state.phase = 'playing';
  } else if (state.phase === 'cleared') {
    updateFX(state, dt);
    state.clearTimer -= dt;
    if (state.clearTimer <= 0) {
      startLevel(state, state.levelNumber + 1, false);
    }
  } else if (state.phase === 'playing') {
    if (input.pausePressed) {
      state.phase = 'paused';
      input.startPressed = false;
      input.pausePressed = false;
      input.leftPressed = false;
      input.rightPressed = false;
      return;
    }

    // zamanlayıcılar
    state.freezeTimer = Math.max(0, state.freezeTimer - dt);
    if (state.shovelTimer > 0) {
      state.shovelTimer -= dt;
      if (state.shovelTimer <= 0) setHQFort(state.map, Tile.BRICK);
    }

    // oyuncu yeniden doğma
    if (!state.playerAlive && state.lives > 0) {
      state.respawnTimer -= dt;
      if (state.respawnTimer <= 0) respawnPlayer(state);
    }

    updatePlayer(state, input, dt);
    updateEnemies(state, dt);
    updateBullets(state, dt);
    updateFX(state, dt);

    // power-up alma / süresi dolma
    if (state.powerUp) {
      state.powerUp.ttl -= dt;
      if (state.powerUp.ttl <= 0) {
        state.powerUp = null;
      } else if (
        state.playerAlive &&
        overlaps(
          state.player.x, state.player.y, TANK, TANK,
          state.powerUp.x, state.powerUp.y, TANK, TANK,
        )
      ) {
        addPopup(state, state.powerUp.x + TANK / 2, state.powerUp.y, '500');
        applyPowerUp(state, state.powerUp.kind);
        state.powerUp = null;
        sfxHit();
      }
    }

    processEvents(state);

    // kazanma: 20 düşmanın tamamı imha edildi
    if (state.phase === 'playing' && state.spawned >= TOTAL_ENEMIES && state.enemies.length === 0) {
      state.phase = 'cleared';
      state.clearTimer = 2.5;
    }
  }

  input.startPressed = false;
  input.pausePressed = false;
  input.leftPressed = false;
  input.rightPressed = false;
}
