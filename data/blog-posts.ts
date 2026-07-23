export type BlogCategory =
  | "Analytics"
  | "Server-Side Tracking"
  | "Tag Management"
  | "Data Engineering";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  date: string;
  readTime: string;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "server-side-gtm-first-party-data",
    title: "Server-Side GTM: Reclaiming First-Party Data in a Cookieless World",
    excerpt:
      "Why moving your tag container into a server-side environment changes the trust and accuracy equation for every downstream report.",
    category: "Server-Side Tracking",
    date: "2026-06-02",
    readTime: "7 min",
    content: `
A client-side container ships a payload straight from the browser, past every
ad blocker, ITP rule, and tracking-prevention heuristic in between. A
**server-side GTM container** moves that decision point onto infrastructure
you control.

## What actually changes

- Requests originate from your first-party domain, not a third-party subdomain
- You control cookie lifetime instead of inheriting the browser's default
- You get one place to enrich, redact, or drop fields before they reach a vendor

## A minimal event contract

\`\`\`js
window.dataLayer.push({
  event: "purchase",
  ecommerce: {
    transaction_id: "T_128841",
    value: 129.0,
    currency: "USD",
    items: [{ item_id: "SKU_1", item_name: "Wireless Mouse", price: 129.0 }],
  },
});
\`\`\`

The client's only job is to describe **what happened**. The server container
decides where that event goes, what PII gets hashed, and how it's replayed to
GA4, Meta CAPI, or a warehouse sink.

## The trade-off nobody puts on the slide

Server-side tagging is not "more accurate for free." You take on hosting cost,
latency budget, and the operational burden of monitoring a service that, if it
goes down, silently drops every conversion behind it. Budget for observability
before you migrate, not after.
`,
  },
  {
    slug: "ga4-ecommerce-datalayer-schema",
    title: "Designing a GA4 Ecommerce DataLayer Schema That Survives Contact with Reality",
    excerpt:
      "A field-by-field breakdown of the GA4 ecommerce object, and the schema decisions that keep a data layer maintainable past launch day.",
    category: "Analytics",
    date: "2026-05-14",
    readTime: "9 min",
    content: `
Most \`dataLayer\` schemas look clean in the spec doc and fall apart the moment
a second developer touches the checkout flow. The fix isn't more documentation
— it's fewer places where the shape can drift.

## The four events that carry 90% of ecommerce reporting

1. \`view_item_list\` — a list of items rendered on screen
2. \`add_to_cart\` — one explicit user action, one item (or a clean array)
3. \`begin_checkout\` — the cart snapshot at the moment checkout starts
4. \`purchase\` — the same snapshot, plus a transaction id and totals

## Keep \`items[]\` shape identical across all four

If \`add_to_cart\` uses \`item_id\` and \`begin_checkout\` uses \`sku\`, every
downstream funnel report has to reconcile two keys for the same concept. Pick
one item schema and reuse it everywhere:

\`\`\`ts
interface DataLayerItem {
  item_id: string;
  item_name: string;
  item_category: string;
  price: number;
  quantity?: number;
}
\`\`\`

## Validate before you ship, not after

A lightweight runtime assertion in non-production builds catches more schema
drift than a code review ever will — it fails loudly the moment a field goes
missing, instead of three weeks later in a QBR.
`,
  },
  {
    slug: "tag-management-governance-at-scale",
    title: "Tag Management Governance: Stopping Container Sprawl Before It Starts",
    excerpt:
      "GTM workspaces multiply fast. Here's the review process that keeps a container auditable once more than two people can publish to it.",
    category: "Tag Management",
    date: "2026-04-22",
    readTime: "6 min",
    content: `
A GTM container with one owner is easy to reason about. A container with five
contributors and eighteen months of history is an archaeology project.

## Three rules that scale

- **Naming convention is not optional.** \`GA4 - Purchase - All Pages\` beats
  \`Tag 47\` every time someone has to debug a regression at 6pm.
- **Every trigger has a documented owner.** Not a Slack thread — a field in
  the container's change log or a linked ticket.
- **Version notes describe intent, not diff.** "Added purchase value
  rounding for the EU rollout" is useful six months later. "Fixed tag" is not.

## The review gate that actually gets used

A pre-publish checklist embedded in the PR/change-request template outperforms
a wiki page nobody reads. Put the four or five questions reviewers must answer
directly where the publish decision happens.
`,
  },
  {
    slug: "bigquery-ga4-export-cost-control",
    title: "Controlling BigQuery Costs on the GA4 Raw Export",
    excerpt:
      "The GA4-to-BigQuery export is a firehose. A few partitioning and materialization habits keep the monthly bill from surprising anyone.",
    category: "Data Engineering",
    date: "2026-03-30",
    readTime: "8 min",
    content: `
The raw GA4 export lands one table per day, nested and repeated to the point
that a naive \`SELECT *\` over a month of data can scan more bytes than the
rest of your warehouse combined.

## Start with partition and cluster pruning

\`\`\`sql
SELECT event_name, COUNT(*) AS events
FROM \`project.analytics_123456.events_*\`
WHERE _TABLE_SUFFIX BETWEEN '20260301' AND '20260331'
GROUP BY event_name
ORDER BY events DESC
\`\`\`

Filtering on \`_TABLE_SUFFIX\` instead of a derived date column is the single
biggest cost lever available on this dataset — it decides which daily tables
even get scanned.

## Materialize the flattened views you actually query

Most dashboards need three or four denormalized event tables (sessions,
ecommerce items, conversions), not the raw nested export. A scheduled query
that flattens \`event_params\` and \`items\` once a day turns a multi-terabyte
scan into a multi-gigabyte one for every query after it.
`,
  },
  {
    slug: "consent-mode-v2-signal-loss",
    title: "Consent Mode v2: What You Actually Lose When a User Declines",
    excerpt:
      "Consent Mode doesn't just toggle tags on and off — it changes what a hit looks like on the wire. Here's what modeling can and can't fill in.",
    category: "Server-Side Tracking",
    date: "2026-02-18",
    readTime: "6 min",
    content: `
When \`analytics_storage\` is denied, Google Tags don't simply stay silent —
they send a **cookieless ping** carrying only what's legally safe to carry,
and GA4's behavioral modeling tries to fill the gap statistically.

## What survives a decline

- Aggregate event counts, heavily bucketed
- Modeled conversions, at the property level, once volume thresholds are met
- Nothing at the user or session level — there is no identity to attach to

## The threshold trap

Modeling requires a minimum volume of both consented and unconsented traffic
per market. Below that threshold, GA4 simply shows less data — it doesn't
model a substitute. Low-traffic markets and small properties should expect
visible gaps, not smoothed estimates.
`,
  },
];

export const blogCategories: BlogCategory[] = [
  "Analytics",
  "Server-Side Tracking",
  "Tag Management",
  "Data Engineering",
];
