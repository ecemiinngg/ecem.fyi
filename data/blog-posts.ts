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
    slug: "google-ip-address-ad-measurement-europe",
    title:
      "Google Starts Using IP Addresses for Ad Measurement in Europe: How the August 3 Change Affects Your GA4 and GTM Setup",
    excerpt:
      "Google is expanding what it uses EEA, UK, and Swiss IP addresses for — from routing traffic to identifying devices and personalizing ads. A purpose change that lands squarely on your consent setup.",
    category: "Tag Management",
    date: "2026-07-27",
    readTime: "5 min",
    content: `
Today's topic sits right in your lane: measurement + consent + Google Ads +
GA4, and there's a hard date on the calendar — **August 3, 2026**. This isn't a
"rolling out sometime" update, it's a "goes live next week" one.

On June 17, 2026, Google sent an email to advertisers and AdSense publishers.
The subject line looked routine, the content wasn't: Google announced that it
will start using **IP addresses** from users in the EEA (European Economic
Area), the UK, and Switzerland for ad measurement and personalization.

Let's clear up one thing first: Google **already** receives your IP address.
It's attached to every HTTP request, every SDK call, every tag fire. What's
changing is the **purpose**. Up until now, that address has been used for
traffic routing and ad delivery. After August 3, the same address will also be
used to identify devices, measure performance, and personalize ads. And since
an IP address is classified as personal data under GDPR, that small shift in
purpose is actually a big consent issue.

## So what exactly is changing?

Three things, in short:

1. **The purpose is expanding:** IP addresses will no longer be used only to
   "route traffic" — they'll now also be used to "recognize this device and
   personalize the ad accordingly."
2. **A new TCF registration is coming:** Google will register under IAB
   Europe's Transparency and Consent Framework for **Feature 3** ("identify
   devices based on information transmitted automatically"). This isn't a
   consent step by itself, but it's tied to personalization purposes — and
   those purposes require **explicit consent**, not legitimate interest.
3. **PETs are the backing story:** Google is framing this around
   privacy-enhancing technologies — on-device processing, trusted execution
   environments, secure multi-party computation. But some personalization
   features won't ship immediately; expect a rollout stretching into late 2026
   or early 2027.

## Good news or bad news? A bit of both

On the measurement side, it's genuinely useful. In a cookieless world,
measurement accuracy has been eroding — Safari's ITP, Firefox's ETP, rising
consent-denial rates. An IP-based signal can plug part of that gap. For Google
Ads and GA4, it means an extra signal layer for conversion modeling — in
theory, less modeled (estimated) data and more observed data.

The catch: Google reversed its own anti-fingerprinting stance back in December
2024, and the UK's ICO already called that reversal "irresponsible." Now the
ICO is advising the UK government in the opposite direction — that consent
should remain mandatory for cross-service profiling. So Google is moving one
way while the regulator is pointing the other — which means added regulatory
risk down the line.

In short: good for measurement in the short term, but carrying real regulatory
risk in the medium-to-long term.

## The real problem I keep seeing in practice: consent infrastructure isn't ready

Whenever news like this drops, the first practical question is: "Okay, but does
my CMP even support this correctly?" And the honest answer is: most setups
don't process the TCF Feature 3 signal properly yet.

A lot of publishers and advertisers already missed the **TCF v2.3 migration
deadline** back in February 2026 and are still sending the old string format.
Now there's a Feature 3 registration stacked on top of that. The result: if
your CMP isn't up to date, Google can't use the data for personalization **even
if the user consents** — because the signal simply isn't arriving correctly.
Technical debt turns directly into lost revenue here.

## What can you actually do about it?

- **Audit your CMP:** Check whether your TCF string supports Feature 3. Most
  major CMP providers (OneTrust, Usercentrics, Cookiebot, etc.) have already
  shipped or are about to ship an update — check their release notes.
- **Re-test consent mode in GTM:** Confirm that \`ad_personalization\`,
  \`ad_user_data\`, and \`ad_storage\` signals correctly transition from
  "denied" to "granted" in GTM Preview. You're probably already doing this, but
  it's worth adding a Feature 3-specific regression test now.
- **If you're on server-side tagging:** Revisit where and how you're
  masking/processing the IP address inside your server container. The purpose
  change means you need to re-ask "what am I actually using this data for" in
  your server-side pipeline too.
- **Sync with legal/privacy:** This is a technical trigger, but the outcome is
  a compliance risk. "We just implemented the tag" won't hold up as a defense
  anymore — the purpose change needs to be documented on the business side.
- **For publishers on AdSense/Ad Manager/AdMob:** August 3 is a hard
  operational deadline. If your consent flow isn't updated, your users fall
  outside the expanded targeting — and so does any upside in revenue that comes
  with it.

## What this means if you work in measurement/tagging

If you already have a solid GA4 + GTM + Consent Mode setup, this news isn't
"extra work" for you — it's your existing consent architecture getting a fresh
stress test. A CMP that supports Feature 3, paired with correctly configured
consent mode, means you benefit from this change without lifting a finger. If
you're missing either piece, you'll watch the gap in modeled data widen come
August.

My suggestion: put a "consent audit" on this week's list. Walk through your TCF
string, your GTM consent signals, and your server-side IP handling logic on a
single checklist. You've got a week until August 3 — that's just enough time,
but only if you start now.
`,
  },
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
