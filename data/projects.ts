export interface Project {
  slug: string;
  title: string;
  summary: string;
  description: string;
  stack: string[];
  year: string;
  role: string;
  highlights: string[];
  liveUrl?: string;
  repoUrl?: string;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    slug: "server-side-tracking-migration",
    title: "Server-Side Tracking Migration",
    summary:
      "Migrated a 40M-event/month ecommerce container from client-side GTM to a server-side tagging setup on Cloud Run.",
    description:
      "Led the migration of a high-traffic ecommerce site's tag container to server-side GTM. Rebuilt the ecommerce data layer schema, set up a tagging server on Cloud Run behind a first-party subdomain, and re-mapped every downstream vendor (GA4, Meta CAPI, TikTok) to the new event contract while holding conversion counts within 1.5% of the legacy setup during a six-week parallel run.",
    stack: ["GTM Server-Side", "Cloud Run", "GA4", "Meta CAPI", "BigQuery"],
    year: "2026",
    role: "Analytics Engineer",
    highlights: [
      "Cut third-party cookie dependency to near zero for core conversion events",
      "Reduced tag-load JS on the client by ~38%",
      "Built the monitoring dashboard that catches silent tag failures within 5 minutes",
    ],
    featured: true,
  },
  {
    slug: "ga4-bigquery-attribution-model",
    title: "Custom Attribution Model on BigQuery",
    summary:
      "Built a data-driven, position-weighted attribution model on top of the raw GA4 BigQuery export, replacing last-click reporting.",
    description:
      "The marketing team's last-click GA4 reports systematically under-credited upper-funnel channels. Designed a SQL-based multi-touch attribution model over the raw BigQuery export — flattening nested event/session data, reconstructing user paths, and weighting touchpoints — surfaced through a Looker Studio dashboard refreshed nightly.",
    stack: ["BigQuery", "SQL", "dbt", "Looker Studio", "GA4"],
    year: "2025",
    role: "Data Analyst",
    highlights: [
      "Reduced query cost 90% by materializing flattened event tables",
      "Reallocated ~15% of paid budget toward upper-funnel channels based on model output",
    ],
    featured: true,
  },
  {
    slug: "consent-mode-v2-rollout",
    title: "Consent Mode v2 Rollout",
    summary:
      "Rolled out Google Consent Mode v2 across an EU-facing property, including CMP integration and modeling threshold analysis.",
    description:
      "Implemented Consent Mode v2 signals across the tag container ahead of the EEA enforcement deadline, integrated the CMP's consent state into the data layer, and audited which markets fell below GA4's behavioral modeling thresholds to set expectations with stakeholders before launch.",
    stack: ["GTM", "Consent Mode v2", "GA4", "CMP Integration"],
    year: "2025",
    role: "Analytics Engineer",
    highlights: [
      "Zero compliance flags in post-launch legal review",
      "Documented modeling gaps for 6 low-traffic EU markets ahead of stakeholder Q&A",
    ],
  },
  {
    slug: "pipeline-observability-dashboard",
    title: "Data Pipeline Observability Dashboard",
    summary:
      "Internal dashboard that tracks freshness, row-count anomalies, and schema drift across 12 nightly ELT pipelines.",
    description:
      "Built an internal observability layer over the team's Airflow-orchestrated ELT pipelines — freshness SLAs, row-count anomaly detection using rolling z-scores, and schema-drift alerts posted to Slack before a broken pipeline reaches a stakeholder dashboard.",
    stack: ["Python", "Airflow", "BigQuery", "Slack API"],
    year: "2025",
    role: "Data Engineer",
    highlights: [
      "Caught 3 schema-breaking upstream changes before they hit production dashboards",
      "Reduced mean time-to-detection for pipeline failures from ~18h to under 30min",
    ],
  },
  {
    slug: "rewrite-the-epic",
    title: "Destanı Yeniden Yaz — Odyssey A/B Test",
    summary:
      "A Turkish-language decision-tree RPG that A/B tests the player against Homer: five canon dilemmas from the Odyssey, scored on rationality, curiosity, risk and leadership.",
    description:
      "The Odyssey rebuilt as an analytics simulation. The player takes Odysseus's five historical dilemmas — Polyphemus's cave, a year on Circe's island, the Sirens, Scylla vs. Charybdis, the cattle of Helios — and every choice moves crew count, elapsed months and four personality metrics. At the end an analytics agent runs the player's decision vector against Odysseus's own line and reports the percentage gaps, a leadership profile and a note per node. Five specialised modules do the work behind an orchestrator: a narrator that writes the scene in Homeric register, a canon database that holds what Odysseus actually did, a rule engine that resolves deterministic and probabilistic outcomes from a seeded PRNG, and the KPI reporter. The canon comparison is not hardcoded — canon choices run through the same engine in expected-value mode, which is what keeps the two vectors comparable and is verified against Homer's own totals: 120 months and zero surviving crew.",
    stack: ["TypeScript", "React", "Next.js", "Decision Trees", "A/B Testing", "SVG"],
    year: "2026",
    role: "Designer & Developer",
    highlights: [
      "Canon Vector is computed, not written: Odysseus's line runs through the same engine deterministically and reproduces the epic's own figures — 120 months, 100% crew loss — with a checker that fails loudly if the data drifts",
      "All 640 terminal paths through the tree were swept for correctness: no NaN, no out-of-range metric, no unreachable report — which is how a mid-run clamp that was quietly understating canon curiosity got caught",
      "Seeded PRNG (mulberry32) makes every run reproducible: same seed plus same decisions replays the same dice, and the seed ships inside the exported report",
      "Uncertainty meters are derived from the rules — risk appetite, variance probability and fatal branches — so a choice discloses how predictable it is without leaking its outcome",
      "Seven hand-drawn wireframe characters animate in place (a blinking cyclops, fluttering sirens, a turning Charybdis), and the whole motion layer — typewriter narration, dice roll, growing bars — switches off under prefers-reduced-motion",
    ],
    liveUrl: "https://destani-yeniden-yaz.vercel.app",
    featured: true,
  },
  {
    slug: "attribution-tycoon",
    title: "Attribution Tycoon — The Tracking Wars",
    summary:
      "A 30-day budget simulation where making the sale is not enough — you have to be able to measure it. Four agents model traffic, signal loss, EMQ and ad-platform bidding.",
    description:
      "A measurement-infrastructure simulation built as four independent agents that hand off to each other every simulated day: a Customer Traffic agent generates a cohort with a real device/browser/ad-blocker/consent composition, a Tracking Engine decides per segment which of those events survive, an Ad Platform agent prices delivery from the surviving signal, and a Market Event agent fires the real-world crises — Apple's Link Tracking Protection, Google Cookielock, TikTok's in-app browser lockdown. Retention is S_retention = (1 − AdBlocker_eff) × (1 − SignalLoss) × PipelineIntegrity, and that retention plus your installed modules produce an EMQ score the bidding engine turns into cost: CPA_effective = CPA_base ÷ (EMQ / 10). The point of the game is the gap this produces. A client-side-only stack lands at EMQ ≈ 3.4, which turns Meta's $20 base CPA into ~$59 and shows 0.4x ROAS on the dashboard while reality is 1.3x — so the player is tempted to cut budget on a channel that is actually working. Install CAPI without event deduplication and the trap inverts: the dashboard now reports more revenue than happened.",
    stack: [
      "TypeScript",
      "React",
      "Server-Side Tagging",
      "Meta CAPI",
      "Consent Mode v2",
      "Canvas",
    ],
    year: "2026",
    role: "Designer & Developer",
    highlights: [
      "Four decoupled agents — traffic, tracking, bidding, market events — orchestrated by one deterministic daily loop, so every number on screen is computed rather than scripted",
      "Ported from a vanilla-JS reference build and verified value-for-value against it: 5,904 checks across 3 seeds × 6 strategies match to 1e-9, which is how a PRNG call-order bug in the port was caught",
      "Balanced with headless play-testers: client-side-only loses $22.4k over 30 days, a full server-side stack at capacity budget returns +$65.9k, and over-scaling on a weak signal goes bankrupt on day 11",
      "Models the deduplication trap most CAPI rollouts hit — pixel + S2S without event_id inflates the dashboard above reality, and the scoring model punishes that exactly as hard as under-reporting",
      "No backend and no chart library: the charts are hand-drawn canvas, and the embed reflows with @container queries because it lives in a 720px column",
    ],
    repoUrl: "https://github.com/ecemiinngg/attribution-tycoon",
    featured: true,
  },
  {
    slug: "olympos-social-network",
    title: "Olympos — Graph Theory Game",
    summary:
      "A turn-based strategy game where you clear Odysseus's path home by manipulating a social network — real weighted Dijkstra and betweenness centrality under a UI a 7-year-old can play.",
    description:
      "The Odyssey modelled as Social Network Analysis: 21 mythological characters, 40 weighted relationships, and a Friction Score built from the weighted shortest path plus a betweenness-centrality penalty for every hostile broker. You persuade gods, put monsters to sleep and lobby new edges to drive that score to zero, while Poseidon answers each turn with storms that re-route the shortest path live. Designed and balanced against automated play-testers: a greedy AI provably loses on Hero difficulty, so the game rewards foresight — but on Easy, an in-game advisor simulates every legal move and tells the player exactly what to press, which is verified to win. Originally built as a Python/FastAPI/NetworkX service, then ported to TypeScript and verified value-for-value against that reference so it runs fully client-side with no backend.",
    stack: ["TypeScript", "Graph Theory", "SVG", "Next.js", "NetworkX", "FastAPI"],
    year: "2026",
    role: "Designer & Developer",
    highlights: [
      "Weighted Dijkstra + Brandes betweenness centrality hand-ported to TypeScript, matching NetworkX to 1e-9 across all 21 nodes",
      "Balanced with automated play-testers: greedy play loses, and a test asserts the advisor's line wins — so the game is provably both fair and completable",
      "Every SNA term translated for children: centrality becomes ⭐ ratings, the friction score becomes a ship sailing home, and the real math hides behind a \"for grown-ups\" panel",
      "No backend and no graph library — a 21-node SVG map with keyboard-navigable nodes and a frozen deterministic layout",
    ],
    featured: true,
  },
  {
    slug: "battle-city-tank-game",
    title: "Battle City — Retro Tank Game",
    summary:
      "A from-scratch Battle City (NES, 1985) clone built on pure HTML5 Canvas — no game engine — with a 6-agent modular architecture.",
    description:
      "Rebuilt the classic Battle City from the ground up on raw HTML5 Canvas: destructible brick/steel terrain, water and ice tiles, a 4-tier tank upgrade system, 6 power-up types, and 8 handcrafted levels with escalating enemy composition. The codebase is split into 6 focused modules (input, physics, rendering, enemy AI, audio, level loading) instead of one monolithic game loop.",
    stack: ["HTML5 Canvas", "TypeScript", "Next.js"],
    year: "2026",
    role: "Developer",
    highlights: [
      "Zero external game engine or physics library — custom collision, movement, and render loop",
      "Destructible terrain with per-sub-cell brick damage (2×2 cells per block)",
      "8 handcrafted levels with a progressive tank upgrade and power-up system",
    ],
    liveUrl: "https://ecemiinngg.github.io/tank_game/",
    repoUrl: "https://github.com/ecemiinngg/tank_game",
  },
  {
    slug: "fitai-virtual-try-on",
    title: "FitAI — AI Virtual Try-On",
    summary:
      "An AI-powered virtual fitting room that lets shoppers see clothing on themselves before buying, with a full DataLayer event schema for the try-on funnel.",
    description:
      "Built a virtual try-on flow where a shopper pastes a product URL or uploads a photo, adds a profile photo with height/weight, and gets a personalized AI-generated try-on rendered in 8–12 seconds. Instrumented the entire funnel as a proper analytics event schema — product input method, try-on clicks, generation success rate, and regenerate clicks — and designed the photo-handling flow to be KVKK/GDPR-compliant, purging uploaded images at session end.",
    stack: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS"],
    year: "2026",
    role: "Developer",
    highlights: [
      "Designed the full try-on funnel DataLayer schema (product_input_method, try_on_click, generation_success_rate, regenerate_click)",
      "KVKK/GDPR-compliant by design — uploaded photos are purged at session end",
      "Mobile-first flow for a URL-paste-or-upload → try-on experience",
    ],
    liveUrl: "https://virtualtryon-indol.vercel.app",
    repoUrl: "https://github.com/ecemiinngg/virtual_try_on",
  },
];
