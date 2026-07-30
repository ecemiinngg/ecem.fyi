// Attribution Tycoon — every tunable constant lives here: channel economics,
// the measurement stack catalog and the crisis calendar.

import type { Channel, MarketEvent, StackItem } from "./types";

export const GAME = {
  TOTAL_DAYS: 30,
  START_CASH: 25000,
  BANKRUPTCY_AT: 0,
  MAX_DAILY_BUDGET_PER_CHANNEL: 3000,
} as const;

export const CHANNELS: Channel[] = [
  {
    id: "meta",
    name: "Meta Ads",
    short: "Meta",
    color: "#4d8bff",
    cpcBase: 0.42,
    cpaBase: 20,
    aov: 86,
    margin: 0.42,
    capacity: 950,
    signalKey: "capi",
    signalLabel: "Conversions API",
    audience: { safari: 0.5, chrome: 0.38, inapp: 0.12 },
    iosShare: 0.58,
  },
  {
    id: "google",
    name: "Google Ads",
    short: "Google",
    color: "#f2b23e",
    cpcBase: 0.86,
    cpaBase: 26,
    aov: 112,
    margin: 0.4,
    capacity: 800,
    signalKey: "gads",
    signalLabel: "Advanced Consent Mode",
    audience: { safari: 0.42, chrome: 0.56, inapp: 0.02 },
    iosShare: 0.48,
  },
  {
    id: "tiktok",
    name: "TikTok Ads",
    short: "TikTok",
    color: "#ff4d7d",
    cpcBase: 0.28,
    cpaBase: 15,
    aov: 64,
    margin: 0.45,
    capacity: 650,
    signalKey: "eapi",
    signalLabel: "Events API (EAPI)",
    audience: { safari: 0.05, chrome: 0.05, inapp: 0.9 },
    iosShare: 0.6,
  },
];

/** Base audience distribution — the Customer Traffic Agent's input. */
export const AUDIENCE_BASE = {
  adblockRate: 0.3,
  consentDenied: 0.4,
  intent: { high: 0.18, medium: 0.42, low: 0.4 },
} as const;

export const STACK_ITEMS: StackItem[] = [
  {
    id: "ga4",
    name: "Client-Side GA4 + Pixels",
    vendor: "Default",
    monthly: 0,
    setup: 0,
    requires: [],
    permanent: true,
    tag: "Free",
    desc:
      "Browser-side gtag.js + Meta Pixel + TikTok Pixel. Ad blockers stop it, Safari ITP " +
      "caps the cookie at 24 hours and LTP strips fbclid/gclid.",
    effects: [
      "Pipeline integrity 0.82",
      "No ad blocker bypass",
      "24-hour cookie lifetime",
    ],
  },
  {
    id: "sgtm",
    name: "Hardal Server-Side GTM",
    vendor: "Hardal",
    monthly: 299,
    setup: 750,
    requires: [],
    tag: "Foundation",
    desc:
      "Server-side container behind your own first-party subdomain, tracking.brand.com. " +
      "Requests leave from your own domain, so ad blocker filter lists never match them.",
    effects: [
      "Pipeline integrity 0.99",
      "Ad blocker loss 100% → 6%",
      "Prerequisite for every other module",
    ],
  },
  {
    id: "cookie",
    name: "HTTP Set-Cookie Extension",
    vendor: "Hardal",
    monthly: 79,
    setup: 150,
    requires: ["sgtm"],
    tag: "Anti-ITP",
    desc:
      "Cookies are written server-side via an HttpOnly Set-Cookie header instead of JS. " +
      "Safari ITP's 24-hour client-side cap no longer applies; lifetime goes to 1 year.",
    effects: ["Safari signal loss 30% → 4%", "Immune to the iOS LTP event"],
  },
  {
    id: "capi",
    name: "Meta Conversions API",
    vendor: "Hardal",
    monthly: 149,
    setup: 300,
    requires: ["sgtm"],
    tag: "Meta",
    desc:
      "Server-to-server conversion delivery. Sends events to Meta independently of any " +
      "browser restriction and lifts the Event Match Quality score.",
    effects: ["Meta EMQ +1.8", "Closes most of Meta's signal loss"],
  },
  {
    id: "eapi",
    name: "TikTok Events API (EAPI)",
    vendor: "Hardal",
    monthly: 99,
    setup: 200,
    requires: ["sgtm"],
    tag: "TikTok",
    desc:
      "Compensates for the in-app browser's ephemeral storage loss with an S2S event " +
      "stream, so the campaign learning phase is never disrupted.",
    effects: ["In-app loss 55% → 8%", "TikTok EMQ +1.8"],
  },
  {
    id: "gads",
    name: "Advanced Consent Mode + Enhanced Conversions",
    vendor: "Hardal",
    monthly: 129,
    setup: 250,
    requires: ["sgtm"],
    tag: "Google",
    desc:
      "Collects cookieless pings from users who deny consent; Conversion Modeling then " +
      "recovers roughly 85% of the missing conversions.",
    effects: [
      "Google consent loss 75% → 8%",
      "Google EMQ +1.8",
      "Immune to the Cookielock event",
    ],
  },
  {
    id: "identity",
    name: "Server-Side Identity Graph",
    vendor: "Hardal",
    monthly: 199,
    setup: 400,
    requires: ["sgtm"],
    tag: "First-Party",
    desc:
      "Email, phone and user_id are hashed with SHA-256 on the server and passed as " +
      "advanced matching parameters. Users are stitched across devices.",
    effects: ["EMQ +1.2 on every channel", "Cross-device matching"],
  },
  {
    id: "dedup",
    name: "Event Deduplication (event_id)",
    vendor: "Hardal",
    monthly: 89,
    setup: 120,
    requires: ["sgtm"],
    tag: "Data Quality",
    desc:
      "Pixel and S2S report the same event twice. Without event_id matching your dashboard " +
      "shows inflated, fake ROAS and the algorithm learns from dirty data.",
    effects: [
      "Eliminates duplicate reporting",
      "EMQ +0.5",
      "Removes the CPA penalty",
    ],
  },
];

