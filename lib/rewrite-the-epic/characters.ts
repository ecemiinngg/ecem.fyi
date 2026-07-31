// Dramatis Personae — karakterler ve wireframe figürleri.
//
// Her figür 100×100 viewBox içinde çizgi sanatı (stroke = currentColor) olarak
// tanımlı, böylece rengi ve boyutu bulunduğu bağlamdan alır:
//   .frame → madalyon çerçevesi
//   .guide → kesikli kılavuz çizgi (wireframe hissi)
//   .dot   → dolu detay (göz bebeği vb.)
//   .anim-*→ CSS'in canlandırdığı parçalar (göz kırpma, kanat, anafor…)

export interface Character {
  id: string;
  name: string;
  epithet: string;
}

const FRAME =
  '<circle class="frame" cx="50" cy="50" r="47"/>' +
  '<circle class="guide" cx="50" cy="50" r="39"/>';

const ART: Record<string, string> = {
  /* Oyuncu / kahraman — sakallı maske, pilos başlık */
  odysseus:
    '<path d="M27 45q0-21 23-21t23 21"/>' +
    '<path d="M23 45h54"/>' +
    '<path d="M33 45v13q0 18 17 22 17-4 17-22V45"/>' +
    '<circle class="dot" cx="42" cy="55" r="2.3"/><circle class="dot" cx="58" cy="55" r="2.3"/>' +
    '<path d="M50 53v10M44 67h12"/>' +
    '<path d="M36 70q14 13 28 0"/>' +
    '<path class="anim-sway" d="M41 74v7M47 77v6M53 77v6M59 74v7"/>',

  /* Mürettebat — kare yelkenli, kürekli trireme */
  crew:
    '<g class="anim-bob">' +
    '<path d="M15 57h70l-11 16q-24 8-48 0z"/>' +
    '<path d="M85 57l7-9"/>' +
    '<path d="M50 57V17"/>' +
    '<path d="M53 20h20v24H53z"/>' +
    '<path class="anim-row" d="M28 72l-11 12M40 76l-8 11M60 76l8 11M72 72l11 12"/></g>' +
    '<path class="guide anim-wave" d="M12 88q9-6 19 0t19 0 19 0"/>',

  /* Polyphemus — tek gözlü Kiklop */
  polyphemus:
    '<path d="M25 47q0-25 25-25t25 25q0 27-25 33-25-6-25-33"/>' +
    '<circle cx="50" cy="44" r="11"/><circle class="dot anim-blink" cx="50" cy="44" r="3.4"/>' +
    '<path d="M39 66q11 9 22 0"/>' +
    '<path d="M45 67v5M50 69v5M55 67v5"/>' +
    '<path class="guide anim-bristle" d="M27 33l-9-8M36 25l-4-11M50 21V9M64 25l4-11M73 33l9-8"/>',

  /* Kirke — diademli tanrıça, elinde kylix */
  kirke:
    '<path d="M37 41q0-16 13-16t13 16q0 20-13 24-13-4-13-24"/>' +
    '<circle class="dot" cx="44" cy="45" r="2.1"/><circle class="dot" cx="56" cy="45" r="2.1"/>' +
    '<path d="M46 57q4 3 8 0"/>' +
    '<path d="M31 32q19-15 38 0"/>' +
    '<path class="anim-sway" d="M35 39q-8 21-3 39M65 39q8 21 3 39"/>' +
    '<path d="M41 80h18l-4 8H45z"/><path d="M50 88v6M44 94h12"/>',

  /* Siren — kadın başlı, kanatlı kuş */
  siren:
    '<circle cx="50" cy="24" r="9"/>' +
    '<path d="M41 20q9-9 18 0"/>' +
    '<path d="M40 24q-3 12 1 20M60 24q3 12-1 20"/>' +
    '<path d="M50 33q-9 5-9 18 0 11 9 14 9-3 9-14 0-13-9-18"/>' +
    '<path class="anim-flutter" d="M41 40q-20 2-26 20 16 2 26-8M59 40q20 2 26 20-16 2-26-8"/>' +
    '<path class="guide" d="M22 50l4 8M28 47l3 9M72 47l-3 9M78 50l-4 8"/>' +
    '<path class="guide" d="M45 66l-4 16M50 67v17M55 66l4 16"/>',

  /* Skylla & Kharybdis — uzayan boyunlar ve anafor */
  skylla:
    '<path d="M8 88q14-7 28 0"/>' +
    '<path d="M15 86q-8-20 4-28M25 87q-4-24 6-31M35 86q3-22 11-27"/>' +
    '<circle cx="20" cy="53" r="5"/><circle cx="32" cy="52" r="5"/><circle cx="48" cy="55" r="5"/>' +
    '<path class="dot" d="M20 53h0M32 52h0"/>' +
    '<path class="anim-vortex" d="M92 46q2 22-18 24-17 2-19-12-2-12 10-13 10-1 10 8"/>' +
    '<path class="guide" d="M74 60q6 1 5 7"/>',

  /* Helios'un sığırları — boynuzlar arasında güneş diski */
  helios:
    '<path d="M35 44q-14-9-4-22 3 12 12 17M65 44q14-9 4-22-3 12-12 17"/>' +
    '<path d="M36 43q14-8 28 0 4 19-14 29-18-10-14-29"/>' +
    '<circle class="dot" cx="44" cy="52" r="2.2"/><circle class="dot" cx="56" cy="52" r="2.2"/>' +
    '<path d="M44 64q6 4 12 0"/>' +
    '<circle class="anim-pulse" cx="50" cy="20" r="7"/>' +
    '<path class="guide anim-rays" d="M50 6v5M64 20h5M31 20h5M60 10l3-4M40 10l-3-4"/>'
};

