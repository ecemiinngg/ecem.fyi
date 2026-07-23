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