/**
 * Tracking engine coefficients.
 * S_retention = (1 - AdBlocker_eff) * (1 - SignalLoss) * PipelineIntegrity
 */
export const TRACKING = {
  /** Pipeline integrity: beacon loss, page abandonment, JS errors. */
  STACK_MULTIPLIER: { client: 0.82, server: 0.99 },
  ADBLOCK_LOSS: { client: 1.0, server: 0.06 },
  SAFARI_LOSS: { base: 0.3, withCookie: 0.04 },
  INAPP_LOSS: { base: 0.55, withEapi: 0.08 },
  CHROME_LOSS: { base: 0.06, server: 0.02 },
  CONSENT_LOSS: { google: 0.75, other: 0.3, advanced: 0.08 },
  EMQ: {
    base: 2.3,
    retentionWeight: 3.2,
    channelApi: 1.8,
    identity: 1.2,
    cookie: 0.8,
    consent: 0.5,
    dedup: 0.5,
    duplicatePenalty: -0.9,
    max: 9.4,
    min: 1.8,
  },
  /** Reported-sales inflation when deduplication is missing. */
  DUPLICATE_INFLATION: 0.35,
} as const;

export const ADPLATFORM = {
  /** Max CPC penalty as EMQ approaches 0. */
  CPC_BLIND_PENALTY: 0.4,
  SCALE_PENALTY: 0.45,
  LEARNING_PHASE_EMQ: 5.0,
  LEARNING_PHASE_PENALTY: 0.15,
  DUPLICATE_CPA_PENALTY: 0.12,
  BRAND_EQUITY_CAP: 0.12,
} as const;

