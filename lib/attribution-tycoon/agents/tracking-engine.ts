// 2. TRACKING ENGINE AGENT
//
// Captures or drops the events fired by the Customer Traffic Agent, depending
// on the stack the player has built, then scores the surviving signal.
//
//   S_retention = (1 - AdBlocker_eff) * (1 - SignalLoss) * PipelineIntegrity

import { TRACKING } from "../config";
import type {
  Attribution,
  Channel,
  CohortMix,
  EngineReading,
  ModuleId,
  Modifiers,
} from "../types";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function evaluate(
  channel: Channel,
  stack: Set<ModuleId>,
  mix: CohortMix,
  mods: Modifiers,
): EngineReading {
  const serverSide = stack.has("sgtm");
  const hasCookie = serverSide && stack.has("cookie");
  const hasEapi = serverSide && stack.has("eapi");
  const hasConsent = serverSide && stack.has("gads");
  const hasIdentity = serverSide && stack.has("identity");
  const hasDedup = serverSide && stack.has("dedup");
  const hasChannelApi = serverSide && stack.has(channel.signalKey);

  // 1) Signal loss per segment.
  const losses = {
    adblock: serverSide
      ? TRACKING.ADBLOCK_LOSS.server
      : TRACKING.ADBLOCK_LOSS.client,
    safari: clamp(
      (hasCookie ? TRACKING.SAFARI_LOSS.withCookie : TRACKING.SAFARI_LOSS.base) +
        mods.safariLossDelta,
      0,
      0.95,
    ),
    inapp: clamp(
      (hasEapi ? TRACKING.INAPP_LOSS.withEapi : TRACKING.INAPP_LOSS.base) +
        mods.inappLossDelta,
      0,
      0.95,
    ),
    chrome: clamp(
      (serverSide ? TRACKING.CHROME_LOSS.server : TRACKING.CHROME_LOSS.base) +
        mods.chromeLossDelta,
      0,
      0.95,
    ),
    consent: hasConsent
      ? TRACKING.CONSENT_LOSS.advanced
      : channel.id === "google"
        ? TRACKING.CONSENT_LOSS.google
        : TRACKING.CONSENT_LOSS.other,
  };

  // 2) Weighted total signal loss.
  const browserLoss =
    mix.safari * losses.safari +
    mix.chrome * losses.chrome +
    mix.inapp * losses.inapp;

  const consentLoss = mix.consentDenied * losses.consent;

  // Union of independent events: P(A ∪ B) = A + B(1 - A).
  const signalLoss = clamp(browserLoss + consentLoss * (1 - browserLoss), 0, 0.97);

  const adblockEff = clamp(mix.adblockRate * losses.adblock, 0, 0.95);
  const pipeline = serverSide
    ? TRACKING.STACK_MULTIPLIER.server
    : TRACKING.STACK_MULTIPLIER.client;

  const retention = clamp(
    (1 - adblockEff) * (1 - signalLoss) * pipeline * (1 + mods.retentionMult),
    0.02,
    0.99,
  );

  // 3) EMQ / signal quality score.
  const E = TRACKING.EMQ;
  let emq = E.base + retention * E.retentionWeight;
  if (hasChannelApi) emq += E.channelApi;
  if (hasIdentity) emq += E.identity;
  if (hasCookie) emq += E.cookie;
  if (hasConsent) emq += E.consent;
  if (hasDedup) emq += E.dedup;

  // Pixel and S2S both firing without event_id matching means the algorithm
  // learns from duplicated data — quality drops.
  const duplicating = hasChannelApi && !hasDedup;
  if (duplicating) emq += E.duplicatePenalty;

  emq += mods.emqDelta + mods.channelEmq[channel.id];
  emq = clamp(emq, E.min, E.max);

  return {
    channel: channel.id,
    serverSide,
    cookie: hasCookie,
    eapi: hasEapi,
    consent: hasConsent,
    identity: hasIdentity,
    dedup: hasDedup,
    channelApi: hasChannelApi,
    duplicating,
    losses,
    browserLoss,
    consentLoss,
    signalLoss,
    adblockEff,
    stackMultiplier: pipeline,
    retention,
    emq,
  };
}

/**
 * Splits realised sales into measured / source-unknown / never-seen. This is
 * what creates the gap between the dashboard and reality.
 */
export function attribute(
  actualSales: number,
  engine: EngineReading,
): Attribution {
  const tracked = actualSales * engine.retention;
  const lost = actualSales - tracked;

  // Some lost sales are still recorded on site but with the source stripped:
  // they land in GA4 as "Direct / (not set)". Ad-blocked users never appear.
  const recoverableShare = engine.serverSide ? 0.85 : 0.55;
  const directUnassigned = lost * recoverableShare;
  const invisible = lost - directUnassigned;

  const inflation = engine.duplicating ? TRACKING.DUPLICATE_INFLATION : 0;

  return {
    trackedSales: tracked,
    reportedSales: tracked * (1 + inflation),
    directUnassigned,
    invisible,
    inflation,
    lostSales: lost,
  };
}

/** Console log — what the agent did today. */
export function describe(channel: Channel, engine: EngineReading): string[] {
  const l: string[] = [];
  if (!engine.serverSide) {
    l.push(
      `[${channel.short}] client-side mode: dropped events for ${(engine.adblockEff * 100).toFixed(0)}% ad-blocked users.`,
    );
    if (channel.id === "google") {
      l.push(`[${channel.short}] pings blocked for non-consented users (Basic Consent Mode).`);
    }
    if (channel.id === "tiktok") {
      l.push(`[${channel.short}] in-app browser session closed, ephemeral storage wiped.`);
    } else {
      l.push(`[${channel.short}] Safari ITP: fbp/fbc cookie lifetime cut to 24 hours.`);
    }
  } else {
    l.push(`[${channel.short}] first-party proxy live on tracking.brand.com, ad blockers bypassed.`);
    if (engine.cookie) {
      l.push(`[${channel.short}] cookie lifetime extended to 1 year via Set-Cookie header.`);
    }
    if (engine.identity) {
      l.push(`[${channel.short}] email/phone hashed with SHA-256 and added to advanced matching.`);
    }
    if (engine.channelApi) {
      l.push(`[${channel.short}] S2S event dispatched to the ${channel.signalLabel} endpoint.`);
    }
    if (engine.duplicating) {
      l.push(`[${channel.short}] ⚠ no event_id: pixel + S2S are double-reporting, the dashboard is inflated.`);
    }
  }
  l.push(
    `[${channel.short}] S_retention = ${(engine.retention * 100).toFixed(1)}% • EMQ = ${engine.emq.toFixed(1)}/10`,
  );
  return l;
}
