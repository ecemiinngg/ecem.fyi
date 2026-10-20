import styles from "./gtm-visuals.module.css";

function Flow({ title, steps, destinations, note }: { title: string; steps: string[]; destinations: string[]; note: string }) {
  return (
    <div className={styles.flow}>
      <div className={styles.label}>{title}</div>
      <ol className={styles.steps}>
        {steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <div className={styles.branch} aria-hidden="true">↓</div>
      <ul className={styles.destinations}>{destinations.map((name) => <li key={name}>{name}</li>)}</ul>
      <div className={styles.note}>{note}</div>
    </div>
  );
}

export function GtmArchitecture({ variant = "comparison" }: { variant?: "comparison" | "server" | "hybrid" }) {
  const captions = {
    comparison: "Simplified browser-side paths. Optimization can remove an additional gtag.js download for supported Google destinations; measurement still starts in the browser.",
    server: "Server-side tagging adds a processing layer. Each outgoing destination needs its own supported tag and configuration.",
    hybrid: "The optimized web container and server container can work together. Verify the endpoint, incoming client, transformations, and outgoing tags after migration.",
  };
  return (
    <figure className={styles.panel}>
      <div className={styles.figureLabel}>Measurement architecture / {variant}</div>
      <div className={variant === "comparison" ? styles.comparison : undefined}>
        {variant === "comparison" ? <>
          <Flow title="01 / Traditional path" steps={["Website · dataLayer event", "Web GTM · gtm.js", "Additional Google tag · gtag.js", "Measurement request"]} destinations={["GA4", "Google Ads"]} note="An extra library may be loaded." />
          <Flow title="02 / Optimized path" steps={["Website · dataLayer event", "Optimized web GTM · gtm.js", "Destination tag · measurement request"]} destinations={["GA4", "Google Ads"]} note="Fewer browser-side dependencies." />
        </> : <Flow title={variant === "hybrid" ? "03 / Optimized + server-side" : "02 / Server-side GTM"} steps={["Website · purchase event", variant === "hybrid" ? "Optimized web GTM" : "Web GTM / Google tag", "First-party endpoint · metrics.example.com", "Server GTM · client → transformations → tags"]} destinations={["GA4", "Google Ads", "Other platforms"]} note="Inspect, transform, filter, and route event data." />}
      </div>
      <figcaption className={styles.caption}>{captions[variant]}</figcaption>
    </figure>
  );
}

const metrics = [
  { label: "Google-related JavaScript transfer", unit: "KB", before: 75, after: 48 },
  { label: "Purchase request start delay", unit: "ms", before: 180, after: 95 },
];

export function GtmBenchmark() {
  return (
    <figure className={styles.panel}>
      <div className={styles.figureLabel}>Performance lab / illustrative data</div>
      <div className={styles.legend}><span><i className={styles.before} /> Traditional GTM</span><span><i className={styles.after} /> Optimized GTM</span></div>
      {metrics.map((metric) => (
        <div className={styles.metric} key={metric.label}>
          <div className={styles.metricTitle}>{metric.label}</div>
          <div className={styles.axis} aria-hidden="true"><span>0 {metric.unit}</span><span>{metric.before} {metric.unit}</span></div>
          {[{ label: "Traditional", value: metric.before, className: styles.before }, { label: "Optimized", value: metric.after, className: styles.after }].map((bar) => <div className={styles.barRow} key={bar.label}>
            <span className={styles.barLabel}>{bar.label}</span>
            <div className={styles.track}><div className={bar.className} style={{ width: `${bar.value / metric.before * 100}%` }} /></div>
            <span className={styles.value}>{bar.value} {metric.unit}</span>
          </div>)}
        </div>
      ))}
      <div className={styles.integrity}>Purchase delivery in this example: <strong>100/100 → 100/100</strong></div>
      <figcaption className={styles.caption}>Hypothetical numbers supplied to explain the test method. These are not Google benchmarks or measured results from this website. Each metric uses its own zero-based scale; actual gains depend on your implementation.</figcaption>
    </figure>
  );
}
