'use client';

// Battle City — render katmanı. Oyun mantığı lib/battle-city altındaki
// ajan modüllerinde; bu bileşen sadece girdi toplar, update() çağırır
// ve durumu canvas'a çizer.

import { useEffect, useRef } from 'react';
import {
  FIELD, GRID, HUD_W, STAGE_CURTAIN_DURATION, STAGE_CURTAIN_HOLD, SUB, TANK, Tile,
  type Enemy, type GameState, type InputState, type PlayerTank,
} from '@/lib/battle-city/types';
import { tileAt } from '@/lib/battle-city/map';
import { BULLET_SIZE } from '@/lib/battle-city/bullets';
import { TOTAL_ENEMIES } from '@/lib/battle-city/enemy';
import { createGame, update } from '@/lib/battle-city/game';
import { isMuted, toggleMute } from '@/lib/battle-city/sfx';

const W = FIELD + HUD_W;
const H = FIELD;

// ── Arazi çizimi ─────────────────────────────────────────────────
function drawTerrain(ctx: CanvasRenderingContext2D, state: GameState, layer: 'under' | 'over') {
  for (let cy = 0; cy < GRID; cy++) {
    for (let cx = 0; cx < GRID; cx++) {
      const t = tileAt(state.map, cx, cy);
      if (t === Tile.EMPTY || t === Tile.HQ) continue;
      const isOver = t === Tile.BUSH;
      if ((layer === 'over') !== isOver) continue;
      const x = cx * SUB, y = cy * SUB;

      if (t === Tile.BRICK) {
        ctx.fillStyle = '#a3401f';
        ctx.fillRect(x, y, SUB, SUB);
        ctx.fillStyle = '#6b2a12';
        ctx.fillRect(x, y + SUB / 2 - 1, SUB, 2);
        const off = cy % 2 === 0 ? SUB / 2 : 0;
        ctx.fillRect(x + ((SUB / 2 + off) % SUB), y, 2, SUB / 2);
        ctx.fillRect(x + ((off + SUB) % SUB), y + SUB / 2, 2, SUB / 2);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(x, y, SUB, 2);
      } else if (t === Tile.STEEL) {
        ctx.fillStyle = '#8d949e';
        ctx.fillRect(x, y, SUB, SUB);
        ctx.fillStyle = '#c9ced6';
        ctx.fillRect(x + 1, y + 1, SUB - 2, 2);
        ctx.fillRect(x + 1, y + 1, 2, SUB - 2);
        ctx.fillStyle = '#4c5157';
        ctx.fillRect(x + 1, y + SUB - 3, SUB - 2, 2);
        ctx.fillRect(x + SUB - 3, y + 1, 2, SUB - 2);
        ctx.fillStyle = '#6f757d';
        ctx.fillRect(x + 5, y + 5, SUB - 10, SUB - 10);
      } else if (t === Tile.WATER) {
        ctx.fillStyle = '#123a8f';
        ctx.fillRect(x, y, SUB, SUB);
        const phase = Math.floor(state.time * 2 + cx + cy) % 2;
        ctx.fillStyle = phase ? '#2a5fd0' : '#1c4bb0';
        ctx.fillRect(x + 2, y + 4, SUB - 4, 3);
        ctx.fillRect(x + 4, y + 12, SUB - 8, 3);
      } else if (t === Tile.ICE) {
        ctx.fillStyle = '#c7dcef';
        ctx.fillRect(x, y, SUB, SUB);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(x + 3, y + 3, 6, 2);
        ctx.fillRect(x + 11, y + 12, 6, 2);
      } else if (t === Tile.BUSH) {
        ctx.fillStyle = '#1c6b2a';
        ctx.fillRect(x, y, SUB, SUB);
        ctx.fillStyle = '#2f9440';
        ctx.fillRect(x + 2, y + 2, 5, 5);
        ctx.fillRect(x + 11, y + 6, 6, 5);
        ctx.fillRect(x + 4, y + 12, 6, 5);
        ctx.fillStyle = '#124d1d';
        ctx.fillRect(x + 8, y + 9, 4, 4);
      }
    }
  }
}

// ── Kartal üssü ──────────────────────────────────────────────────
function drawHQ(ctx: CanvasRenderingContext2D, state: GameState) {
  const x = 12 * SUB, y = 24 * SUB;
  ctx.fillStyle = state.hqAlive ? '#3a3a44' : '#26262c';
  ctx.fillRect(x, y, TANK, TANK);
  ctx.font = '28px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.hqAlive ? '🦅' : '🏳️', x + TANK / 2, y + TANK / 2 + 2);
}

