export type BlogCategory =
  | "Analytics"
  | "Server-Side Tracking"
  | "Tag Management"
  | "Data Engineering"
  | "Paid Media";

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
    slug: "ga4-campaign-data-import-currency",
    title:
      'GA4 Now Requires a "Currency" Field When Importing Campaign Data: What the July 28 Update Actually Means',
    excerpt:
      "Campaign Data Import with cost data now requires an explicit currency. Small update, but it quietly fixes a real data-corruption problem — and it can stop an import cold if you edit a config and leave the field blank.",
    category: "Analytics",
    date: "2026-07-30",
    readTime: "6 min",
    content: `
Hi everyone,

Today a small but annoying update landed on my desk from GA4's "What's New"
page: the July 28, 2026 "Campaign data import currency update." My first
reaction was "okay, minor thing." Then I went through Reddit and the Analytics
Help forums and saw how many people have had campaign imports quietly break
because of currency mismatches, and I changed my mind. This is exactly the kind
of update that looks small but sneaks up on your reporting.

## What does the update actually say?

Google added a new rule to **Campaign Data Import** (the feature you use to
pull cost, click, and impression data from non-Google platforms like Meta,
TikTok, Reddit, and Pinterest):

**Any import that includes cost data now requires a "Currency" field.**

In other words, uploading \`cost = 1250\` on its own is no longer enough. You now
have to tell GA4 which currency that 1250 is in (USD, EUR, TRY...), either by
mapping it from a column or by hardcoding a single fixed value.

There are two ways to set it:

1. **Map from data source:** Match a column in your data source to the currency
   field (in ISO 4217 format, like USD, EUR, TRY).
2. **Hardcode currency:** Pick one fixed currency for the entire dataset from a
   dropdown.

Why is Google doing this? Because up until now, every import (existing and new)
simply assumed the uploaded cost matched the property's currency setting. If you
changed your property currency from TRY to USD, the cost data you'd already
imported stayed exactly as it was, with no conversion, and your reports were
quietly wrong from that point on.

## How to set it up (practical steps)

1. Go to **Admin > Data Import**, and open an existing Campaign Data import or
   create a new one.
2. In the field mapping screen you'll see a **"Currency"** row (it becomes
   required automatically once you've added a cost metric).
3. If your data source already has a column with the currency code, select
   **"Map from data source"** and connect that column.
4. If not, and everything comes in one currency, select **"Hardcode currency"**
   and lock in the ISO 4217 code (USD, EUR, TRY).
5. **Nothing breaks automatically on existing imports.** Google says existing
   imports will keep reporting "as if" they match the current property
   currency. But you won't be able to skip past this field the next time you
   set up a new import or edit an existing one.

Quick note: this only affects imports that include **cost** data. If you're only
uploading clicks/impressions with no cost, the currency field isn't required.

## What's changing, and is it good or bad?

**The good:**

- Reporting gets more reliable for teams running multi-currency campaigns
  (think agencies running EU + TR + US markets at once). GA4 now converts cost
  data coming from different currencies across Reddit Ads, Meta, and TikTok
  correctly on its own, so you stop having to manually convert everything in
  Sheets.
- When you change your property's currency, historical data no longer gets
  silently misread as if it were in the old currency. That's a real fix for a
  quiet data-corruption problem.

**The bad / worth watching:**

- On accounts with imports already set up, if someone goes in to edit the
  config and leaves the currency field blank, the import will simply stop. This
  is exactly the kind of thing that costs a team two days of "why is data
  missing" before someone finds the cause.
- For agencies managing multiple client properties: if each property runs a
  different currency, you'll need to check every single import configuration
  individually. Anyone running automated bulk setups (especially with Looker
  Studio templates) needs to do a manual pass here.

## The real-world problem from Reddit and forums: currency mismatches silently break reports

While researching this, I found a recurring complaint across GA4 community
threads and support forums: someone on the e-commerce/Shopify side asked why
"GA4 revenue [was] not being converted from international currency." The root
cause was a hardcoded currency value in the data layer (like \`shop.currency\`)
instead of the actual order currency (\`order.currency\`). So this isn't just a
campaign-import problem, it shows up in event-level currency reporting too.

The takeaway: filling in the currency field on campaign imports isn't enough on
its own. You also need to make sure your e-commerce events (\`purchase\`,
\`add_to_cart\`, etc.) always send the \`currency\` parameter based on the actual
order currency, never a fixed value. If you don't fix both sides (import and
event-level), your revenue reports will still come out wrong.

## What should we do? (action checklist)

- [ ] List out every existing Campaign Data Import source under **Admin > Data
      Import**.
- [ ] For every import that includes cost data, confirm the currency field is
      mapped correctly.
- [ ] If you've changed your property's currency setting in the last 12 months,
      flag the import data from before that change; retroactive correction
      doesn't happen automatically.
- [ ] Check whether your data layer's \`currency\` parameter is hardcoded or
      dynamic (a common issue in Shopify/WooCommerce setups).
- [ ] If you manage multiple properties or clients, add this check to a
      recurring checklist; don't treat it as a one-time fix, repeat it on every
      new client onboarding.

This isn't a "big and loud" update, and that's exactly why it's easy to miss.
For anyone running cost or ROAS reporting in GA4, a 10-minute check now is a lot
cheaper than months of looking at the wrong revenue or ROAS numbers. Have you
checked your imports this week?
`,
  },
  {
    slug: "google-ads-tcpa-troas-bidding-change",
    title:
      "Google Ads' Quiet Revolution: Why Your tCPA/tROAS Campaigns Might Suddenly \"Get Worse\" on August 17",
    excerpt:
      "Google Ads is rolling out a Target CPA / Target ROAS bidding change on August 17, 2026. What is it, how will it affect your campaigns, and what should you do before the deadline? Full breakdown with the Bid Target Adjustment Tool.",
    category: "Paid Media",
    date: "2026-07-29",
    readTime: "6 min",
    content: `
Today's topic is exactly my kind of thing: Google just announced a bidding
change that nobody's talking about loudly, but that matters a lot the moment
you open your account. The name sounds boring — "changes to target-based bid
strategies" — but the impact isn't boring at all. Some of your campaigns' CPA
could double or triple overnight, even if you don't touch a single setting.

Let's break it down.

## What does the update actually say, in plain English

Right now, if a Google Ads campaign is in **"Limited by budget"** status and
uses a target-based strategy like Target CPA or Target ROAS, the system often
delivers *better* performance than the target you set. So your tCPA is $10, but
the campaign is actually converting at $5. Sounds great, right? Here's the
catch: when you raise the budget, that "bonus" performance usually evaporates,
and you can never quite tell why.

Starting **August 17, 2026**, Google is changing its bidding systems so that
budget-limited campaigns using target-based strategies will perform more
consistently toward your set target, even when you make budget adjustments. In
other words, the system will stop quietly over-delivering — whatever number you
put in the box is the number you'll actually get.

Google's own example makes it crystal clear: if your Target CPA is $10 but your
recent actual CPA is $5, your campaign will start delivering closer to $10
starting August 17, 2026. If you want to keep your current performance, you
need to lower your target to $5 — or to whatever number actually reflects your
business goals.

## Who's affected, and who isn't?

This change doesn't cover every campaign type.

**Affected:** Search, Shopping, Performance Max, Demand Gen, and Travel
campaigns (including those managed through Search Ads 360). Demand Gen line
items managed through Display & Video 360 are also included, and Target CPC has
been added to the list of affected strategies there — proof this isn't just a
search-only story.

**Not affected:** App campaigns, Video reach campaigns, and Video view
campaigns (VVC) will keep their current behavior. Hotel and Display campaigns
already operate under the new logic, so there's no "August 17 shock" for them.

One more important detail: tCPA/tROAS campaigns that **aren't**
budget-constrained won't be affected at all. This is purely a "Limited by
budget" problem.

## So — is this good or bad?

A bit of both, honestly. It depends where you're standing.

**The upside:** Until now, when you raised your budget you could never fully
predict where performance would land — it wasn't random, but it wasn't reliable
either. Google is selling this as "predictability," and that part is genuinely
true: a system that sticks closer to your stated target makes scaling budget
far less of a guessing game.

**The downside — and the part that actually matters:** For accounts that have
spent over a year quietly thinking "I'm getting way better CPA than my target,
nice," this is going to feel like a loss. For years, a lot of budget-limited
campaigns have been quietly beating their targets — you'd set a $30 Target CPA,
the campaign would deliver at $18, and you'd shrug and take the win. That gap
is about to close. The number stays the same, but the real-world outcome (for
you) gets worse, simply because the target is finally acting like an actual
target.

So the real question isn't "good or bad" — it's "how recently did you actually
review your targets?" If your target already reflects your current real
performance, you lose nothing. If your target is a "leftover" number set months
ago and never revisited, that's exactly where things will hurt.

## A real example straight from LinkedIn

There's a great exchange that shows how confusing this gets in practice. PPC
specialist Chris Ridley asked Google's search ads lead Ginny Marvin directly on
LinkedIn: his client's real target range was $30–$50, they were averaging $35,
but the target field had been left at $50 to act as an upper ceiling. Ridley
asked whether leaving it at $50 would push CPA up toward $50.

Marvin's answer sums up the whole update: the campaign will now perform more
consistently toward the target you entered — in this case, $50 — so if you want
to keep the current $35 average, you need to actually change the target to $35.
Whatever's in the box is what you get in the real world; "loose ceiling"
numbers don't work as a safety net anymore.

This flips a habit a lot of account managers have relied on for years: "I'll
leave the target a bit loose, the system usually finds something better anyway."
After August 17, that habit produces the opposite result. Time to unlearn it.

## What you stand to lose, what you stand to gain

**What you could lose:**

- Unexpected CPA increases / ROAS drops on budget-limited campaigns if you
  haven't updated your targets
- Shifts in cross-channel traffic distribution on multi-channel campaigns like
  Performance Max and Demand Gen
- Sudden performance swings on campaigns you've always considered "reliably
  great," especially right after a budget change

**What you could gain:**

- Actually knowing what to expect when you increase budget
- More confidence to scale budget without fearing performance will "break"
- More reliable forecasting and reporting, with fewer surprises

## What to do — step by step

1. **Use the Bid Target Adjustment Tool.** It started rolling out in accounts
   on July 6, 2026, and shows up as a notification for accounts with any
   campaign that was budget-limited in the past 12 months while running an
   affected strategy. If you don't see it yet, don't panic — rollout is
   gradual.
2. **List every "Limited by budget" campaign running a target-based strategy.**
   Pay special attention to ones that have held that status for a long stretch
   over the last 12 months.
3. **Compare your target against your actual performance.** If your target is
   $10 but your real CPA is $5 — is that a number you genuinely want to
   protect, or just a loose ceiling you left "in case it helped"?
4. **Pick one of three paths:** keep the target as-is (fine, if it's a
   deliberate choice), lower it to preserve current performance, or set an
   entirely new target that matches your actual business goals.
5. **If you're planning to raise budget, do it gradually.** Wait 1–2 conversion
   cycles after any increase before judging performance — don't make one big
   jump.
6. **Consider switching strategy as an alternative.** Moving to Maximize
   Conversions / Maximize Conversion Value prioritizes spending the full
   budget, but since CPA/ROAS is no longer anchored to a fixed target, it can
   fluctuate more — a different trade-off worth weighing.

## Quick takeaway

This isn't a "everything just changed" panic moment, but it's also not
something to shrug off. If you're on the agency side, the next few weeks should
go into reviewing target fields across every client account, one by one. If you
don't want a "why did my CPA suddenly spike" email after August 17, start
today.

We'll pick up a small SQL or tagging trick tomorrow — for today, just get this
one on your calendar: **August 17, 2026**.
`,
  },
  {
    slug: "ga4-source-group-dimension",
    title: "GA4 Source Group Dimension — Finally, Clean Social Attribution",
    excerpt:
      "GA4's new Source Group dimension collapses facebook, fb, m.facebook.com and friends into one clean row — retroactively, with zero implementation work. Here's what it does and where it still falls short.",
    category: "Analytics",
    date: "2026-07-28",
    readTime: "5 min",
    content: `
You know that moment when a client asks "how did Facebook perform this month?"
and you open GA4 to find their Facebook traffic split across \`facebook\`,
\`fb\`, \`m.facebook.com\`, \`l.facebook.com\`, and \`Meta-facebook\`?

Yeah. Google finally fixed that.

## What is Source Group?

On June 11, 2026, Google rolled out a new dimension called **Source Group** in
GA4. It automatically consolidates all those messy referral string variations
into a single clean platform name.

So instead of five rows of fragmented Facebook data, you get one row:
**Facebook**. Same for Instagram, TikTok, and — here's the interesting part —
ChatGPT and Perplexity are included too.

## How is it different from Source Platform?

This is the key distinction people are missing:

- **Source Group** = the originating platform (Instagram, Facebook, TikTok).
  Combines paid **and** organic.
- **Source Platform** = the ad-buying ecosystem (Meta Ads, Google Ads). Only
  applies to paid traffic.

Together, they let you split paid vs. organic without building custom regex
channel groupings. That's huge.

## The good news

- **It's retroactive.** Unlike the AI Assistant channel grouping from May 2026,
  Source Group applies to your historical data. Year-over-year comparisons
  don't break.
- **Zero implementation work.** No tag changes, no property configuration. It
  just appears.
- **AI traffic is included.** ChatGPT and Perplexity referrals get consolidated
  too, which is increasingly important as AI-driven traffic grows.

## The not-so-good news

As of July 8, 2026, Google clarified that Source Group is currently restricted
to the **Advertising workspace** (specifically the Conversion performance
report). It's **not** available yet in standard Traffic Acquisition reports.

Also, organic traffic actively shows as \`(unlabeled)\` in the related Source
Platform dimension. If you're building reports that combine Source Group with
Source Platform, you'll hit some unexpected blanks.

## What should you do?

1. **Check if it's rolled out to your property.** The deployment is gradual. If
   you don't see Source Group as an available dimension, wait a few days.
2. **Review your custom channel groupings.** If you built regex-based groupings
   to consolidate social sources, Source Group might replace some of that
   manual work. Don't delete your custom setup yet — but start comparing
   outputs.
3. **Watch for the standard reports rollout.** Right now it's Advertising
   workspace only. Google hasn't given a timeline for broader availability.
4. **Combine it with the AI Assistant channel.** Source Group consolidates the
   referral strings; the AI Assistant default channel (rolled out May 13)
   categorizes chatbot traffic. Together they give you a much cleaner picture
   of AI-driven visits.

## Quick SQL tip (BigQuery export)

If you're working with the GA4 BigQuery export and want to simulate Source
Group logic before it fully rolls out in all reports:

\`\`\`sql
SELECT
  CASE
    WHEN LOWER(traffic_source.source) IN ('facebook', 'fb', 'm.facebook.com', 'l.facebook.com') THEN 'Facebook'
    WHEN LOWER(traffic_source.source) IN ('instagram', 'ig', 'l.instagram.com') THEN 'Instagram'
    WHEN LOWER(traffic_source.source) IN ('tiktok', 'tiktok.com', 'www.tiktok.com') THEN 'TikTok'
    WHEN LOWER(traffic_source.source) IN ('chatgpt.com', 'chat.openai.com') THEN 'ChatGPT'
    ELSE traffic_source.source
  END AS source_group,
  COUNT(DISTINCT user_pseudo_id) AS users,
  SUM(ecommerce.purchase_revenue) AS revenue
FROM \`project.dataset.events_*\`
WHERE _TABLE_SUFFIX BETWEEN '20260601' AND '20260731'
GROUP BY 1
ORDER BY 3 DESC
\`\`\`

This gives you a quick workaround while you wait for full rollout in
Explorations.
`,
  },
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
  "Paid Media",
];
