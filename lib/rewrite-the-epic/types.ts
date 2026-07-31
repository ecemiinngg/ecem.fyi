// Destanı Yeniden Yaz — paylaşılan tipler.
//
// Oyun beş "canon düğümünde" karar alan, kararları metriklerle ölçen ve sonunda
// oyuncuyu Homeros'un orijinal Odysseia hattıyla A/B testine sokan bir karar
// ağacı simülasyonu. Motor tamamen istemcide; sunucu ya da ağ isteği yok.

/** 0–100 arası kişilik/durum metrikleri (Divine_Wrath yardımcı metrik). */
export type ScaleKey =
  | "rationality"
  | "curiosity"
  | "risk"
  | "authority"
  | "wrath";

export type EffectKey = ScaleKey | "crew" | "months";

/** Bir kararın durum üzerindeki etkisi. */
export interface Effects {
  crew?: number;
  /** Mutlak deltadan sonra uygulanan çarpan (0 = tam imha). */
  crewMul?: number;
  months?: number;
  rationality?: number;
  curiosity?: number;
  risk?: number;
  authority?: number;
  wrath?: number;
}

/** Olasılıksal ek sonuç: `p` olasılıkla uygulanır. */
export interface Variance extends Effects {
  p: number;
  note: string;
}

export type ChoiceTag = "merak" | "pragmatik" | "temkin" | "kumar";

export interface Choice {
  id: string;
  /** Tarihsel/orijinal karar mı? Her düğümde tam olarak bir tane. */
  canon?: boolean;
  label: string;
  /** Eylemin mantıksal arkaplanı — sonucu ifşa etmez. */
  hint: string;
  tag: ChoiceTag;
  effects: Effects;
  variance?: Variance;
  /** Gerçekleşirse Odysseus ölür ve yolculuk yarıda kesilir. */
  fatal?: number;
  outcome: string;
  analystNote: string;
}

export interface CanonNode {
  id: string;
  title: string;
  place: string;
  prose: string[];
  risks: string[];
  choices: Choice[];
  canonSummary: string;
}

export interface GameState {
  crew: number;
  months: number;
  rationality: number;
  curiosity: number;
  risk: number;
  authority: number;
  wrath: number;
  alive: boolean;
  nodeIndex: number;
}

export type AppliedDeltas = Record<EffectKey, number>;

/** Motorun her karar için ürettiği analitik kayıt (Player Vector öğesi). */
export interface LogEntry {
  nodeId: string;
  nodeIndex: number;
  nodeTitle: string;
  choiceId: string;
  choiceLabel: string;
  tag: string;
  isCanon: boolean;
  applied: AppliedDeltas;
  before: GameState;
  after: GameState;
  varianceFired: boolean;
  varianceNote: string | null;
  roll: number | null;
  fatal: boolean;
  fatalRoll: number | null;
  outcome: string;
  analystNote: string;
  rationale: string;
}

export interface MetricMeta {
  key: ScaleKey;
  label: string;
  short: string;
  /** Rapor grafiğinde eşli bar olarak gösterilsin mi? */
  axis: boolean;
}

export interface CanonRecord {
  node_id: string;
  node_title: string;
  canon_choice_id: string;
  canon_choice: string;
  canon_summary: string;
  canon_effects: Effects;
  canon_outcome: string;
  canon_analyst_note: string;
}

export interface MetricComparison {
  key: ScaleKey;
  label: string;
  short: string;
  player: number;
  canon: number;
  /** Canon'a göre yüzdesel fark. */
  pct: number;
  /** "%43 daha rasyonel" gibi yön dili. */
  phrase: string;
}

export interface KpiTile {
  label: string;
  value: string;
  delta: string;
  dir: "good" | "bad" | "flat";
}

export interface DecisionRow {
  nodeId: string;
  node: string;
  player: string;
  canon: string;
  same: boolean;
  playerCrew: number | null;
  canonCrew: number;
  playerMonths: number | null;
  canonMonths: number;
  tag: string | null;
}

export interface AnalystNote {
  node: string;
  nodeId: string;
  same: boolean;
  text: string;
}

export interface Report {
  seed: number;
  profile: { title: string; subtitle: string };
  arrival: {
    arrived: boolean;
    months: number;
    canonMonths: number;
    /** Pozitif = canon'dan daha erken. */
    diffMonths: number;
    label: string;
  };
  crew: {
    final: number;
    canonFinal: number;
    lossPct: number;
    canonLossPct: number;
  };
  wrath: { player: number; canon: number };
  metrics: MetricComparison[];
  alignment: { matched: number; total: number; pct: number };
  decisions: DecisionRow[];
  notes: AnalystNote[];
  epilogue: string;
  tiles: KpiTile[];
  summary: string;
}

/** Narrator Agent'ın ürettiği sahne. */
export interface Scene {
  nodeId: string;
  eyebrow: string;
  title: string;
  place: string;
  prose: string[];
  risks: string[];
  choices: SceneChoice[];
  whisper: string | null;
}

export interface SceneChoice {
  id: string;
  label: string;
  hint: string;
  tag: ChoiceTag;
  /** 1–5: kararın öngörülebilirliği (sonucu değil). */
  uncertainty: number;
}