// ── Tank çizimi ──────────────────────────────────────────────────
function drawTankSprite(
  ctx: CanvasRenderingContext2D,
  t: { x: number; y: number; dir: number; moving: boolean },
  body: string, track: string, turret: string,
  time: number,
) {
  ctx.save();
  ctx.translate(t.x + TANK / 2, t.y + TANK / 2);
  ctx.rotate((t.dir * Math.PI) / 2);

  // paletler + hareket eden diş izleri
  ctx.fillStyle = track;
  ctx.fillRect(-18, -16, 8, 32);
  ctx.fillRect(10, -16, 8, 32);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  const scroll = t.moving ? Math.floor(time * 20) % 6 : 0;
  for (let i = -16 + scroll; i < 16; i += 6) {
    ctx.fillRect(-18, i, 8, 2);
    ctx.fillRect(10, i, 8, 2);
  }

  // gövde ve kule
  ctx.fillStyle = body;
  ctx.fillRect(-11, -13, 22, 26);
  ctx.fillStyle = turret;
  ctx.fillRect(-6, -7, 12, 14);

  // namlu
  ctx.fillStyle = turret;
  ctx.fillRect(-2, -20, 4, 14);

  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  if (!state.playerAlive) return;
  const p: PlayerTank = state.player;
  drawTankSprite(ctx, p, '#f5c518', '#8a6d0b', '#ffe98a', time);
  // kalkan halkası
  if (p.shield > 0 && Math.floor(time * 10) % 2 === 0) {
    ctx.strokeStyle = '#7cd6ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x + TANK / 2, p.y + TANK / 2, TANK / 2 + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  // yıldız seviyesi işareti
  if (p.level > 0) {
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText('★'.repeat(p.level), p.x + TANK / 2, p.y - 4);
  }
}

const ENEMY_COLORS: Record<string, { body: string; track: string; turret: string }> = {
  normal: { body: '#b8bec8', track: '#5c6068', turret: '#dde2ea' },
  fast:   { body: '#9ecbff', track: '#41576e', turret: '#d4e8ff' },
  power:  { body: '#e8a04c', track: '#7a4d1c', turret: '#ffd9a0' },
  armor:  { body: '#4fae5c', track: '#245c2c', turret: '#a8e0af' },
};

function armorTint(e: Enemy): string {
  if (e.kind !== 'armor') return ENEMY_COLORS[e.kind].body;
  const tints = ['#9aa0a8', '#c9c05a', '#7ec86f', '#4fae5c']; // hp 1→4
  return tints[Math.max(0, Math.min(3, e.hp - 1))];
}

function drawEnemies(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  for (const e of state.enemies) {
    if (e.appear > 0) {
      // doğma yıldızı
      const cx = e.x + TANK / 2, cy = e.y + TANK / 2;
      const r = 6 + Math.abs(Math.sin(time * 10)) * 12;
      ctx.strokeStyle = '#ffdf6b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
      ctx.moveTo(cx - r * 0.6, cy - r * 0.6); ctx.lineTo(cx + r * 0.6, cy + r * 0.6);
      ctx.moveTo(cx - r * 0.6, cy + r * 0.6); ctx.lineTo(cx + r * 0.6, cy - r * 0.6);
      ctx.stroke();
      continue;
    }
    const c = ENEMY_COLORS[e.kind];
    const flashing = e.bonus && Math.floor(time * 5) % 2 === 0;
    const body = flashing ? '#e5484d' : armorTint(e);
    drawTankSprite(ctx, { ...e, moving: state.freezeTimer <= 0 }, body, c.track, c.turret, state.freezeTimer > 0 ? 0 : time);
  }
}

// ── Mermi, patlama, bonus, skor baloncukları ─────────────────────
function drawFX(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  ctx.fillStyle = '#eee';
  for (const b of state.bullets) {
    ctx.fillRect(b.x - BULLET_SIZE / 2, b.y - BULLET_SIZE / 2, BULLET_SIZE, BULLET_SIZE);
  }

  for (const ex of state.explosions) {
    const k = ex.t / ex.dur;
    const r = (ex.big ? 26 : 12) * (0.4 + k * 0.6);
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = '#ff7b2e';
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd83d';
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (state.powerUp && Math.floor(time * 6) % 3 !== 0) {
    const pu = state.powerUp;
    ctx.fillStyle = '#101018';
    ctx.fillRect(pu.x, pu.y, TANK, TANK);
    ctx.strokeStyle = '#e5484d';
    ctx.lineWidth = 2;
    ctx.strokeRect(pu.x + 1, pu.y + 1, TANK - 2, TANK - 2);
    const icons: Record<string, string> = {
      helmet: '🛡️', clock: '⏰', shovel: '🧱', star: '⭐', grenade: '💣', life: '❤️',
    };
    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icons[pu.kind], pu.x + TANK / 2, pu.y + TANK / 2 + 2);
  }

  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  for (const p of state.popups) {
    ctx.globalAlpha = 1 - p.t / 0.9;
    ctx.fillStyle = '#fff';
    ctx.fillText(p.text, p.x, p.y - p.t * 25);
    ctx.globalAlpha = 1;
  }
}

// ── HUD ──────────────────────────────────────────────────────────
function drawHUD(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = '#15151c';
  ctx.fillRect(FIELD, 0, HUD_W, H);
  ctx.fillStyle = '#26262f';
  ctx.fillRect(FIELD, 0, 2, H);

  const cx = FIELD + 16;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#8b8b96';
  ctx.font = '11px monospace';
  ctx.fillText('DÜŞMAN', cx, 28);

  // doğmayı bekleyen düşman ikonları
  const remaining = TOTAL_ENEMIES - state.spawned;
  for (let i = 0; i < remaining; i++) {
    const ix = cx + (i % 5) * 22;
    const iy = 40 + Math.floor(i / 5) * 22;
    ctx.fillStyle = '#9b3b3b';
    ctx.fillRect(ix, iy, 14, 14);
    ctx.fillStyle = '#c96a6a';
    ctx.fillRect(ix + 4, iy + 4, 6, 6);
  }

  ctx.fillStyle = '#8b8b96';
  ctx.font = '11px monospace';
  ctx.fillText('CAN', cx, 180);
  ctx.fillStyle = '#f5c518';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`▲ × ${Math.max(0, state.lives)}`, cx, 202);

  ctx.fillStyle = '#8b8b96';
  ctx.font = '11px monospace';
  ctx.fillText('BÖLÜM', cx, 244);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`${state.levelNumber}`, cx, 266);

  ctx.fillStyle = '#8b8b96';
  ctx.font = '11px monospace';
  ctx.fillText('SKOR', cx, 308);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(String(state.score).padStart(6, '0'), cx, 330);

  // aktif bonus göstergeleri
  let by = 370;
  ctx.font = '11px monospace';
  if (state.freezeTimer > 0) {
    ctx.fillStyle = '#7cd6ff';
    ctx.fillText(`⏰ ${state.freezeTimer.toFixed(0)}s`, cx, by);
    by += 18;
  }
  if (state.shovelTimer > 0) {
    ctx.fillStyle = '#c9ced6';
    ctx.fillText(`🧱 ${state.shovelTimer.toFixed(0)}s`, cx, by);
    by += 18;
  }
  if (state.playerAlive && state.player.shield > 1) {
    ctx.fillStyle = '#7cd6ff';
    ctx.fillText(`🛡 ${state.player.shield.toFixed(0)}s`, cx, by);
  }

  ctx.fillStyle = '#55555f';
  ctx.font = '10px monospace';
  ctx.fillText('P: durdur', cx, H - 34);
  ctx.fillText(`M: ses ${isMuted() ? 'açık değil' : 'açık'}`, cx, H - 20);
}

