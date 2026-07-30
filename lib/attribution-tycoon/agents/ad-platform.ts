// 3. AD PLATFORM ALGO AGENT
//
// Imitates the Meta / Google / TikTok bidding engines. Rewards or punishes the
// campaign based on the signal quality the Tracking Engine delivered.
//
//   CPA_effective = CPA_base / (EMQ / 10)

import { ADPLATFORM } from "../config";
import type { Channel, EngineReading, Modifiers, Performance, Rng } from "../types";

export function optimizeBidding(
  channel: Channel,
  spend: number,
  engine: EngineReading,
  mods: Modifiers,
  state: { brandEquity: number },
  rng: Rng,
): Performance {
  if (spend <= 0) {
    return {
      channel: channel.id,
      spend: 0,
      clicks: 0,
      cpc: 0,
      sales: 0,
      cpaBase: channel.cpaBase,
      cpaEffective: 0,
      aov: channel.aov,
      revenue: 0,
      grossProfit: 0,
      learningPhase: false,
      scalePenalty: 1,
      wastedShare: 0,
      blind: false,
    };
  }

  const emq = engine.emq;

  // 1) Click cost — a weak signal means blind delivery.
  const blindness = (10 - emq) / 10; // 0 = perfect, 1 = blind
  let cpc =
    channel.cpcBase *
    (1 + blindness * ADPLATFORM.CPC_BLIND_PENALTY) *
    (1 + mods.cpcMult);
  cpc = Math.max(0.05, cpc * (0.96 + rng() * 0.08));
  const clicks = Math.round(spend / cpc);

  // 2) Acquisition cost.
  let cpa = channel.cpaBase / (emq / 10);

  // Crisis and market effects.
  cpa *= 1 + mods.cpaMult + mods.channelCpa[channel.id];

  // A conversion-rate lift (peak season, viral creative) lowers CPA.
  cpa /= 1 + mods.cvrMult;

  // Scaling penalty: budget beyond efficient capacity gets expensive.
  const over = Math.max(0, spend / channel.capacity - 1);
  const scalePenalty = 1 + Math.pow(over, 1.15) * ADPLATFORM.SCALE_PENALTY;
  cpa *= scalePenalty;

  // Learning phase: below the EMQ threshold it never finishes learning.
  const learningPhase = emq < ADPLATFORM.LEARNING_PHASE_EMQ;
  if (learningPhase) cpa *= 1 + ADPLATFORM.LEARNING_PHASE_PENALTY;

  // A duplicated event stream trains the algorithm on the wrong data.
  if (engine.duplicating) cpa *= 1 + ADPLATFORM.DUPLICATE_CPA_PENALTY;

  // Brand awareness lowers acquisition cost over time.
  const brandDiscount = Math.min(ADPLATFORM.BRAND_EQUITY_CAP, state.brandEquity);
  cpa *= 1 - brandDiscount;

  // Daily noise.
  cpa *= 0.94 + rng() * 0.12;
  cpa = Math.max(1, cpa);

  // 3) Results.
  const sales = spend / cpa;
  const aov = channel.aov * (1 + mods.aovMult);
  const revenue = sales * aov;

  return {
    channel: channel.id,
    spend,
    clicks,
    cpc,
    sales,
    cpaBase: channel.cpaBase,
    cpaEffective: cpa,
    aov,
    revenue,
    grossProfit: revenue * channel.margin,
    learningPhase,
    scalePenalty,
    blind: blindness > 0.5,
    // Share of budget delivered to the wrong audience because of blind targeting.
    wastedShare: Math.min(0.6, blindness * 0.62),
  };
}

export function describe(
  channel: Channel,
  perf: Performance,
  engine: EngineReading,
): string[] {
  const l: string[] = [];
  if (perf.spend <= 0) return l;

  if (engine.emq >= 8) {
    const engineName =
      channel.id === "meta"
        ? "Advantage+"
        : channel.id === "google"
          ? "PMax"
          : "Smart Performance";
    l.push(`[${channel.short}] strong signal: ${engineName} locked onto the right audience.`);
  } else if (perf.blind) {
    l.push(
      `[${channel.short}] weak signal: the algorithm is blind, ~${(perf.wastedShare * 100).toFixed(0)}% of budget went to the wrong audience.`,
    );
  }
  if (perf.learningPhase) {
    l.push(`[${channel.short}] ⚠ learning phase reset (EMQ < ${ADPLATFORM.LEARNING_PHASE_EMQ}).`);
  }
  if (perf.scalePenalty > 1.05) {
    l.push(
      `[${channel.short}] capacity exceeded: CPA took a ${((perf.scalePenalty - 1) * 100).toFixed(0)}% scaling penalty.`,
    );
  }
  l.push(
    `[${channel.short}] CPA_base $${perf.cpaBase} → CPA_effective $${perf.cpaEffective.toFixed(2)} • CPC $${perf.cpc.toFixed(2)}`,
  );
  return l;
}
