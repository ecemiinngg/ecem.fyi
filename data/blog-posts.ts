import { optimizedGtmPost } from "./optimized-gtm-post";

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
  language?: string;
  image?: string;
  tableOfContents?: boolean;
}

export const blogPosts: BlogPost[] = [
  optimizedGtmPost,
  {
    slug: "google-tag-manager-october-2026-update",
    title: "Google Tag Manager October 2026 Update: What Changed and How to Check Your GTM Container",
    excerpt: "Google Tag Manager's October 2026 update introduces optimized containers, direct data delivery without an extra gtag.js load, and centralized settings. Learn what changed and how to test GA4 and Google Ads tracking.",
    category: "Tag Management",
    date: "2026-10-14",
    readTime: "9 min",
    content: `
**Google Tag Manager (GTM) is introducing a major update to how Google tags are managed, configured, and connected to measurement platforms such as Google Analytics 4 (GA4) and Google Ads.**

On October 12, 2026, Google announced a new container optimization capability that allows GTM to send measurement data directly to supported Google destinations without loading the additional \`gtag.js\` library.

The update aims to improve website performance, simplify tag configuration, and centralize measurement settings within Google Tag Manager.

But what exactly has changed? How will this affect existing tracking implementations? And how can you check whether your GTM container is ready for the update?

![Celebration GIF for the October 2026 Google Tag Manager container optimization update](https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif)

*GTM got an update. Your tracking checklist just got a little more interesting. 🎉*

## GTM October 2026 update at a glance

| Before the update | With optimized GTM containers | What to verify |
| --- | --- | --- |
| Some Google destinations required an extra \`gtag.js\` load | Direct transmission to supported Google destinations | Measurement requests and event delivery |
| Google tag settings could be fragmented | Centralized container settings | Shared configurations and destinations |
| Separate permissions could complicate management | More unified destination access management | Destination permissions after migration |
| Troubleshooting could involve multiple configuration surfaces | Consolidated Google Destinations view | GA4 and Google Ads conversions |

**Quick takeaway:** You do not need to rebuild all of your tags, but you should test your most important events before publishing an optimized container.


## What Changed in Google Tag Manager?

Previously, Google Tag Manager could load an additional JavaScript library, \`gtag.js\`, to send measurement data to Google products.

Google tags could also maintain separate settings and permissions, making configuration management and troubleshooting more complicated, especially when multiple Google destinations were involved.

With the new optimized container experience, Google is bringing these configurations together.

### 1. Direct Data Transmission Without Loading gtag.js

One of the most important changes is how measurement data is transmitted.

Previously, GTM could load \`gtag.js\` as part of the process of sending data to Google destinations.

With optimized containers, GTM can send data directly to supported Google measurement products without loading the additional library.

**What does this mean?**

- Less JavaScript needs to be loaded on the website.
- The measurement process can become more efficient.
- Additional JavaScript loading delays can be reduced.
- Data collection performance may improve.

However, this does not guarantee a measurable page-speed improvement for every website. The actual impact depends on the existing implementation and the scripts already running on the page.

### 2. Centralized Google Tag Settings

Another major change is the introduction of centralized settings management.

Previously, separate Google tags could have their own configurations. When multiple measurement products were connected, maintaining consistent settings could become difficult.

With the optimized setup, Google tag settings can be consolidated at the GTM container level.

A new **Settings** section provides access to Google-related configurations, including connected destinations and data flow information.

For example, if a website sends measurement data to both GA4 and Google Ads, the updated structure can make it easier to manage shared settings and identify connected destinations.

This can reduce configuration complexity and make tracking implementations easier to maintain.

### 3. Improved Visibility and Access Management

The update also introduces a more unified relationship between Google Tag Manager and connected Google measurement products.

Container administrators can manage destination-related access and permissions more centrally.

This is particularly useful for organizations where analytics, marketing, and development teams collaborate on the same tracking implementation.

One important detail is that **destination permissions are not versioned with GTM container changes**. Administrators should therefore review access settings carefully during migration.

### 4. A More Unified Google Tag and GTM Experience

Google is also working toward bringing Google Tag and Google Tag Manager closer together.

According to Google's documentation, the broader direction includes extending GTM capabilities such as interface-based tag configuration, debugging, and version control to websites using Google Tag.

This represents a shift toward a more unified tagging ecosystem rather than separate configuration experiences across Google products.

## How Will This Update Affect Existing Tracking Implementations?

For websites already using GTM to manage GA4, Google Ads, and other marketing platforms, the main changes involve how Google-related settings are organized and how data is transmitted.

Importantly, Google states that existing event tags and triggers are maintained during the optimization process.

This means you should not need to recreate all your existing GA4 events or Google Ads conversion tags simply because you optimize your container.

However, maintaining the configuration does not eliminate the need for validation.

After migration, analytics teams should confirm that important measurement events still work as expected.

Examples include:

- \`page_view\`
- \`view_item\`
- \`add_to_cart\`
- \`begin_checkout\`
- \`purchase\`
- Google Ads conversion events

For e-commerce websites, it is particularly important to verify purchase transaction IDs, values, currencies, and other parameters used in reporting and attribution.

The update also does not automatically convert an existing client-side GTM implementation into a server-side GTM setup. Server-side tagging remains a separate implementation approach.

## How to Check the New Update in Google Tag Manager

Google provides an optimization workflow directly within the GTM interface.

You can check whether your container is eligible and review the proposed changes before publishing anything.

### Step 1: Open Your GTM Container

Visit [Google Tag Manager](https://tagmanager.google.com/) and select the container you want to inspect.

Navigate to the **Overview** page.

If the optimization workflow is available for your container, you may see a banner labeled:

**Optimize your Tag Manager container**

The available action depends on your current configuration:

- **Review details:** Typically appears when existing Google tag settings are already consistent.
- **Get started:** May appear when multiple Google tags have conflicting configurations that need to be resolved.

The absence of a banner alone does not establish whether a container has already been optimized.

### Step 2: Check the Settings Section

Navigate to the new **Settings** section in GTM.

Look for **Google Destinations**, where you can review connected measurement destinations.

Check the **Optimized** column.

If a destination displays **No**, you can hover over the value and select **Get Started** when that action is available.

This is another way to access the container optimization workflow.

The section also makes it easier to understand which Google measurement destinations are connected to your container.

### Step 3: Review the Proposed Changes

Before applying the optimization, select **Preview changes**.

This step is especially important for containers with multiple Google tags.

Review the configuration changes carefully and verify which settings will be consolidated.

If your tags have different configurations, Google will guide you through selecting and confirming the settings to use.

Pay particular attention to measurement settings that may affect existing analytics or advertising implementations.

### Step 4: Add the Changes to Your Workspace

Once you have reviewed the configuration, click **Add to workspace**.

This adds the proposed changes to your GTM workspace.

**The changes are not immediately published to your live website.**

You can review and test the updated configuration before making it active.

### Step 5: Test the Implementation Using GTM Preview Mode

After adding the changes to your workspace, click **Preview** in GTM.

This launches Google Tag Assistant.

Enter your website URL and connect to the website.

Then test important user interactions, such as:

1. Opening a product page.
2. Adding a product to the cart.
3. Starting the checkout process.
4. Completing a test purchase.

In Tag Assistant, verify that expected tags fire at the correct stages and that the relevant event parameters are available.

You should also check GA4 DebugView, where applicable, to confirm that events are being received as expected.

For Google Ads, validate conversion firing and relevant conversion parameters.

Pay attention to duplicate events, missing parameters, and unexpected changes in tag behavior.

### Step 6: Publish Your Container

After verifying the updated implementation, return to Google Tag Manager.

Click **Submit** to publish the container changes.

Use a descriptive version name, such as:

\`GTM Container Optimization - October 2026\`

Including a description of the changes makes it easier to identify the update in GTM version history.

If a problem is identified later, a previously published container version can be restored and republished.

Keep in mind that destination access permissions require separate review because they are not included in container version history.

## How to Verify That the Update Is Working Correctly

After publishing the optimized container, it is useful to perform a final measurement audit.

| Area                | What to check                                                  |
| ------------------- | -------------------------------------------------------------- |
| GTM Settings        | Confirm Google destinations and optimization status            |
| Tag Assistant       | Verify tag firing and event execution                          |
| GA4 DebugView       | Confirm incoming events and event parameters                   |
| Google Ads          | Validate conversion tracking                                   |
| E-commerce tracking | Check purchase values, currencies, and transaction IDs         |
| Consent Mode        | Verify consent states and consent-dependent behavior           |
| Browser Network     | Inspect measurement requests and unexpected duplicate requests |
| GTM Versions        | Confirm the correct container version is published             |

For a more technical validation, open your browser's Developer Tools and inspect the **Network** tab.

Compare measurement behavior before and after optimization, ideally in a controlled test environment.

You can look for changes in script loading and measurement requests.

However, the presence or absence of a particular network request should not be used as the only indication of a successful migration. Actual event delivery and reporting must also be validated.

## What Does This Mean for Digital Analytics Teams?

From a digital analytics perspective, the biggest advantage of this update is not simply reducing JavaScript loading.

It is the move toward a more centralized and manageable measurement architecture.

For analytics and marketing teams, this can mean:

- Less complexity when managing multiple Google measurement destinations.
- Easier troubleshooting through more consistent configurations.
- Improved visibility into connections between GTM and Google products.
- More streamlined collaboration between analytics and advertising teams.
- Potential improvements in measurement transmission performance.

At the same time, teams should review existing Google tag settings before migration, especially when different products or properties require different configuration behavior.

## Frequently Asked Questions (FAQ)

### Does the October 2026 GTM update replace server-side tagging?

No. Optimized GTM containers can send data directly to supported Google destinations without an extra \`gtag.js\` load, but this does not turn a client-side GTM setup into a server-side container.

### Will my existing GA4 events and triggers be deleted?

Google says existing event tags and triggers are maintained during optimization. Even so, verify critical events in Tag Assistant and GA4 DebugView before publishing.

### Does the update guarantee better Core Web Vitals?

No. Reducing an extra JavaScript load may help some implementations, but any performance improvement depends on the website and its broader script configuration.

### Where can I find the optimization option?

Open your GTM container's **Overview** screen and look for **Optimize your Tag Manager container**. You can also check the **Google Destinations** area under **Settings**.

### Do I have to publish immediately after optimizing?

No. Choose **Add to workspace**, test in Preview mode, and publish only when your measurement checks pass.

## Conclusion

The October 2026 Google Tag Manager update represents an important step toward unifying Google Tag and GTM.

By introducing direct measurement transmission, centralized container settings, and improved destination management, Google is simplifying how businesses manage their tracking infrastructure.

For websites already using GTM, the next step is to check whether container optimization is available, review existing configurations, and validate critical measurement events before publishing the changes.

**A more optimized tagging infrastructure is valuable, but reliable measurement still depends on correct implementation, testing, and ongoing monitoring.**

## Official references

- [Google Tag Manager release notes — October 12, 2026](https://support.google.com/tagmanager/answer/4620708?hl=en)
- [Updates to Google tag and Google Tag Manager](https://support.google.com/tagmanager/answer/17079602?hl=en)

`,
  },
  {
    slug: "microsoft-advertising-utm-auto-tagging",
    title: "Microsoft Advertising UTM Auto Tagging Güncellemesi",
    excerpt:
      "Microsoft Advertising, tüm kampanyalar için tek bir UTM şablonu kullanmayı bıraktı. Her kampanya türü artık kendi yapısıyla geliyor — ve bu GA4'teki Default Channel Grouping'i doğrudan etkiliyor.",
    category: "Paid Media",
    date: "2026-09-10",
    readTime: "2 min",
    content: `
Microsoft son günlerde hepimizi harekete geçiren bir güncelleme paylaştı.
Kampanya izleme konusunda kritik bir değişikliğe gittiler.

Microsoft Advertising, tüm kampanyalar için standart tek bir şablon
uyguluyordu. **2 Eylül** itibariyle duyurulan bu güncelleme ile beraber her
kampanya artık kendi özel UTM yapısına sahip olacak. Böylece daha doğru bir
sınıflandırmanın önü açılmış oldu.

## Bu güncellemeyle hayatımızda ne değişiyor?

Bu güncelleme, özellikle Google Analytics 4 (GA4) panellerindeki **Default
Channel Grouping** (Varsayılan Kanal Gruplaması) mekanizmasını doğrudan
etkiliyor. Uzun süredir Microsoft Ads trafiği genel olarak Paid Search grubunda
toplanıyordu. Yeni yapıyla birlikte her kampanya türü GA4'te hak ettiği doğru
kanala yerleşmeye başlıyor.

| Kampanya Türü | UTM Source | UTM Medium | Ekstra / Suffix | GA4 Kanal Grubu |
| --- | --- | --- | --- | --- |
| **Search (Arama)** | \`bing\` | \`cpc\` | — | Paid Search |
| **Audience Ads** | \`msads\` | \`cpm\` | — | Display |
| **Shopping Ads** | \`msads\` | \`cpc\` | campaign suffix: \`shopping\` | Paid Shopping |
| **Video** | \`bing_video\` | \`cpc\` | — | Paid Video |
| **Performance Max** | \`msads\` | \`cross-network\` | — | Cross-network |

Bu değişim performans raporlarında ani dalgalanmalar görünmesine neden olabilir.
Örneğin önceden Paid Search altında görünen alışveriş veya display
kampanyalarınız artık doğru kanallara ayrılacağı için search kampanya
performansınız düşüş gösterebilir.

## Peki bu durumda ne yapmalıyız?

Bu geçiş sürecinde veri bütünlüğünü korumak için;

1. Microsoft Advertising panelinizde **Auto-Tagging** ayarlarının aktif
   olduğundan ve yeni şablonların doğru yansıdığından emin olun.
2. Raporlarınızdaki ani düşüş veya artışları yanlış yorumlamamak adına, trafik
   kaynaklarının yukarıdaki tabloya göre doğru kategorize edilip edilmediğini
   GA4 **"Traffic Acquisition"** raporundan kontrol edin.

Böylece değişime ayak uydurarak doğru sınıflandırma ile veri bütünlüğünü
koruyabiliriz.
`,
  },
  {
    slug: "silent-sdk-death-appsflyer-bigquery",
    title: "Catching a Silent AppsFlyer / Adjust SDK Death in BigQuery",
    excerpt:
      "When a mobile attribution SDK hits End-of-Support your app doesn't crash — it keeps running while data quality quietly erodes. Two BigQuery queries to catch it in your own data before the monthly report does.",
    category: "Data Engineering",
    date: "2026-07-31",
    readTime: "5 min",
    content: `
On July 23, 2026, AppsFlyer updated its iOS and Android SDK release notes and
repeated a reminder it gives on a fixed cycle: legacy SDK versions lose support
on a strict six-month schedule. The dangerous part is that when an SDK reaches
End-of-Support, your app does not crash. It keeps running. Your data quality
just quietly degrades. Install and event counts drop, and nobody notices until
the monthly report looks off.

Instead of walking through another platform update this week, here is a small
SQL trick to help you catch this in your own data before it becomes a real
problem.

## Why is the problem so silent

A **deprecated** SDK version still runs and still sends data. It just stops
receiving fixes for known bugs, such as attribution drift, event loss, or
crashes.

A version that hits **End-of-Support** is very likely to become incompatible
with new OS versions, for example iOS 26, which now requires AdAttributionKit
integration.

Mobile teams usually rely on app store force-update logic to push app updates,
but they rarely monitor SDK version distribution on its own. The result is that
a meaningful share of your user base can keep sending data from an old,
unsupported SDK without you realizing it.

## The trick in BigQuery / GA4 export

If you have your AppsFlyer raw data export, or the GA4 \`app_info\` table,
connected to BigQuery, a simple query like this will show you the SDK version
distribution and how it moves over time.

\`\`\`sql
SELECT
  event_date,
  app_version,
  sdk_version,
  COUNT(DISTINCT appsflyer_id) AS unique_devices,
  COUNTIF(event_name = 'af_purchase') AS purchase_events
FROM
  \`project.dataset.appsflyer_raw_data\`
WHERE
  event_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) AND CURRENT_DATE()
GROUP BY
  event_date, app_version, sdk_version
ORDER BY
  event_date DESC, unique_devices DESC
\`\`\`

Pivot the result weekly and ask one question: how is \`unique_devices\` trending
over the last four weeks for \`sdk_version\`s marked as deprecated? A decline is a
good sign, it means users are updating. If the number is flat or growing, a
meaningful part of your user base is still sitting on a risky version.

The second step is comparing event loss by version.

\`\`\`sql
SELECT
  sdk_version,
  COUNT(DISTINCT appsflyer_id) AS devices,
  COUNTIF(event_name = 'af_purchase') AS purchases,
  SAFE_DIVIDE(COUNTIF(event_name = 'af_purchase'), COUNT(DISTINCT appsflyer_id)) AS purchase_rate
FROM
  \`project.dataset.appsflyer_raw_data\`
WHERE
  event_date = CURRENT_DATE() - 1
GROUP BY
  sdk_version
ORDER BY
  purchase_rate ASC
\`\`\`

If \`purchase_rate\` is unusually low on older SDK versions, for a user segment
with otherwise comparable traffic quality, that points to attribution or event
loss caused by the SDK itself, not by campaign quality.

## What you can do?

Turn this query into a **weekly scheduled query** and feed \`sdk_version\` level
\`unique_devices\` and \`purchase_rate\` into a Looker Studio dashboard.

Set a threshold, for example once deprecated versions exceed 10 percent of
devices, trigger a force-update campaign with the mobile team.

On **iOS**, prioritize migrating to SDK versions with AdAttributionKit support
as your iOS 26 user share grows, otherwise you lose access to the re-engagement
windows and geo-level postback data AAK offers.

On **Android**, remember that dependent integrations like the Purchase
Connector or AdRevenue Connector need to be migrated alongside SDK v6.15.0 and
above. If you update the SDK without migrating the connector, revenue data can
silently stop flowing.
`,
  },
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