// ── Kaplamalar (menü / pause / game over / bölüm geçildi) ────────
function drawOverlays(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (state.phase === 'menu') {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e5484d';
    ctx.font = 'bold 52px monospace';
    ctx.fillText('BATTLE', W / 2, H / 2 - 90);
    ctx.fillText('CITY', W / 2, H / 2 - 38);
    ctx.fillStyle = '#f5c518';
    ctx.font = 'bold 16px monospace';
    if (Math.floor(time * 2) % 2 === 0) ctx.fillText('BAŞLAMAK İÇİN ENTER', W / 2, H / 2 + 32);

    // bölüm seçici: ulaşılan bölümler arasından ◄ ► ile seçilir
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    const canSelect = state.maxStageReached > 1;
    ctx.fillText(
      canSelect ? `◄ BÖLÜM ${state.menuStage} ►` : `BÖLÜM ${state.menuStage}`,
      W / 2, H / 2 + 68,
    );
    ctx.fillStyle = '#8b8b96';
    ctx.font = '12px monospace';
    if (canSelect) {
      ctx.fillText(`◄ ► ile bölüm seç (en yüksek: ${state.maxStageReached})`, W / 2, H / 2 + 92);
    }
    ctx.fillText('Ok tuşları / WASD: hareket · Boşluk: ateş', W / 2, H / 2 + 116);
    ctx.fillText('Kartal üssünü koru, 20 düşman tankını yok et!', W / 2, H / 2 + 136);
  } else if (state.phase === 'stage') {
    // atari usulü gri perde: kapalı bekler, sonra üstten ve alttan açılır
    const elapsed = STAGE_CURTAIN_DURATION - state.stageTimer;
    const openDur = STAGE_CURTAIN_DURATION - STAGE_CURTAIN_HOLD;
    const cover = elapsed < STAGE_CURTAIN_HOLD
      ? 1
      : Math.max(0, 1 - (elapsed - STAGE_CURTAIN_HOLD) / openDur);
    const half = (H / 2) * cover;
    ctx.fillStyle = '#636363';
    ctx.fillRect(0, 0, W, half);
    ctx.fillRect(0, H - half, W, half);
    if (cover > 0.55) {
      ctx.fillStyle = '#000';
      ctx.font = 'bold 26px monospace';
      ctx.fillText(`STAGE ${state.levelNumber}`, W / 2, H / 2);
    }
  } else if (state.phase === 'paused') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, FIELD, H);
    ctx.fillStyle = '#f5c518';
    ctx.font = 'bold 28px monospace';
    if (Math.floor(time * 2) % 2 === 0) ctx.fillText('PAUSE', FIELD / 2, H / 2);
  } else if (state.phase === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, FIELD, H);
    ctx.fillStyle = '#e5484d';
    ctx.font = 'bold 40px monospace';
    ctx.fillText('GAME OVER', FIELD / 2, H / 2 - 16);
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(`Skor: ${state.score}`, FIELD / 2, H / 2 + 24);
    ctx.fillStyle = '#8b8b96';
    ctx.fillText('ENTER: menüye dön', FIELD / 2, H / 2 + 48);
  } else if (state.phase === 'cleared') {
    ctx.fillStyle = '#f5c518';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('BÖLÜM GEÇİLDİ!', FIELD / 2, H / 2);
  }
}

