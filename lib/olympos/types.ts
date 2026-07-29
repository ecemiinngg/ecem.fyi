// Olympos — paylaşılan tipler.

export type NodeStatus = "Ally" | "Neutral" | "Enemy";
export type EdgeType = "Support" | "Enmity";
export type GameStatus = "playing" | "won" | "lost";
export type ActionName = "persuade" | "neutralize" | "reroute";
export type Difficulty = "kolay" | "kahraman";
export type LogActor = "player" | "poseidon" | "system";

/** mythology-graph.json'un şekli. */
export interface GraphData {
  meta: {
    title: string;
    subtitle: string;
    source: string;
    target: string;
    victory_threshold: number;
    centrality_penalty_coefficient: number;
    ap_per_turn: number;
    max_turns: number;
  };
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    influence_cost: number;
    status: string;
    epithet: string;
    description: string;
    emoji: string;
    kid_note: string;
    penalty_multiplier?: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    weight: number;
    type: string;
    label: string;
  }>;
}

export interface Node {
  id: string;
  name: string;
  type: string;
  influenceCost: number;
  status: NodeStatus;
  baseStatus: NodeStatus;
  epithet: string;
  description: string;
  emoji: string;
  kidNote: string;
  penaltyMultiplier: number;
  /** 0 = tam etkili, 1 = tamamen etkisiz ("derin uykuda"). */
  suppression: number;
  neutralizeCount: number;
  persuaded: boolean;
}

export interface Edge {
  source: string;
  target: string;
  weight: number;
  baseWeight: number;
  type: EdgeType;
  baseType: EdgeType;
  label: string;
  /** Oyun sırasında lobiyle açılmış kenar. */
  synthetic: boolean;
  /** Bir çift yalnızca bir kez lobilenebilir. */
  lobbied: boolean;
}

export interface PenaltyRow {
  id: string;
  name: string;
  betweenness: number;
  suppression: number;
  multiplier: number;
  penalty: number;
  onPath: boolean;
}

export interface FrictionReport {
  path: string[];
  pathWeight: number;
  centralityPenalty: number;
  threshold: number;
  score: number;
  directSafeLink: boolean;
  penaltyBreakdown: PenaltyRow[];
}

export interface AvailableAction {
  action: ActionName;
  /** Çocuk arayüzündeki sade ad: "Arkadaş Ol" / "Sakinleştir" / "Uyut" / "Köprü Kur". */
  kidLabel: string;
  icon: string;
  cost: number;
  enabled: boolean;
  /** Neden yapılamıyor — çocuk diliyle. */
  reason: string;
  /** Yapılırsa ne olur. */
  effect: string;
  viaOptions?: Array<{ id: string; name: string; emoji: string }>;
}

export interface LogEntry {
  turn: number;
  actor: LogActor;
  action: string;
  message: string;
  apSpent: number;
  frictionBefore: number;
  frictionAfter: number;
  frictionDelta: number;
}

export interface RankedMove {
  action: ActionName;
  nodeId: string;
  name: string;
  emoji: string;
  kidLabel: string;
  icon: string;
  cost: number;
  gain: number;
  efficiency: number;
}

export interface Hint {
  kind: "move" | "end_turn" | "won" | "lost";
  text: string;
  move: RankedMove | null;
  alternatives: RankedMove[];
}

/** UI'ın tükettiği düz görünüm. */
export interface ViewNode {
  id: string;
  name: string;
  type: string;
  status: NodeStatus;
  emoji: string;
  kidNote: string;
  description: string;
  epithet: string;
  influenceCost: number;
  suppression: number;
  betweenness: number;
  degree: number;
  onPath: boolean;
  isSource: boolean;
  isTarget: boolean;
  reachable: boolean;
  /** Bu düğüme uygulanabilecek en ucuz eylem maliyeti (raf sıralaması için). */
  cheapestCost: number;
}

export interface ViewEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  type: EdgeType;
  label: string;
  synthetic: boolean;
  onPath: boolean;
}

export interface GameView {
  nodes: ViewNode[];
  edges: ViewEdge[];
  friction: FrictionReport;
  turn: number;
  maxTurns: number;
  ap: number;
  apPerTurn: number;
  status: GameStatus;
  difficulty: Difficulty;
  log: LogEntry[];
  density: number;
  components: number;
  bridgeCount: number;
}
