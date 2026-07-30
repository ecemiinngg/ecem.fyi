// Attribution Tycoon — the daily loop that orchestrates the four agents.
//
//   Market Event → Customer Traffic → Tracking Engine → Ad Platform Algo
//   → Analytics & ROAS dashboard

import * as AdPlatform from "./agents/ad-platform";
import * as CustomerTraffic from "./agents/customer-traffic";
import * as Market from "./agents/market-event";
import * as Tracking from "./agents/tracking-engine";
import { CHANNELS, GAME, STACK_ITEMS } from "./config";
import type {
  ChannelId,
  ChannelResult,
  DayResult,
  GameState,
  Journey,
  LogLine,
  ModuleId,
  Score,
  StackItem,
} from "./types";

/** Deterministic PRNG so a given seed always replays identically. */
export function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newGame(seed?: number): GameState {
  return {
    seed: seed ?? Math.floor(Math.random() * 1e9),
    rngCursor: 0,
    day: 1,
    cash: GAME.START_CASH,
    stack: ["ga4"],
    budgets: { meta: 400, google: 300, tiktok: 200 },
    brandEquity: 0,
    activeEvents: [],
    history: [],
    status: "playing",
    totals: {
      spend: 0,
      realRevenue: 0,
      reportedRevenue: 0,
      profit: 0,
      sales: 0,
      infraCost: 0,
    },
  };
}

export function monthlyInfraCost(stack: ModuleId[]) {
  return STACK_ITEMS.filter((i) => stack.includes(i.id)).reduce(
    (s, i) => s + i.monthly,
    0,
  );
}

/** Monthly subscriptions are drawn from cash daily. */
export function dailyInfraCost(stack: ModuleId[]) {
  return monthlyInfraCost(stack) / 30;
}

export function totalBudget(state: GameState) {
  return CHANNELS.reduce((s, c) => s + (state.budgets[c.id] || 0), 0);
}

// ── Buying and cancelling modules ────────────────────────────────

export function requirementsMet(state: GameState, item: StackItem) {
  return item.requires.every((r) => state.stack.includes(r));
}

export type Check = { ok: true } | { ok: false; reason: string };

export function canBuy(state: GameState, item: StackItem): Check {
  if (state.stack.includes(item.id)) return { ok: false, reason: "Already installed" };
  if (!requirementsMet(state, item)) {
    const missing = item.requires
      .filter((r) => !state.stack.includes(r))
      .map((r) => STACK_ITEMS.find((i) => i.id === r)!.name);
    return { ok: false, reason: `Requires: ${missing.join(", ")}` };
  }
  if (state.cash < item.setup) return { ok: false, reason: "Not enough cash" };
  return { ok: true };
}

export function canRemove(state: GameState, item: StackItem): Check {
  if (item.permanent) return { ok: false, reason: "Cannot be removed" };
  if (!state.stack.includes(item.id)) return { ok: false, reason: "Not installed" };
  const dependents = STACK_ITEMS.filter(
    (i) => state.stack.includes(i.id) && i.requires.includes(item.id),
  );
  if (dependents.length) {
    return {
      ok: false,
      reason: `Remove first: ${dependents.map((d) => d.name).join(", ")}`,
    };
  }
  return { ok: true };
}

/** Returns the next state; the caller decides whether to keep it. */
export function buy(state: GameState, id: ModuleId): { state: GameState; check: Check } {
  const item = STACK_ITEMS.find((i) => i.id === id)!;
  const check = canBuy(state, item);
  if (!check.ok) return { state, check };
  return {
    state: {
      ...state,
      cash: state.cash - item.setup,
      stack: [...state.stack, id],
      totals: { ...state.totals, infraCost: state.totals.infraCost + item.setup },
    },
    check,
  };
}

export function remove(state: GameState, id: ModuleId): { state: GameState; check: Check } {
  const item = STACK_ITEMS.find((i) => i.id === id)!;
  const check = canRemove(state, item);
  if (!check.ok) return { state, check };
  return { state: { ...state, stack: state.stack.filter((s) => s !== id) }, check };
}

// ── The daily simulation ─────────────────────────────────────────

