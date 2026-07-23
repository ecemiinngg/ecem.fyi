// ── Map & Environment Agent ──────────────────────────────────────
// 13x13 blok tanımlarını 26x26 alt hücre grid'ine açar; arazi,
// kartal üssü (HQ) ve doğma alanlarını yönetir.

import { GRID, SUB, Tile } from './types';

// 13 satır x 13 karakter — . boş, B tuğla, S çelik, W su, I buz, F çalı
const LEVELS: string[][] = [
  [
    '.............',
    '.B.B.B.B.B.B.',
    '.B.B.B.B.B.B.',
    '.B.B.BSB.B.B.',
    '.B.B.B.B.B.B.',
    '.B.B.....B.B.',
    '.....B.B.....',
    'SS.BB...BB.SS',
    '.....B.B.....',
    '.B.B..B..B.B.',
    '.B.B.B.B.B.B.',
    '.B.B.....B.B.',
    '.............',
  ],
  [
    '.............',
    '.S...F.F...S.',
    '...B.FWF.B...',
    '.B.B.WWW.B.B.',
    '.B...B.B...B.',
    '..BBB...BBB..',
    '.I....B....I.',
    '.IWWB.S.BWWI.',
    '.I....B....I.',
    '..BBB...BBB..',
    '.B...FFF...B.',
    '...B.FFF.B...',
    '.............',
  ],
  [
    '.F.F.....F.F.',
    '.FBFB.B.BFBF.',
    '...B..S..B...',
    '.W.B.BBB.B.W.',
    '.W...B.B...W.',
    '..B..I.I..B..',
    '.SB.IIIII.BS.',
    '..B..I.I..B..',
    '.W...B.B...W.',
    '.W.B.BBB.B.W.',
    '...B..B..B...',
    '.FBF..B..FBF.',
    '.............',
  ],
  // Bölüm 4 — Çelik kale
  [
    '.....S.S.....',
    '.BB.......BB.',
    '.BB.S...S.BB.',
    '....B.B.B....',
    '.S.B..I..B.S.',
    '...B.III.B...',
    '.S...I.I...S.',
    '...B.III.B...',
    '.S.B..I..B.S.',
    '....B.B.B....',
    '.BB.S...S.BB.',
    '.BB.......BB.',
    '.............',
  ],
  // Bölüm 5 — Su labirenti
  [
    '.............',
    '.B.WWW.WWW.B.',
    '.B.........B.',
    '.B.BB.S.BB.B.',
    '...B.....B...',
    '.W.B.BBB.B.W.',
    '.W...B.B...W.',
    '.W.B.BBB.B.W.',
    '...B.....B...',
    '.B.BB.B.BB.B.',
    '.B....B....B.',
    '.B.WWW.WWW.B.',
    '.............',
  ],
  // Bölüm 6 — Buz sahası
  [
    '.I.........I.',
    '.IBB.B.B.BBI.',
    '.I.B.....B.I.',
    '...B.SIS.B...',
    '.B...III...B.',
    '.BB.IIIII.BB.',
    '....II.II....',
    '.BB.IIIII.BB.',
    '.B...III...B.',
    '...B.SIS.B...',
    '.I.B.....B.I.',
    '.IBB.B.B.BBI.',
    '.............',
  ],
  // Bölüm 7 — Orman pususu
  [
    '.FFF.....FFF.',
    '.FBF.BSB.FBF.',
    '.FFF.....FFF.',
    '..B..BFB..B..',
    '.....FFF.....',
    '.BSB.FBF.BSB.',
    '.....FFF.....',
    '..B..BFB..B..',
    '.FFF.....FFF.',
    '.FBF.BSB.FBF.',
    '.FFF.....FFF.',
    '......B......',
    '.............',
  ],
  // Bölüm 8 — Tuğla ağı
  [
    '.............',
    '.BBBB...BBBB.',
    '....B.S.B....',
    '.BB.B...B.BB.',
    '.B....B....B.',
    '.B.BBBWBBB.B.',
    '...B..W..B...',
    '.B.BBBWBBB.B.',
    '.B....B....B.',
    '.BB.B...B.BB.',
    '....B.S.B....',
    '.BBBB...BBBB.',
    '.............',
  ],
];