const CHARACTERS: Record<string, Character> = {
  odysseus:   { id: 'odysseus',   name: 'Odysseus',            epithet: 'Çok yönlü kaptan · Ithaka kralı' },
  crew:       { id: 'crew',       name: 'Mürettebat',          epithet: '600 adam, on iki gemi' },
  polyphemus: { id: 'polyphemus', name: 'Polyphemus',          epithet: 'Kiklop · Poseidon\'un oğlu' },
  kirke:      { id: 'kirke',      name: 'Kirke',               epithet: 'Aiaie\'nin büyücü tanrıçası' },
  siren:      { id: 'siren',      name: 'Sirenler',            epithet: 'Şarkıyla öldüren bilgi' },
  skylla:     { id: 'skylla',     name: 'Skylla & Kharybdis',  epithet: 'Altı ağız ve bir anafor' },
  helios:     { id: 'helios',     name: 'Helios\'un Sürüsü',   epithet: 'Doğmayan, ölmeyen kutsal sığırlar' }
};

/* Düğüm başına sahnedeki kadro — ilk eleman baş figürdür */
export const NODE_CAST: Record<string, string[]> = {
  N1: ['polyphemus', 'odysseus', 'crew'],
  N2: ['kirke', 'odysseus', 'crew'],
  N3: ['siren', 'odysseus', 'crew'],
  N4: ['skylla', 'odysseus', 'crew'],
  N5: ['helios', 'odysseus', 'crew']
};

/** Bir figürün SVG gövdesi (çerçeve + kılavuz dahil). */
export function figureMarkup(id: string): string {
  return FRAME + (ART[id] ?? "");
}

export function characterOf(id: string): Character | null {
  return CHARACTERS[id] ?? null;
}

/** Düğümün kadrosu; ilk eleman baş figürdür. */
export function castOf(nodeId: string): Character[] {
  return (NODE_CAST[nodeId] ?? []).map((id) => CHARACTERS[id]).filter(Boolean);
}

/** Prologdaki tanıtım şeridi sırası. */
export const ROSTER = [
  "odysseus",
  "crew",
  "polyphemus",
  "kirke",
  "siren",
  "skylla",
  "helios",
];
