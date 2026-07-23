export interface Project {
  slug: string;
  title: string;
  summary: string;
  description: string;
  stack: string[];
  year: string;
  role: string;
  highlights: string[];
  href?: string;
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
];