function render(ctx: CanvasRenderingContext2D, state: GameState) {
  const time = state.time;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  if (state.phase !== 'menu') {
    drawTerrain(ctx, state, 'under');
    drawHQ(ctx, state);
    drawPlayer(ctx, state, time);
    drawEnemies(ctx, state, time);
    drawFX(ctx, state, time);
    drawTerrain(ctx, state, 'over');
  }

  drawHUD(ctx, state);
  drawOverlays(ctx, state, time);
}

// ── React bileşeni ───────────────────────────────────────────────
export default function BattleCityGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    const state = createGame();
    const input: InputState = {
      up: false, down: false, left: false, right: false, fire: false,
      startPressed: false, pausePressed: false,
      leftPressed: false, rightPressed: false,
    };

    const keyMap: Record<string, keyof InputState> = {
      ArrowUp: 'up', KeyW: 'up',
      ArrowDown: 'down', KeyS: 'down',
      ArrowLeft: 'left', KeyA: 'left',
      ArrowRight: 'right', KeyD: 'right',
      Space: 'fire',
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = keyMap[e.code];
      if (k) {
        (input[k] as boolean) = true;
        e.preventDefault();
      }
      if (e.code === 'Enter') input.startPressed = true;
      if (e.code === 'KeyP' || e.code === 'Escape') input.pausePressed = true;
      if (e.code === 'KeyM') toggleMute();
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.leftPressed = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') input.rightPressed = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = keyMap[e.code];
      if (k) (input[k] as boolean) = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    if (process.env.NODE_ENV !== 'production') {
      // dev/test kancası: durumu incele ve simülasyonu elle ilerlet
      (window as unknown as Record<string, unknown>).__battleCity = {
        state,
        input,
        step: (seconds: number) => {
          const n = Math.round(seconds * 60);
          for (let i = 0; i < n; i++) update(state, input, 1 / 60);
        },
      };
    }

    let raf = 0;
    let timer = 0;
    let last = performance.now();
    // gizli sekmede rAF durur; sim'in donmaması için timer'a düş
    const schedule = () => {
      if (document.visibilityState === 'hidden') {
        timer = window.setTimeout(() => loop(performance.now()), 33);
      } else {
        raf = requestAnimationFrame(loop);
      }
    };
    // sabit adım: görünür sekmede kare başına 1 adım, gizli sekmede
    // (timer 1sn'ye kısıtlanır) geçen süre kadar adım yakalanır
    const STEP = 1 / 60;
    let acc = 0;
    const loop = (now: number) => {
      acc += Math.min(1, (now - last) / 1000);
      last = now;
      let steps = 0;
      while (acc >= STEP && steps < 60) {
        update(state, input, STEP);
        acc -= STEP;
        steps++;
      }
      render(ctx, state);
      schedule();
    };
    schedule();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
        timer = window.setTimeout(() => loop(performance.now()), 33);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          maxWidth: W,
          aspectRatio: `${W} / ${H}`,
          imageRendering: 'pixelated',
          border: '1px solid #26262f',
          borderRadius: 8,
          background: '#000',
        }}
      />
    </div>
  );
}