export function runDay(prev: GameState): { state: GameState; result: DayResult } {
  const state: GameState = {
    ...prev,
    budgets: { ...prev.budgets },
    stack: [...prev.stack],
    history: [...prev.history],
    totals: { ...prev.totals },
  };

  const rng = mulberry32(state.seed + state.day * 7919 + state.rngCursor);
  state.rngCursor++;

  const stackSet = new Set<ModuleId>(state.stack);
  const log: LogLine[] = [];
  const journeys: Journey[] = [];

  // AGENT 4 — Market Event
  const market = Market.resolve(state.day, stackSet, state.activeEvents, rng);
  state.activeEvents = market.active;
  market.log.forEach((text) => log.push({ agent: "market", text }));
  if (!market.log.length) {
    log.push({ agent: "market", text: "Market conditions stable, no new crisis signal." });
  }

  const mods = market.modifiers;
  const channels: ChannelResult[] = [];

  for (const channel of CHANNELS) {
    const spend = Math.max(0, state.budgets[channel.id] || 0);

    // AGENT 1 — Customer Traffic
    const mix = CustomerTraffic.composition(channel, mods, rng);

    // AGENT 2 — Tracking Engine
    const engine = Tracking.evaluate(channel, stackSet, mix, mods);

    // AGENT 3 — Ad Platform Algo
    const perf = AdPlatform.optimizeBidding(channel, spend, engine, mods, state, rng);

    // Traffic volume is the click count the algorithm produced.
    const cohort = CustomerTraffic.generateCohort(channel, perf.clicks, mix);

    // AGENT 2, second pass — attribution: measured vs lost.
    const attribution = Tracking.attribute(perf.sales, engine);

    if (spend > 0) {
      Tracking.describe(channel, engine).forEach((text) =>
        log.push({ agent: "tracking", text }),
      );
      AdPlatform.describe(channel, perf, engine).forEach((text) =>
        log.push({ agent: "adplatform", text }),
      );
      log.push({
        agent: "customer",
        text:
          `[${channel.short}] ${cohort.visitors.toLocaleString("en-US")} visitors • ` +
          `${cohort.segments.adblocked.toLocaleString("en-US")} ad-blocked • ` +
          `${cohort.segments.inapp.toLocaleString("en-US")} in-app • ` +
          `${cohort.segments.consentDenied.toLocaleString("en-US")} denied consent`,
      });
      journeys.push(...CustomerTraffic.sampleJourneys(channel, mix, engine, rng, 2));
    }

    const reportedRevenue = attribution.reportedSales * perf.aov;
    channels.push({
      id: channel.id,
      name: channel.name,
      short: channel.short,
      color: channel.color,
      spend,
      mix,
      engine,
      perf,
      cohort,
      attribution,
      realRevenue: perf.revenue,
      reportedRevenue,
      realRoas: spend > 0 ? perf.revenue / spend : 0,
      reportedRoas: spend > 0 ? reportedRevenue / spend : 0,
      grossProfit: perf.grossProfit,
    });
  }

  // Financial close.
  const spend = channels.reduce((s, c) => s + c.spend, 0);
  const realRevenue = channels.reduce((s, c) => s + c.realRevenue, 0);
  const reportedRevenue = channels.reduce((s, c) => s + c.reportedRevenue, 0);
  const grossProfit = channels.reduce((s, c) => s + c.grossProfit, 0);
  const sales = channels.reduce((s, c) => s + c.perf.sales, 0);
  const trackedSales = channels.reduce((s, c) => s + c.attribution.trackedSales, 0);
  const infraCost = dailyInfraCost(state.stack);

  const organicRevenue = state.brandEquity * 700 * (1 + mods.aovMult);
  const netProfit = grossProfit + organicRevenue * 0.44 - spend - infraCost;
  state.cash += netProfit;

  // Brand equity grows with real sales volume and decays slightly each day.
  state.brandEquity = Math.min(1, state.brandEquity * 0.97 + sales / 12000);

  const weightedEmq =
    spend > 0
      ? channels.reduce((s, c) => s + c.engine.emq * c.spend, 0) / spend
      : channels.reduce((s, c) => s + c.engine.emq, 0) / channels.length;
  const weightedRetention =
    spend > 0
      ? channels.reduce((s, c) => s + c.engine.retention * c.spend, 0) / spend
      : 0;

  const result: DayResult = {
    day: state.day,
    channels,
    spend,
    infraCost,
    realRevenue,
    reportedRevenue,
    organicRevenue,
    grossProfit,
    netProfit,
    sales,
    trackedSales,
    realRoas: spend > 0 ? realRevenue / spend : 0,
    reportedRoas: spend > 0 ? reportedRevenue / spend : 0,
    emq: weightedEmq,
    retention: weightedRetention,
    cash: state.cash,
    brandEquity: state.brandEquity,
    events: market.triggered,
    log,
    journeys,
  };

  state.totals.spend += spend;
  state.totals.realRevenue += realRevenue;
  state.totals.reportedRevenue += reportedRevenue;
  state.totals.profit += netProfit;
  state.totals.sales += sales;
  state.totals.infraCost += infraCost;

  state.history.push({
    day: result.day,
    spend,
    realRevenue,
    reportedRevenue,
    netProfit,
    realRoas: result.realRoas,
    reportedRoas: result.reportedRoas,
    emq: weightedEmq,
    retention: weightedRetention,
    cash: state.cash,
  });

  if (state.cash <= GAME.BANKRUPTCY_AT) state.status = "bankrupt";
  else if (state.day >= GAME.TOTAL_DAYS) state.status = "finished";
  else state.day++;

  return { state, result };
}

// ── Scoring ──────────────────────────────────────────────────────

export function score(state: GameState): Score {
  const last5 = state.history.slice(-5);
  const avgEmq = last5.length
    ? last5.reduce((s, d) => s + d.emq, 0) / last5.length
    : 0;

  // Over-reporting is punished exactly like under-reporting.
  const ratio =
    state.totals.realRevenue > 0
      ? state.totals.reportedRevenue / state.totals.realRevenue
      : 0;
  const accuracy = Math.max(0, 1 - Math.abs(1 - ratio));
  const roas =
    state.totals.spend > 0 ? state.totals.realRevenue / state.totals.spend : 0;

  const points =
    Math.max(0, state.cash - GAME.START_CASH) * 0.01 +
    avgEmq * 220 +
    accuracy * 900 +
    roas * 260 +
    state.brandEquity * 400;

  const profit = state.cash - GAME.START_CASH;

  let grade: Score["grade"] = "D";
  if (points > 4500) grade = "S";
  else if (points > 3400) grade = "A";
  else if (points > 2400) grade = "B";
  else if (points > 1500) grade = "C";

  // However clean the signal, a campaign that lost money does not place at the top.
  if (profit < 0 && (grade === "S" || grade === "A" || grade === "B")) grade = "C";
  if (state.status === "bankrupt") grade = "F";

  return { points: Math.round(points), grade, avgEmq, accuracy, ratio, roas, profit };
}

export const CHANNEL_IDS: ChannelId[] = ["meta", "google", "tiktok"];
