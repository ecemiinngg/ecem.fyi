// Game Engine & Math Agent — oyunun kural motoru.
//
// Saf fonksiyonlar: `applyChoice` durumu mutasyona uğratmaz, yeni bir durum ve
// analitik kayıt döndürür. Bu yüzden React tarafında snapshot olarak tutulabilir.
//
// Zarlar tohumlanmış (mulberry32): aynı tohum + aynı kararlar = aynı sonuç, yani
// bir run tekrar üretilebilir. Motor deterministik modda da çalışır; canon
// hattını simüle ederken olasılıksal etkiler beklenen değerle uygulanır ve
// ölümcül dallar yok sayılır (tarihsel Odysseus hayatta kalır).

import { NODES, START_STATE } from "./canon-db";
import type {
  AppliedDeltas,
  CanonNode,
  Choice,
  Effects,
  GameState,
  LogEntry,
  ScaleKey,
} from "./types";

const SCALE_KEYS: ScaleKey[] = [
  "rationality",
  "curiosity",
  "risk",
  "authority",
  "wrath",
];

/** Tohumlanmış RNG. Motor global durum tutmasın diye çağrı başına üretilir. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

export function createState(): GameState {
  return { ...START_STATE };
}

const emptyApplied = (): AppliedDeltas => ({
  crew: 0,
  months: 0,
  rationality: 0,
  curiosity: 0,
  risk: 0,
  authority: 0,
  wrath: 0,
});

/** Etki paketini uygula; clamp sonrası gerçekleşen deltaları döndür. */
function applyEffects(
  state: GameState,
  fx: Effects,
  weight = 1,
): AppliedDeltas {
  const applied = emptyApplied();

  if (fx.crew) {
    const before = state.crew;
    state.crew = Math.max(0, state.crew + Math.round(fx.crew * weight));
    applied.crew = state.crew - before;
  }
  if (fx.crewMul !== undefined && fx.crewMul !== null) {
    // Kısmi ağırlıkta beklenen değer: çarpanı 1'e doğru yumuşat.
    const mul = 1 - (1 - fx.crewMul) * weight;
    const before = state.crew;
    state.crew = Math.max(0, Math.floor(state.crew * mul));
    applied.crew += state.crew - before;
  }
  if (fx.months) {
    const m = Math.round(fx.months * weight);
    state.months += m;
    applied.months += m;
  }
  for (const key of SCALE_KEYS) {
    const delta = fx[key];
    if (!delta) continue;
    const before = state[key];
    state[key] = clamp(state[key] + Math.round(delta * weight), 0, 100);
    applied[key] += state[key] - before;
  }
  return applied;
}

const sign = (n: number) => (n > 0 ? `+${n}` : String(n));

/** Değişim gerekçesi — insan okur analitik kayıt. */
function buildRationale(applied: AppliedDeltas, varianceFired: boolean): string {
  const parts: string[] = [];
  if (applied.crew) parts.push(`${Math.abs(applied.crew)} mürettebat kaybı`);
  if (applied.months) parts.push(`+${applied.months} ay seyir/konaklama`);
  if (applied.rationality) parts.push(`rasyonellik ${sign(applied.rationality)}`);
  if (applied.curiosity) parts.push(`merak ${sign(applied.curiosity)}`);
  if (applied.risk) parts.push(`risk toleransı ${sign(applied.risk)}`);
  if (applied.authority) parts.push(`liderlik ${sign(applied.authority)}`);
  if (applied.wrath) parts.push(`gazap ${sign(applied.wrath)}`);
  const base = parts.join(", ") || "ölçülebilir değişim yok";
  return base + (varianceFired ? " (olasılıksal ek sonuç tetiklendi)" : "");
}

export interface ApplyOptions {
  /** Canon simülasyonu: varyans beklenen değerle, ölüm zarı atılmaz. */
  deterministic?: boolean;
  /** Olasılıksal mod için zar kaynağı. */
  rng?: () => number;
}

export function applyChoice(
  state: GameState,
  node: CanonNode,
  choice: Choice,
  options: ApplyOptions = {},
): { state: GameState; entry: LogEntry } {
  const deterministic = options.deterministic === true;
  const rng = options.rng ?? Math.random;
  const before: GameState = { ...state };
  const next: GameState = { ...state };

  let applied = applyEffects(next, choice.effects);

  let varianceFired = false;
  let varianceNote: string | null = null;
  let roll: number | null = null;

  if (choice.variance) {
    if (deterministic) {
      const expected = applyEffects(next, choice.variance, choice.variance.p);
      applied = mergeApplied(applied, expected);
    } else {
      roll = rng();
      if (roll < choice.variance.p) {
        varianceFired = true;
        varianceNote = choice.variance.note;
        applied = mergeApplied(applied, applyEffects(next, choice.variance));
      }
    }
  }

  let fatal = false;
  let fatalRoll: number | null = null;
  if (choice.fatal && !deterministic) {
    fatalRoll = rng();
    if (fatalRoll < choice.fatal) {
      fatal = true;
      next.alive = false;
    }
  }

  next.nodeIndex = state.nodeIndex + 1;

  const entry: LogEntry = {
    nodeId: node.id,
    nodeIndex: state.nodeIndex,
    nodeTitle: node.title,
    choiceId: choice.id,
    choiceLabel: choice.label,
    tag: choice.tag,
    isCanon: choice.canon === true,
    applied,
    before,
    after: { ...next },
    varianceFired,
    varianceNote,
    roll: roll === null ? null : Math.round(roll * 1000) / 1000,
    fatal,
    fatalRoll: fatalRoll === null ? null : Math.round(fatalRoll * 1000) / 1000,
    outcome: choice.outcome,
    analystNote: choice.analystNote,
    rationale: buildRationale(applied, varianceFired),
  };

  return { state: next, entry };
}

function mergeApplied(a: AppliedDeltas, b: AppliedDeltas): AppliedDeltas {
  const out = emptyApplied();
  for (const key of Object.keys(out) as Array<keyof AppliedDeltas>) {
    out[key] = a[key] + b[key];
  }
  return out;
}

export const nodeCount = () => NODES.length;

export const crewLossPct = (finalCrew: number) =>
  Math.round(((START_STATE.crew - finalCrew) / START_STATE.crew) * 100);

/** Yolculuk bitti mi? (Ithaka'ya varış veya Odysseus'un ölümü) */
export const isFinished = (state: GameState) =>
  !state.alive || state.nodeIndex >= NODES.length;
