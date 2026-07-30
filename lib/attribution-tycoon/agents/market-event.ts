// 4. MARKET EVENT AGENT
//
// Produces scheduled and random external crises, decides whether the player's
// installed stack mitigates them, and serves that day's market modifiers to the
// other three agents.

import { RANDOM_EVENTS, SCHEDULED_EVENTS } from "../config";
import type {
  ActiveEvent,
  ChannelId,
  MarketEvent,
  ModuleId,
  Modifiers,
  Rng,
} from "../types";

/** Structural shifts: they happen once and never revert. */
const PERMANENT = new Set([
  "EVENT_ADBLOCK_SURGE",
  "EVENT_APPLE_IOS_UPDATE",
  "EVENT_CONSENT_ENFORCEMENT",
  "EVENT_GOOGLE_COOKIELOCK",
  "EVENT_TIKTOK_ALGO_SHIFT",
  "EVENT_META_EMQ_AUDIT",
]);

const TEMP_DURATION: Record<string, number> = {
  EVENT_PEAK_SEASON: 5,
  EVENT_VIRAL_CREATIVE: 2,
  EVENT_COMPETITOR_WAR: 3,
  EVENT_PIXEL_OUTAGE: 1,
  EVENT_ITP_TIGHTEN: 4,
  EVENT_PRIVATE_RELAY: 4,
  EVENT_EMAIL_CAPTURE: 3,
};

const CHANNEL_IDS: ChannelId[] = ["meta", "google", "tiktok"];

export function emptyModifiers(): Modifiers {
  return {
    adblockDelta: 0,
    consentDeniedDelta: 0,
    safariLossDelta: 0,
    inappLossDelta: 0,
    chromeLossDelta: 0,
    retentionMult: 0,
    emqDelta: 0,
    channelEmq: { meta: 0, google: 0, tiktok: 0 },
    channelCpa: { meta: 0, google: 0, tiktok: 0 },
    cpcMult: 0,
    cpaMult: 0,
    cvrMult: 0,
    aovMult: 0,
  };
}

/** Does the player's stack cover this crisis? */
export function isMitigated(event: MarketEvent, stack: Set<ModuleId>) {
  if (!event.mitigatedBy.length) return false;
  return event.mitigatedBy.some((id) => stack.has(id));
}

/**
 * Sums the effects of the active events.
 * Mitigation is re-evaluated every day, so buying a module mid-crisis cancels
 * that crisis from the same day onwards.
 */
export function aggregate(entries: ActiveEvent[], stack: Set<ModuleId>): Modifiers {
  const mods = emptyModifiers();
  for (const entry of entries) {
    entry.mitigated = isMitigated(entry.event, stack);
    if (entry.mitigated) continue;

    const fx = entry.event.effects;
    mods.adblockDelta += fx.adblockDelta ?? 0;
    mods.consentDeniedDelta += fx.consentDeniedDelta ?? 0;
    mods.safariLossDelta += fx.safariLossDelta ?? 0;
    mods.inappLossDelta += fx.inappLossDelta ?? 0;
    mods.chromeLossDelta += fx.chromeLossDelta ?? 0;
    mods.retentionMult += fx.retentionMult ?? 0;
    mods.emqDelta += fx.emqDelta ?? 0;
    mods.cpcMult += fx.cpcMult ?? 0;
    mods.cpaMult += fx.cpaMult ?? 0;
    mods.cvrMult += fx.cvrMult ?? 0;
    mods.aovMult += fx.aovMult ?? 0;
    for (const ch of CHANNEL_IDS) {
      mods.channelEmq[ch] += fx.channelEmq?.[ch] ?? 0;
      mods.channelCpa[ch] += fx.channelCpa?.[ch] ?? 0;
    }
  }
  return mods;
}

export interface MarketResolution {
  modifiers: Modifiers;
  active: ActiveEvent[];
  triggered: Array<{ event: MarketEvent; mitigated: boolean }>;
  log: string[];
}

export function resolve(
  day: number,
  stack: Set<ModuleId>,
  active: ActiveEvent[],
  rng: Rng,
): MarketResolution {
  const log: string[] = [];
  const triggered: Array<{ event: MarketEvent; mitigated: boolean }> = [];
  const next: ActiveEvent[] = [];

  // 1) Age the carried-over events. `null` remaining means permanent.
  for (const entry of active) {
    if (entry.remaining === null) {
      next.push({ ...entry });
      continue;
    }
    const remaining = entry.remaining - 1;
    if (remaining > 0) next.push({ ...entry, remaining });
    else log.push(`↩︎ "${entry.event.title}" has worn off.`);
  }

  // 2) Scheduled events for today.
  const scheduled = SCHEDULED_EVENTS.filter((e) => e.day === day);

  // 3) Roll for a random event — never on a scheduled-crisis day.
  const rolled: MarketEvent[] = [];
  if (scheduled.length === 0 && day > 2 && rng() < 0.22) {
    const pool = RANDOM_EVENTS.filter(
      (e) => !next.some((a) => a.event.id === e.id),
    );
    if (pool.length) rolled.push(pool[Math.floor(rng() * pool.length)]);
  }

  // 4) Activate them.
  for (const event of [...scheduled, ...rolled]) {
    const mitigated = isMitigated(event, stack);
    const remaining = PERMANENT.has(event.id)
      ? null
      : (TEMP_DURATION[event.id] ?? 2);

    next.push({ event, remaining, mitigated });
    triggered.push({ event, mitigated });

    if (mitigated) {
      log.push(`🛡 ${event.title} → MITIGATED (${event.mitigatedBy.join(", ")})`);
    } else {
      const icon =
        event.severity === "good" ? "✨" : event.severity === "critical" ? "🔥" : "⚠";
      log.push(`${icon} ${event.title} triggered.`);
    }
  }

  return { modifiers: aggregate(next, stack), active: next, triggered, log };
}

/** Leaks upcoming crises to the player — the intelligence panel. */
export function upcoming(day: number, lookahead = 6) {
  return SCHEDULED_EVENTS.filter(
    (e) => e.day !== undefined && e.day > day && e.day <= day + lookahead,
  ).map((e) => ({
    day: e.day as number,
    title: e.title,
    severity: e.severity,
    mitigatedBy: e.mitigatedBy,
  }));
}
