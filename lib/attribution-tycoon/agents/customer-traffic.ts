// 1. CUSTOMER TRAFFIC AGENT
//
// Generates the cohort of virtual users visiting the storefront: their device,
// browser, ad blocker, consent and purchase-intent composition, plus the raw
// event stream they fire on site.

import { AUDIENCE_BASE } from "../config";
import type {
  Channel,
  Cohort,
  CohortMix,
  EngineReading,
  Journey,
  Modifiers,
  Rng,
} from "../types";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Daily variance — a cohort is never composed exactly the same twice. */
function jitter(rng: Rng, value: number, spread: number) {
  return clamp01(value + (rng() * 2 - 1) * spread);
}

export function composition(
  channel: Channel,
  mods: Modifiers,
  rng: Rng,
): CohortMix {
  const a = channel.audience;
  let safari = jitter(rng, a.safari, 0.03);
  let chrome = jitter(rng, a.chrome, 0.03);
  let inapp = jitter(rng, a.inapp, 0.02);

  // Browser shares are normalised to 1.
  const sum = safari + chrome + inapp;
  safari /= sum;
  chrome /= sum;
  inapp /= sum;

  // The draws below must stay in this exact order: the PRNG is seeded per day,
  // so reordering them silently changes every downstream number.
  const iosShare = jitter(rng, channel.iosShare, 0.03);
  const adblockRate = clamp01(
    jitter(rng, AUDIENCE_BASE.adblockRate, 0.03) + mods.adblockDelta,
  );
  const consentDenied = clamp01(
    jitter(rng, AUDIENCE_BASE.consentDenied, 0.04) + mods.consentDeniedDelta,
  );
  const high = jitter(rng, AUDIENCE_BASE.intent.high, 0.03);
  const isum = high + AUDIENCE_BASE.intent.medium + AUDIENCE_BASE.intent.low;

  return {
    safari,
    chrome,
    inapp,
    iosShare,
    adblockRate,
    consentDenied,
    intent: {
      high: high / isum,
      medium: AUDIENCE_BASE.intent.medium / isum,
      low: AUDIENCE_BASE.intent.low / isum,
    },
  };
}

/**
 * Sizes the cohort and its event stream. Visitor count comes from the effective
 * CPC computed by the Ad Platform Agent.
 */
export function generateCohort(
  channel: Channel,
  visitors: number,
  mix: CohortMix,
): Cohort {
  return {
    channel: channel.id,
    visitors,
    segments: {
      safari: Math.round(visitors * mix.safari),
      chrome: Math.round(visitors * mix.chrome),
      inapp: Math.round(visitors * mix.inapp),
      adblocked: Math.round(visitors * mix.adblockRate),
      consentDenied: Math.round(visitors * mix.consentDenied),
      ios: Math.round(visitors * mix.iosShare),
    },
    // What actually happens on site — not what gets measured.
    events: {
      page_view: visitors,
      view_item: Math.round(visitors * 0.62),
      add_to_cart: Math.round(visitors * 0.17),
      begin_checkout: Math.round(visitors * 0.072),
    },
  };
}

const FIRST_NAMES = [
  "Maya", "Noah", "Elif", "Chloe", "Deniz", "Ada", "Liam", "Nora",
  "Omar", "Sofia", "Arda", "Iris", "Jonas", "Lara", "Theo", "Mina",
];

/**
 * Samples individual customer journeys for the live feed. Purely illustrative:
 * it does not feed back into the simulation math.
 */
export function sampleJourneys(
  channel: Channel,
  mix: CohortMix,
  engine: EngineReading,
  rng: Rng,
  count = 2,
): Journey[] {
  const out: Journey[] = [];
  for (let i = 0; i < count; i++) {
    const r = rng();
    const browser: Journey["browser"] =
      r < mix.inapp ? "inapp" : r < mix.inapp + mix.safari ? "safari" : "chrome";
    const adblock = rng() < mix.adblockRate;
    const consent = rng() >= mix.consentDenied;
    const os: Journey["os"] = rng() < mix.iosShare ? "iOS" : "Android";

    // Capture probability comes straight from the engine's segment losses.
    let p = engine.stackMultiplier * (1 - engine.losses[browser]);
    if (adblock) p *= 1 - engine.losses.adblock;
    if (!consent) p *= 1 - engine.losses.consent;

    const tracked = rng() < p;
    out.push({
      name: FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)],
      os,
      browser,
      adblock,
      consent,
      channel: channel.id,
      tracked,
      reason: tracked
        ? engine.serverSide
          ? "captured by first-party sGTM"
          : "pixel loaded fine"
        : adblock && !engine.serverSide
          ? "ad blocker stopped the pixel"
          : browser === "inapp" && !engine.eapi
            ? "in-app storage wiped"
            : browser === "safari" && !engine.cookie
              ? "ITP expired the cookie in 24h"
              : !consent && !engine.consent
                ? "no consent → ping blocked"
                : "signal lost",
    });
  }
  return out;
}
