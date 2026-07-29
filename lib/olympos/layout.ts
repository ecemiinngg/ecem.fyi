// Haritanın sabit yerleşimi.
//
// Konumlar networkx spring_layout (seed 47) ile bir kez üretilip buraya
// dondurulmuştur: Odysseus solda, İthaka sağda — yolculuk soldan sağa okunur.
// Sabit olmaları önemli: her hamlede düzen yeniden hesaplanmadığı için harita
// asla "zıplamıyor" ve çocuk kimin nerede olduğunu ezberleyebiliyor.
//
// En yakın iki düğüm arası 72px; düğüm çapı ≤ 60px olduğu sürece çakışma yok.

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 620;

export const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  odysseus: { x: 276.1, y: 256.6 },
  ithaka: { x: 693.5, y: 256.6 },
  athena: { x: 547.5, y: 174.4 },
  hermes: { x: 474.1, y: 319.0 },
  zeus: { x: 585.3, y: 296.0 },
  poseidon: { x: 412.3, y: 281.2 },
  aiolos: { x: 446.1, y: 161.4 },
  helios: { x: 615.2, y: 429.3 },
  kirke: { x: 457.1, y: 437.9 },
  kalypso: { x: 266.2, y: 366.0 },
  teiresias: { x: 714.0, y: 438.5 },
  polyphemus: { x: 201.5, y: 153.5 },
  skylla: { x: 250.3, y: 542.0 },
  charybdis: { x: 427.7, y: 508.3 },
  sirens: { x: 78.0, y: 405.0 },
  alkinoos: { x: 389.2, y: 367.1 },
  nausikaa: { x: 168.9, y: 459.9 },
  eumaios: { x: 920.5, y: 221.9 },
  telemachos: { x: 793.9, y: 107.7 },
  penelope: { x: 878.8, y: 78.0 },
  antinoos: { x: 922.0, y: 142.5 },
};

/** Bilinmeyen düğüm gelirse harita ortasına koy (veri değişirse çökmesin). */
export function positionOf(id: string): { x: number; y: number } {
  return NODE_POSITIONS[id] ?? { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
}