export const LEVEL_COUNT = LEVELS.length;

const CHAR_TILE: Record<string, Tile> = {
  '.': Tile.EMPTY,
  B: Tile.BRICK,
  S: Tile.STEEL,
  W: Tile.WATER,
  I: Tile.ICE,
  F: Tile.BUSH,
};

// Kartal üssü: alt-orta 2x2 hücre (13. ana blok satırı, 7. blok)
export const HQ_CELLS: Array<[number, number]> = [
  [12, 24], [13, 24], [12, 25], [13, 25],
];
// Üssü saran tuğla kalesi
export const HQ_FORT_CELLS: Array<[number, number]> = [
  [11, 23], [12, 23], [13, 23], [14, 23],
  [11, 24], [14, 24],
  [11, 25], [14, 25],
];

export const PLAYER_SPAWN = { x: 8 * SUB, y: 24 * SUB };

export function tileAt(map: Uint8Array, cx: number, cy: number): Tile {
  if (cx < 0 || cy < 0 || cx >= GRID || cy >= GRID) return Tile.STEEL;
  return map[cy * GRID + cx] as Tile;
}

export function setTile(map: Uint8Array, cx: number, cy: number, t: Tile) {
  if (cx < 0 || cy < 0 || cx >= GRID || cy >= GRID) return;
  map[cy * GRID + cx] = t;
}

function clearRect(map: Uint8Array, cx: number, cy: number, w: number, h: number) {
  for (let y = cy; y < cy + h; y++)
    for (let x = cx; x < cx + w; x++) setTile(map, x, y, Tile.EMPTY);
}

export function buildMap(levelIndex: number): Uint8Array {
  const def = LEVELS[levelIndex % LEVELS.length];
  const map = new Uint8Array(GRID * GRID);

  // Her ana bloğu 2x2 alt hücreye aç
  for (let by = 0; by < 13; by++) {
    for (let bx = 0; bx < 13; bx++) {
      const t = CHAR_TILE[def[by][bx]] ?? Tile.EMPTY;
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++)
          map[(by * 2 + dy) * GRID + (bx * 2 + dx)] = t;
    }
  }

  // Doğma alanlarını temizle: üstte 3 düşman noktası + oyuncu
  clearRect(map, 0, 0, 2, 2);
  clearRect(map, 12, 0, 2, 2);
  clearRect(map, 24, 0, 2, 2);
  clearRect(map, 8, 24, 2, 2);

  // Kartal üssü ve tuğla kalesi
  clearRect(map, 10, 22, 6, 4);
  for (const [cx, cy] of HQ_CELLS) setTile(map, cx, cy, Tile.HQ);
  for (const [cx, cy] of HQ_FORT_CELLS) setTile(map, cx, cy, Tile.BRICK);

  return map;
}

// Kürek bonusu: üs çevresini çelik yap / süre bitince tuğlaya döndür
export function setHQFort(map: Uint8Array, t: Tile) {
  for (const [cx, cy] of HQ_FORT_CELLS) setTile(map, cx, cy, t);
}

// Bonus için rastgele uygun bir 2x2 konum bul (üs bölgesinden uzak)
export function findPowerUpSpot(map: Uint8Array): { x: number; y: number } {
  for (let i = 0; i < 60; i++) {
    const cx = 1 + Math.floor(Math.random() * (GRID - 4));
    const cy = 1 + Math.floor(Math.random() * (GRID - 6));
    let ok = true;
    for (let dy = 0; dy < 2 && ok; dy++)
      for (let dx = 0; dx < 2 && ok; dx++) {
        const t = tileAt(map, cx + dx, cy + dy);
        if (t === Tile.STEEL || t === Tile.WATER || t === Tile.HQ) ok = false;
      }
    // üs kalesinin üstüne düşmesin
    if (cx >= 9 && cx <= 16 && cy >= 21) ok = false;
    if (ok) return { x: cx * SUB, y: cy * SUB };
  }
  return { x: 6 * SUB, y: 12 * SUB };
}
