// Attribution Tycoon — shared types.

export type ChannelId = "meta" | "google" | "tiktok";
export type ModuleId =
  | "ga4"
  | "sgtm"
  | "cookie"
  | "capi"
  | "eapi"
  | "gads"
  | "identity"
  | "dedup";
export type Severity = "warn" | "critical" | "good";
export type GameStatus = "playing" | "finished" | "bankrupt";
export type AgentId = "market" | "customer" | "tracking" | "adplatform";

export interface Channel {
  id: ChannelId;
  name: string;
  short: string;
  color: string;
  /** Baseline cost assuming a perfect signal (EMQ = 10). */
  cpcBase: number;
  cpaBase: number;
  aov: number;
  /** Contribution margin after COGS — net profit runs on this. */
  margin: number;
  /** Efficient daily spend ceiling; above it CPA is penalised. */
  capacity: number;
  /** The stack module that unlocks this channel's server-side signal. */
  signalKey: ModuleId;
  signalLabel: string;
  audience: { safari: number; chrome: number; inapp: number };
  iosShare: number;
}

export interface StackItem {
  id: ModuleId;
  name: string;
  vendor: string;
  monthly: number;
  setup: number;
  requires: ModuleId[];
  permanent?: boolean;
  tag: string;
  desc: string;
  effects: string[];
}

export interface EventEffects {
  adblockDelta?: number;
  consentDeniedDelta?: number;
  safariLossDelta?: number;
  inappLossDelta?: number;
  chromeLossDelta?: number;
  retentionMult?: number;
  emqDelta?: number;
  channelEmq?: Partial<Record<ChannelId, number>>;
  channelCpa?: Partial<Record<ChannelId, number>>;
  cpcMult?: number;
  cpaMult?: number;
  cvrMult?: number;
  aovMult?: number;
}

export interface MarketEvent {
  id: string;
  title: string;
  severity: Severity;
  body: string;
  mitigatedBy: ModuleId[];
  mitigatedText?: string;
  effects: EventEffects;
  /** Only scheduled events carry a day. */
  day?: number;
}

export interface ActiveEvent {
  event: MarketEvent;
  /** `null` means permanent — JSON-safe stand-in for Infinity. */
  remaining: number | null;
  mitigated: boolean;
}

export interface Modifiers {
  adblockDelta: number;
  consentDeniedDelta: number;
  safariLossDelta: number;
  inappLossDelta: number;
  chromeLossDelta: number;
  retentionMult: number;
  emqDelta: number;
  channelEmq: Record<ChannelId, number>;
  channelCpa: Record<ChannelId, number>;
  cpcMult: number;
  cpaMult: number;
  cvrMult: number;
  aovMult: number;
}

export interface CohortMix {
  safari: number;
  chrome: number;
  inapp: number;
  iosShare: number;
  adblockRate: number;
  consentDenied: number;
  intent: { high: number; medium: number; low: number };
}

export interface Cohort {
  channel: ChannelId;
  visitors: number;
  segments: {
    safari: number;
    chrome: number;
    inapp: number;
    adblocked: number;
    consentDenied: number;
    ios: number;
  };
  events: {
    page_view: number;
    view_item: number;
    add_to_cart: number;
    begin_checkout: number;
  };
}

export interface Journey {
  name: string;
  os: "iOS" | "Android";
  browser: "safari" | "chrome" | "inapp";
  adblock: boolean;
  consent: boolean;
  channel: ChannelId;
  tracked: boolean;
  reason: string;
}

export interface EngineReading {
  channel: ChannelId;
  serverSide: boolean;
  cookie: boolean;
  eapi: boolean;
  consent: boolean;
  identity: boolean;
  dedup: boolean;
  channelApi: boolean;
  duplicating: boolean;
  losses: {
    adblock: number;
    safari: number;
    inapp: number;
    chrome: number;
    consent: number;
  };
  browserLoss: number;
  consentLoss: number;
  signalLoss: number;
  adblockEff: number;
  stackMultiplier: number;
  retention: number;
  emq: number;
}

export interface Performance {
  channel: ChannelId;
  spend: number;
  clicks: number;
  cpc: number;
  sales: number;
  cpaBase: number;
  cpaEffective: number;
  aov: number;
  revenue: number;
  grossProfit: number;
  learningPhase: boolean;
  scalePenalty: number;
  blind: boolean;
  wastedShare: number;
}

export interface Attribution {
  trackedSales: number;
  reportedSales: number;
  directUnassigned: number;
  invisible: number;
  inflation: number;
  lostSales: number;
}

export interface ChannelResult {
  id: ChannelId;
  name: string;
  short: string;
  color: string;
  spend: number;
  mix: CohortMix;
  engine: EngineReading;
  perf: Performance;
  cohort: Cohort;
  attribution: Attribution;
  realRevenue: number;
  reportedRevenue: number;
  realRoas: number;
  reportedRoas: number;
  grossProfit: number;
}

export interface LogLine {
  agent: AgentId;
  text: string;
}

export interface DayResult {
  day: number;
  channels: ChannelResult[];
  spend: number;
  infraCost: number;
  realRevenue: number;
  reportedRevenue: number;
  organicRevenue: number;
  grossProfit: number;
  netProfit: number;
  sales: number;
  trackedSales: number;
  realRoas: number;
  reportedRoas: number;
  emq: number;
  retention: number;
  cash: number;
  brandEquity: number;
  events: Array<{ event: MarketEvent; mitigated: boolean }>;
  log: LogLine[];
  journeys: Journey[];
}

export interface HistoryPoint {
  day: number;
  spend: number;
  realRevenue: number;
  reportedRevenue: number;
  netProfit: number;
  realRoas: number;
  reportedRoas: number;
  emq: number;
  retention: number;
  cash: number;
}

export interface GameState {
  seed: number;
  rngCursor: number;
  day: number;
  cash: number;
  stack: ModuleId[];
  budgets: Record<ChannelId, number>;
  brandEquity: number;
  activeEvents: ActiveEvent[];
  history: HistoryPoint[];
  status: GameStatus;
  totals: {
    spend: number;
    realRevenue: number;
    reportedRevenue: number;
    profit: number;
    sales: number;
    infraCost: number;
  };
}

export interface Score {
  points: number;
  grade: "S" | "A" | "B" | "C" | "D" | "F";
  avgEmq: number;
  accuracy: number;
  ratio: number;
  roas: number;
  profit: number;
}

export type Rng = () => number;