export const SCHEDULED_EVENTS: MarketEvent[] = [
  {
    day: 4,
    id: "EVENT_ADBLOCK_SURGE",
    title: "Ad Blocker Filter Lists Updated",
    severity: "warn",
    body:
      "uBlock Origin and AdGuard shipped a filter set that aggressively blocks " +
      "connect.facebook.net and analytics.google.com. Ad blocker impact is up.",
    mitigatedBy: ["sgtm"],
    mitigatedText:
      "You send from a first-party subdomain, so the filter lists never matched you.",
    effects: { adblockDelta: 0.09 },
  },
  {
    day: 8,
    id: "EVENT_META_EMQ_AUDIT",
    title: "Meta Event Match Quality Audit",
    severity: "warn",
    body:
      "Meta re-scored the signal quality of pixel-only accounts. Advantage+ delivery is " +
      "now throttled for low-EMQ advertisers.",
    mitigatedBy: ["capi"],
    mitigatedText: "Your S2S event stream over CAPI kept you clear of the audit.",
    effects: { channelCpa: { meta: 0.28 }, channelEmq: { meta: -0.8 } },
  },
  {
    day: 10,
    id: "EVENT_APPLE_IOS_UPDATE",
    title: "iOS Update: Link Tracking Protection",
    severity: "critical",
    body:
      "Apple LTP is live: fbclid and gclid parameters are stripped from URLs, and Safari " +
      "ITP has cut client-side cookie lifetime to 24 hours.",
    mitigatedBy: ["cookie"],
    mitigatedText:
      "Your cookies are written via an HTTP Set-Cookie header, so the ITP cap does not apply.",
    effects: { safariLossDelta: 0.3, emqDelta: -0.5 },
  },
  {
    day: 15,
    id: "EVENT_CONSENT_ENFORCEMENT",
    title: "Consent Enforcement: Consent Mode v2 Required",
    severity: "warn",
    body:
      "After a data protection audit the cookie banner was tightened. The share of users " +
      "denying consent has risen.",
    mitigatedBy: ["gads"],
    mitigatedText:
      "Advanced Consent Mode collects cookieless pings, so modeling covers the gap.",
    effects: { consentDeniedDelta: 0.14 },
  },
  {
    day: 20,
    id: "EVENT_GOOGLE_COOKIELOCK",
    title: "Google Cookielock: Third-Party Cookie Restrictions",
    severity: "critical",
    body:
      "Chrome restricted third-party cookies. Accounts without a Consent Mode v2 signal " +
      "can no longer feed conversions to Smart Bidding.",
    mitigatedBy: ["gads"],
    mitigatedText:
      "Conversion Modeling is active; most of the lost conversions came back modelled.",
    effects: {
      channelCpa: { google: 0.35 },
      channelEmq: { google: -1.1 },
      chromeLossDelta: 0.18,
    },
  },
  {
    day: 24,
    id: "EVENT_PEAK_SEASON",
    title: "Peak Season: The Auction Heats Up",
    severity: "good",
    body:
      "Peak shopping season started. Competition and click costs are up across every " +
      "channel, but so are conversion rate and basket size. Strong signal wins.",
    mitigatedBy: [],
    effects: { cpcMult: 0.35, cvrMult: 0.22, aovMult: 0.1 },
  },
  {
    day: 27,
    id: "EVENT_TIKTOK_ALGO_SHIFT",
    title: "TikTok In-App Browser Restriction",
    severity: "critical",
    body:
      "TikTok hardened storage isolation in its in-app browser. Every client-side " +
      "identifier is wiped when the session closes, breaking the learning phase.",
    mitigatedBy: ["eapi"],
    mitigatedText:
      "The EAPI S2S stream keeps flowing, so the learning phase is protected.",
    effects: {
      inappLossDelta: 0.15,
      channelCpa: { tiktok: 0.38 },
      channelEmq: { tiktok: -1.0 },
    },
  },
];

/** One of these fires with 22% probability on a day with no scheduled crisis. */
export const RANDOM_EVENTS: MarketEvent[] = [
  {
    id: "EVENT_ITP_TIGHTEN",
    title: "Safari ITP 3.x Tightening",
    severity: "warn",
    body: "Safari now caps every script-written first-party cookie at 7 days.",
    mitigatedBy: ["cookie"],
    mitigatedText: "You write cookies server-side, so nothing changed for you.",
    effects: { safariLossDelta: 0.18 },
  },
  {
    id: "EVENT_PRIVATE_RELAY",
    title: "iCloud Private Relay Adoption Spikes",
    severity: "warn",
    body: "IP-based matching weakened; geo targeting and match rates dropped.",
    mitigatedBy: ["identity"],
    mitigatedText:
      "Hashed first-party identifiers remove the dependency on IP matching.",
    effects: { emqDelta: -0.6 },
  },
  {
    id: "EVENT_COMPETITOR_WAR",
    title: "A Competitor Is Bidding Aggressively",
    severity: "warn",
    body: "A rival doubled its budget on your audience and auction costs went up.",
    mitigatedBy: [],
    effects: { cpcMult: 0.22, cpaMult: 0.14 },
  },
  {
    id: "EVENT_VIRAL_CREATIVE",
    title: "Your Creative Went Viral",
    severity: "good",
    body: "Your UGC video spread organically: click costs fell and conversions rose.",
    mitigatedBy: [],
    effects: { cpcMult: -0.2, cvrMult: 0.25 },
  },
  {
    id: "EVENT_PIXEL_OUTAGE",
    title: "Pixel Outage",
    severity: "critical",
    body:
      "A third-party CDN outage kept client-side pixels from loading for several hours.",
    mitigatedBy: ["sgtm"],
    mitigatedText:
      "The server-side container stayed up and the data flow never stopped.",
    effects: { retentionMult: -0.35 },
  },
  {
    id: "EVENT_EMAIL_CAPTURE",
    title: "Newsletter Campaign Paid Off",
    severity: "good",
    body: "An on-site pop-up collected a large pool of first-party email addresses.",
    mitigatedBy: [],
    effects: { emqDelta: 0.4 },
  },
];

export const ALL_EVENTS: MarketEvent[] = [...SCHEDULED_EVENTS, ...RANDOM_EVENTS];
