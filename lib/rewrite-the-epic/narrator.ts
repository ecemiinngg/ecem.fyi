// Narrator Agent — oyunun Dungeon Master'ı.
//
// Sahneyi Homeros üslubuyla anlatır, seçeneklerin mantıksal arkaplanını sezdirir
// ama sonucunu asla söylemez. Statlara duyarlıdır: otorite dibe vurduğunda ya da
// gazap yükseldiğinde tek cümlelik bir fısıltı ekler.
//
// Seçenek sırası tohuma bağlı karıştırılır; canon seçeneği sabit bir konumda
// durmasın ki oyuncu "doğru cevabı" yerinden tahmin etmesin.

import { NODES } from "./canon-db";
import type { CanonNode, Choice, GameState, Scene, SceneChoice } from "./types";

function shuffleChoices(node: CanonNode, nodeIndex: number, seed: number) {
  const arr = [...node.choices];
  let s = (seed + (nodeIndex + 1) * 2654435761) >>> 0;
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Belirsizlik göstergesi (1–5). Sonucu ifşa etmez; yalnızca kararın ne kadar
 * öngörülebilir olduğunu bildirir: risk iştahı + varyans + ölümcül dal.
 */
export function uncertaintyOf(choice: Choice): number {
  const fx = choice.effects;
  let score = 1;
  if (fx.risk && fx.risk > 0) score += fx.risk / 15;
  if (choice.variance) score += 1 + choice.variance.p;
  if (choice.fatal) score += 2;
  if (fx.crewMul !== undefined && fx.crewMul !== null && fx.crewMul < 0.5) {
    score += 1;
  }
  return Math.max(1, Math.min(5, Math.round(score)));
}

/** Statlara göre üretilen anlatıcı fısıltısı — durum farkındalığı. */
function whisper(state: GameState, nodeIndex: number): string | null {
  const lines: string[] = [];
  if (state.authority <= 30) {
    lines.push(
      "Güvertede kürek sesleri seyrekleşti; emirlerin artık tartışılıyor. <em>(Liderlik otoritesi kritik)</em>",
    );
  }
  if (state.wrath >= 70) {
    lines.push(
      "Deniz sebepsiz kabarıyor: birinin duası hâlâ gökte dolaşıyor. <em>(Tanrıların gazabı yüksek)</em>",
    );
  }
  if (state.crew <= 150 && state.crew > 0) {
    lines.push(
      "Kürek yerlerinin yarısı boş; her kayıp artık iki kat ağır. <em>(Mürettebat kritik seviyede)</em>",
    );
  }
  if (state.risk >= 80) {
    lines.push(
      "Adamlar kaptanlarının cesaretinden değil, kumarından korkmaya başladı. <em>(Risk iştahı çok yüksek)</em>",
    );
  }
  if (state.rationality >= 80 && nodeIndex >= 2) {
    lines.push(
      "Soğuk hesabın ünü seni önden gidiyor; kimse senden şiir beklemiyor. <em>(Rasyonellik çok yüksek)</em>",
    );
  }
  if (state.curiosity <= 25 && nodeIndex >= 2) {
    lines.push(
      "Musa'nın sesi kısıldı: bu yolculuktan anlatılacak pek bir şey birikmiyor. <em>(Merak düşük)</em>",
    );
  }
  return lines[0] ?? null;
}

export function narrate(
  node: CanonNode,
  nodeIndex: number,
  state: GameState,
  seed: number,
): Scene {
  const choices: SceneChoice[] = shuffleChoices(node, nodeIndex, seed).map(
    (choice) => ({
      id: choice.id,
      label: choice.label,
      hint: choice.hint,
      tag: choice.tag,
      uncertainty: uncertaintyOf(choice),
    }),
  );

  return {
    nodeId: node.id,
    eyebrow: `Düğüm ${nodeIndex + 1} / ${NODES.length} · ${node.id}`,
    title: node.title,
    place: node.place,
    prose: node.prose,
    risks: node.risks,
    choices,
    whisper: whisper(state, nodeIndex),
  };
}

/** Karar sonrası kısa sonuç anlatısı. */
export function narrateOutcome(entry: {
  fatal: boolean;
  varianceFired: boolean;
  varianceNote: string | null;
  outcome: string;
}): { title: string; prose: string[] } {
  const title = entry.fatal
    ? "Destan burada kesildi"
    : entry.varianceFired
      ? "Beklenmeyen bir kalem"
      : "Olan oldu";

  const prose = [entry.outcome];
  if (entry.varianceFired && entry.varianceNote) {
    prose.push(`<strong>${entry.varianceNote}</strong>`);
  }
  if (entry.fatal) {
    prose.push(
      "Kaptan sudan çıkmadı. Ithaka bir daha yalnızca bir isim olarak anıldı; geri kalan her şey ölçülebilir veriye dönüştü.",
    );
  }
  return { title, prose };
}

export function narrateEpilogue(state: GameState): string {
  if (!state.alive) {
    return "Deniz kaptanını aldı. Destan yarım kaldı — ama veri tamamlandı.";
  }
  if (state.crew === 0) {
    return "Ithaka'ya tek başına vardın: bir omurga tahtası, bir isim ve hiç kimse. Odysseus da böyle varmıştı.";
  }
  if (state.crew >= 400) {
    return "Ithaka limanına bir filo girdi. Yaşlı Laertes gözlerine inanamadı: kimse mürettebatıyla dönmeyi başaramamıştı.";
  }
  return "Ithaka'nın kayalıkları göründü. Arkanda eksik ama yaşayan bir mürettebat, önünde tanıdık bir liman var.";
}
