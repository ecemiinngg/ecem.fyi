// ── Ortak tipler ve sabitler ─────────────────────────────────────
// PRD: 13x13 ana blok, her blok 2x2 alt hücre → 26x26 hücre grid'i

export const SUB = 20;                 // bir alt hücrenin piksel boyutu
export const GRID = 26;                // 26x26 alt hücre
export const FIELD = SUB * GRID;       // 520px kare oyun alanı
export const HUD_W = 140;              // sağdaki bilgi paneli
export const TANK = SUB * 2;           // tank = 1 ana blok (40px)

export type Dir = 0 | 1 | 2 | 3;       // 0=yukarı 1=sağ 2=aşağı 3=sol
export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];

export enum Tile {
  EMPTY = 0,
  BRICK,   // tuğla: mermiyle parça parça yıkılır
  STEEL,   // çelik: sadece Seviye 3 oyuncu mermisi yıkar
  WATER,   // su: mermi geçer, tank geçemez
  ICE,     // buz: tank kayar
  BUSH,    // çalı: tankların üstüne çizilir, hareketi engellemez
  HQ,      // kartal üssü hücresi
}

export type EnemyKind = 'normal' | 'fast' | 'power' | 'armor';
export type PowerKind = 'helmet' | 'clock' | 'shovel' | 'star' | 'grenade' | 'life';
export type Phase = 'menu' | 'stage' | 'playing' | 'paused' | 'cleared' | 'gameover';

// Bölüm perdesi animasyon süresi (sn): kapalı bekleme + açılma
export const STAGE_CURTAIN_DURATION = 2.2;
export const STAGE_CURTAIN_HOLD = 1.4;

export interface Tank {
  x: number;          // px, sol-üst köşe
  y: number;
  dir: Dir;
  speed: number;      // px/sn
  moving: boolean;
}

export interface PlayerTank extends Tank {
  level: number;      // 0-3 yıldız seviyesi
  shield: number;     // kalan ölümsüzlük süresi (sn)
  cooldown: number;   // ateş bekleme süresi
  slide: number;      // buz kayma süresi
}

export interface Enemy extends Tank {
  id: number;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  bonus: boolean;     // kırmızı yanıp sönen bonus tankı
  appear: number;     // doğma animasyonu süresi (bu sürede vurulamaz)
  turnTimer: number;  // yön değiştirme sayacı
  fireTimer: number;  // ateş etme sayacı
}

export interface Bullet {
  x: number;          // px, merkez
  y: number;
  dir: Dir;
  speed: number;
  fromPlayer: boolean;
  ownerId: number;    // oyuncu için -1, düşmanlar için enemy.id
  power: number;      // 2 → çelik duvarı da yıkar
}

export interface Explosion {
  x: number; y: number;
  t: number;          // geçen süre
  dur: number;
  big: boolean;
}

export interface PowerUp {
  kind: PowerKind;
  x: number; y: number;
  ttl: number;
}

export interface Popup {
  x: number; y: number;
  text: string;
  t: number;
}

// Çarpışma / mermi ajanının diğer ajanlara haber verme kanalı
export type GameEvent =
  | { type: 'enemyKilled'; kind: EnemyKind; bonus: boolean; x: number; y: number }
  | { type: 'playerHit'; x: number; y: number }
  | { type: 'hqDestroyed' };

export interface InputState {
  up: boolean; down: boolean; left: boolean; right: boolean; fire: boolean;
  startPressed: boolean;   // Enter (tek seferlik)
  pausePressed: boolean;   // P (tek seferlik)
  leftPressed: boolean;    // menüde bölüm seçimi (tek seferlik)
  rightPressed: boolean;
}

export interface GameState {
  phase: Phase;
  levelIndex: number;      // harita dizisindeki indeks
  levelNumber: number;     // ekranda gösterilen bölüm no
  menuStage: number;       // menüde seçili başlangıç bölümü
  maxStageReached: number; // ulaşılan en yüksek bölüm (localStorage'da saklanır)
  map: Uint8Array;         // GRID*GRID hücre

  player: PlayerTank;
  playerAlive: boolean;
  respawnTimer: number;
  lives: number;
  score: number;

  enemies: Enemy[];
  enemyIdSeq: number;
  roster: EnemyKind[];     // bu bölümün 20 tanklık listesi
  spawned: number;         // şu ana kadar doğan düşman sayısı
  spawnTimer: number;
  nextSpawnIdx: number;    // 3 doğma noktası arasında sıra

  bullets: Bullet[];
  explosions: Explosion[];
  popups: Popup[];
  powerUp: PowerUp | null;

  freezeTimer: number;     // saat bonusu: düşmanlar donuk
  shovelTimer: number;     // kürek bonusu: üs çevresi çelik
  hqAlive: boolean;
  clearTimer: number;      // bölüm geçme gecikmesi
  stageTimer: number;      // "STAGE N" perde animasyonu sayacı

  events: GameEvent[];
  time: number;
}
