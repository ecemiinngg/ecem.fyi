// ── Player Agent ─────────────────────────────────────────────────
// Klavye girdisi → hareket (grid hizalama, buz kayması) ve yıldız
// seviyesine göre ateş kuralları (mermi limiti, hız, çelik kırma).

import {
  SUB, type Dir, type GameState, type InputState, type PlayerTank,
} from './types';
import { PLAYER_SPAWN } from './map';
import { moveTank, setTankDir, tankOnIce } from './collision';
import { fireFromTank, playerBulletCount } from './bullets';

export const PLAYER_SPEED = 110;
const FIRE_COOLDOWN = 0.22;

export function createPlayer(): PlayerTank {
  return {
    x: PLAYER_SPAWN.x,
    y: PLAYER_SPAWN.y,
    dir: 0,
    speed: PLAYER_SPEED,
    moving: false,
    level: 0,
    shield: 3,       // doğarken kısa ölümsüzlük
    cooldown: 0,
    slide: 0,
  };
}

export function respawnPlayer(state: GameState) {
  const level = 0; // klasik kural: ölünce yıldız seviyesi sıfırlanır
  state.player = { ...createPlayer(), level };
  state.playerAlive = true;
}

function desiredDir(input: InputState): Dir | -1 {
  if (input.up) return 0;
  if (input.right) return 1;
  if (input.down) return 2;
  if (input.left) return 3;
  return -1;
}

export function updatePlayer(state: GameState, input: InputState, dt: number) {
  if (!state.playerAlive) return;
  const p = state.player;

  p.shield = Math.max(0, p.shield - dt);
  p.cooldown = Math.max(0, p.cooldown - dt);

  const d = desiredDir(input);
  if (d !== -1) {
    setTankDir(p, d);
    moveTank(state, p, p.speed * dt, 'player');
    p.moving = true;
    // buzdaysa bırakınca kaysın
    p.slide = tankOnIce(state.map, p) ? 0.22 : 0;
  } else {
    p.moving = false;
    if (p.slide > 0 && tankOnIce(state.map, p)) {
      moveTank(state, p, p.speed * 0.7 * dt, 'player');
      p.slide -= dt;
    } else {
      p.slide = 0;
    }
  }

  // Ateş: Seviye 2+ aynı anda 2 mermi, Seviye 1+ hızlı mermi,
  // Seviye 3 çelik duvarı kırar
  if (input.fire && p.cooldown <= 0) {
    const maxBullets = p.level >= 2 ? 2 : 1;
    if (playerBulletCount(state) < maxBullets) {
      fireFromTank(state, p, {
        fromPlayer: true,
        ownerId: -1,
        speed: p.level >= 1 ? 380 : 250,
        power: p.level >= 3 ? 2 : 1,
      });
      p.cooldown = FIRE_COOLDOWN;
    }
  }
}

// grid hizası hissi için yardımcı (HUD/çizimde kullanılabilir)
export function playerCellX(p: PlayerTank) {
  return Math.round(p.x / SUB);
}
