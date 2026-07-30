"use client";

// Attribution Tycoon — render layer. All game logic lives in the agent modules
// under lib/attribution-tycoon; this component only collects input, calls
// runDay() and paints the resulting state.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Charts from "./attribution-tycoon-charts";
import * as AdPlatform from "@/lib/attribution-tycoon/agents/ad-platform";
import * as CustomerTraffic from "@/lib/attribution-tycoon/agents/customer-traffic";
import * as Market from "@/lib/attribution-tycoon/agents/market-event";
import * as Tracking from "@/lib/attribution-tycoon/agents/tracking-engine";
import { CHANNELS, GAME, STACK_ITEMS } from "@/lib/attribution-tycoon/config";
import * as Sim from "@/lib/attribution-tycoon/simulation";
import type {
  ChannelId,
  DayResult,
  GameState,
  ModuleId,
  StackItem,
} from "@/lib/attribution-tycoon/types";
import styles from "./attribution-tycoon-game.module.css";

// ── formatting ───────────────────────────────────────────────────
const money = (v: number, dec = 0) =>
  (v < 0 ? "-$" : "$") +
  Math.abs(v).toLocaleString("en-US", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
const pct = (v: number, dec = 0) => `${(v * 100).toFixed(dec)}%`;
const num = (v: number) => Math.round(v).toLocaleString("en-US");
const signClass = (v: number) => (v >= 0 ? styles.pos : styles.neg);

const BROWSER_LABEL: Record<string, string> = {
  safari: "Safari",
  chrome: "Chrome",
  inapp: "In-App",
};

const AGENT_LABEL = {
  market: "MARKET",
  customer: "CUSTOMER",
  tracking: "TRACKING",
  adplatform: "AD-PLATFORM",
} as const;

const AGENT_CLASS = {
  market: styles.agentMarket,
  customer: styles.agentCustomer,
  tracking: styles.agentTracking,
  adplatform: styles.agentAdplatform,
} as const;

const PRESETS: Record<string, Record<ChannelId, number>> = {
  Conservative: { meta: 250, google: 200, tiktok: 120 },
  Balanced: { meta: 500, google: 400, tiktok: 280 },
  Aggressive: { meta: 1100, google: 850, tiktok: 700 },
  Clear: { meta: 0, google: 0, tiktok: 0 },
};

const TABS = [
  ["campaign", "Campaign"],
  ["stack", "Stack"],
  ["report", "Daily Report"],
  ["analytics", "Analytics"],
  ["console", "Agents"],
] as const;
type Tab = (typeof TABS)[number][0];

// Site palette: green reads as reality, yellow as the dashboard's version.
const C_TRUE = "var(--accent-3)";
const C_DASH = "var(--accent-2)";

interface Toast {
  id: number;
  text: string;
  tone: string;
}

function moduleShortName(id: ModuleId) {
  const item = STACK_ITEMS.find((i) => i.id === id);
  return item ? item.name.replace("Hardal ", "") : id;
}

function verdict(score: ReturnType<typeof Sim.score>, state: GameState) {
  if (!state.stack.includes("sgtm")) {
    return "You spent the whole period on client-side measurement. Most of your revenue showed up as “Direct / (not set)”, the algorithms went blind and CPA hit the ceiling. A server-side setup would have saved far more in acquisition cost than it charged in subscription fees.";
  }
  if (score.ratio > 1.05) {
    return "You went server-side but skipped event deduplication: the dashboard reported more revenue than actually happened. Scaling on inflated data is every bit as dangerous as scaling on missing data.";
  }
  if (score.avgEmq >= 8 && score.profit > 0) {
    return "You kept signal quality high, absorbed the crises before they landed and the algorithms found the right audience. Measurement infrastructure is not a cost line — it is a performance lever.";
  }
  if (score.profit > 0) {
    return "You closed profitable, but gaps remain in your signal quality. Complete the missing modules and pre-empt the crises, and the same budget will produce noticeably more sales.";
  }
  return "You closed at a loss. Pushing budget past channel capacity, or scaling on a low EMQ, buys every additional dollar of revenue at a worse price.";
}

export default function AttributionTycoonGame() {
  const [state, setState] = useState<GameState>(() => Sim.newGame());
  const [result, setResult] = useState<DayResult | null>(null);
  const [tab, setTab] = useState<Tab>("campaign");
  const [modal, setModal] = useState<"help" | "end" | null>(null);
  const [auto, setAuto] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const roasRef = useRef<HTMLCanvasElement>(null);
  const cashRef = useRef<HTMLCanvasElement>(null);
  const signalRef = useRef<HTMLCanvasElement>(null);
  const channelsRef = useRef<HTMLCanvasElement>(null);
  const attributionRef = useRef<HTMLCanvasElement>(null);

  // The simulation is a pure state machine, but a turn also fires toasts and
  // opens the endgame modal. Those are side effects, so they must not live
  // inside a setState updater — StrictMode invokes updaters twice. The ref
  // holds the authoritative state so back-to-back turns (auto-play) chain
  // correctly without waiting for a re-render.
  const stateRef = useRef(state);
  const commit = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const pushToast = useCallback((text: string, tone = "var(--accent-3)") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-3), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  // ── the daily loop ─────────────────────────────────────────────
  const runDay = useCallback(() => {
    const prev = stateRef.current;
    if (prev.status !== "playing") return;

    const outflow = Sim.totalBudget(prev) + Sim.dailyInfraCost(prev.stack);
    if (outflow > prev.cash) {
      pushToast(
        "Not enough cash: today's outflow exceeds your balance. Lower the budget.",
        "var(--accent-4)",
      );
      setAuto(false);
      return;
    }

    const { state: next, result: dayResult } = Sim.runDay(prev);
    commit(next);
    setResult(dayResult);

    for (const { event, mitigated } of dayResult.events) {
      pushToast(
        (mitigated ? "🛡 Mitigated: " : event.severity === "good" ? "✨ " : "⚠ ") +
          event.title,
        mitigated
          ? "var(--accent-3)"
          : event.severity === "critical"
            ? "var(--accent-4)"
            : event.severity === "good"
              ? "var(--accent-3)"
              : "var(--accent)",
      );
    }

    if (next.status !== "playing") {
      setAuto(false);
      setModal("end");
    }
  }, [commit, pushToast]);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(runDay, 1100);
    return () => clearInterval(t);
  }, [auto, runDay]);

  // ── stack purchases ────────────────────────────────────────────
  const buy = (item: StackItem) => {
    const { state: next, check } = Sim.buy(stateRef.current, item.id);
    if (!check.ok) {
      pushToast(check.reason, "var(--accent-4)");
      return;
    }
    commit(next);
    pushToast(`${item.name} installed — active from tomorrow's simulation.`);
  };

  const removeModule = (item: StackItem) => {
    const { state: next, check } = Sim.remove(stateRef.current, item.id);
    if (!check.ok) {
      pushToast(check.reason, "var(--accent-4)");
      return;
    }
    commit(next);
    pushToast(`${item.name} subscription cancelled.`, "var(--accent)");
  };

  const setBudget = (id: ChannelId, value: number) => {
    const v = Math.max(
      0,
      Math.min(GAME.MAX_DAILY_BUDGET_PER_CHANNEL, Math.round(value || 0)),
    );
    const prev = stateRef.current;
    commit({ ...prev, budgets: { ...prev.budgets, [id]: v } });
  };

  const applyPreset = (budgets: Record<ChannelId, number>) => {
    commit({ ...stateRef.current, budgets: { ...budgets } });
  };

  const reset = () => {
    commit(Sim.newGame());
    setResult(null);
    setAuto(false);
    setModal(null);
    setTab("campaign");
    pushToast("New game started. Day 1.");
  };

  // ── derived values ─────────────────────────────────────────────
  const adSpend = Sim.totalBudget(state);
  const infraDaily = Sim.dailyInfraCost(state.stack);
  const stackSet = useMemo(() => new Set<ModuleId>(state.stack), [state.stack]);

  /** Live "what would today look like" preview for the signal health bars. */
  const signalHealth = useMemo(() => {
    const mods = Market.aggregate(
      state.activeEvents.map((e) => ({ ...e })),
      stackSet,
    );
    const rng = Sim.mulberry32(state.seed + 1); // fixed sample composition
    return CHANNELS.map((ch) => {
      const mix = CustomerTraffic.composition(ch, mods, rng);
      const engine = Tracking.evaluate(ch, stackSet, mix, mods);
      const perf = AdPlatform.optimizeBidding(ch, 100, engine, mods, state, () => 0.5);
      return { channel: ch, engine, cpa: perf.cpaEffective };
    });
  }, [state, stackSet]);

  const radar = useMemo(() => {
    return Market.upcoming(state.day - 1, 40)
      .slice(0, 5)
      .map((e) => ({
        ...e,
        covered:
          e.mitigatedBy.length > 0 &&
          e.mitigatedBy.some((m) => state.stack.includes(m)),
      }));
  }, [state.day, state.stack]);

  const score = useMemo(() => Sim.score(state), [state]);

  const cumulative = useMemo(() => {
    const t = state.totals;
    const ratio = t.realRevenue > 0 ? t.reportedRevenue / t.realRevenue : 0;
    return {
      ...t,
      roas: t.spend > 0 ? t.realRevenue / t.spend : 0,
      ratio,
      off: Math.abs(1 - ratio),
    };
  }, [state.totals]);

  // ── chart painting ─────────────────────────────────────────────
  const draw = useCallback(() => {
    const h = state.history;

    if (roasRef.current) {
      Charts.line(
        roasRef.current,
        [
          { color: C_TRUE, data: h.map((d) => d.realRoas) },
          { color: C_DASH, data: h.map((d) => d.reportedRoas), dashed: true },
        ],
        { min: 0, yFormat: (v) => `${v.toFixed(1)}x` },
      );
    }
    if (cashRef.current) {
      Charts.line(cashRef.current, [{ color: "var(--accent)", data: h.map((d) => d.cash) }], {
        yFormat: (v) => `$${Math.round(v / 1000)}k`,
      });
    }
    if (signalRef.current) {
      Charts.line(
        signalRef.current,
        [
          { color: "var(--accent)", data: h.map((d) => d.emq) },
          { color: "var(--accent-2)", data: h.map((d) => d.retention * 10) },
        ],
        { min: 0, max: 10, yFormat: (v) => v.toFixed(1) },
      );
    }
    if (channelsRef.current && result) {
      Charts.groupedBars(
        channelsRef.current,
        result.channels.map((c) => ({
          label: c.short,
          values: [
            { value: c.realRoas, color: c.color },
            { value: c.reportedRoas, color: c.color, ghost: true },
          ],
        })),
      );
    }
    if (attributionRef.current && result) {
      const tracked = result.channels.reduce((s, c) => s + c.attribution.trackedSales, 0);
      const direct = result.channels.reduce((s, c) => s + c.attribution.directUnassigned, 0);
      const invisible = result.channels.reduce((s, c) => s + c.attribution.invisible, 0);
      Charts.stackedBar(attributionRef.current, [
        { value: tracked, color: "var(--accent-3)" },
        { value: direct, color: "var(--accent-2)" },
        { value: invisible, color: "var(--accent-4)" },
      ]);
    }
  }, [state.history, result]);

  useEffect(() => {
    draw();
  }, [draw, tab]);

  // The embed sits in a fixed content column, but the column itself reflows —
  // canvases are sized from getBoundingClientRect, so repaint on resize.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);

  // ── small render helpers ───────────────────────────────────────
  const attributionParts = result
    ? [
        {
          label: "Attributed to channel",
          color: "var(--accent-3)",
          value: result.channels.reduce((s, c) => s + c.attribution.trackedSales, 0),
        },
        {
          label: "Direct / (not set)",
          color: "var(--accent-2)",
          value: result.channels.reduce((s, c) => s + c.attribution.directUnassigned, 0),
        },
        {
          label: "Never seen",
          color: "var(--accent-4)",
          value: result.channels.reduce((s, c) => s + c.attribution.invisible, 0),
        },
      ]
    : [];

  const gap = result ? Math.max(0, result.realRevenue - result.reportedRevenue) : 0;

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.shell}>
        {/* header */}
        <div className={styles.topbar}>
          <div className={styles.brand}>
            ATTRIBUTION TYCOON
            <span>The Tracking Wars</span>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => setModal("help")}
              aria-label="How to play"
            >
              ?
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={reset}
              aria-label="New game"
            >
              ⟲
            </button>
            <button
              type="button"
              className={`${styles.btn} ${auto ? styles.btnOn : ""}`}
              onClick={() => setAuto((a) => !a)}
              disabled={state.status !== "playing"}
            >
              {auto ? "❚❚ Stop" : "▶▶ Auto"}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => {
                setAuto(false);
                runDay();
              }}
              disabled={state.status !== "playing"}
            >
              {state.status === "playing" ? "Run Day" : "Game Over"}
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className={styles.kpis}>
          <div className={styles.kpi}>
            <label>Day</label>
            <b>
              {Math.min(state.day, GAME.TOTAL_DAYS)}/{GAME.TOTAL_DAYS}
            </b>
          </div>
          <div className={styles.kpi}>
            <label>Cash</label>
            <b className={state.cash < 5000 ? styles.warnText : ""}>
              {money(state.cash)}
            </b>
          </div>
          <div className={styles.kpi}>
            <label>Net yesterday</label>
            <b className={result ? signClass(result.netProfit) : ""}>
              {result ? money(result.netProfit) : "—"}
            </b>
          </div>
          <div className={styles.kpi}>
            <label>Dash. ROAS</label>
            <b className={styles.dim}>
              {result ? `${result.reportedRoas.toFixed(2)}x` : "—"}
            </b>
          </div>
          <div className={styles.kpi}>
            <label>True ROAS</label>
            <b className={result && result.realRoas >= 2.4 ? styles.pos : ""}>
              {result ? `${result.realRoas.toFixed(2)}x` : "—"}
            </b>
          </div>
          <div className={styles.kpi}>
            <label>Avg. EMQ</label>
            <b
              className={
                !result
                  ? ""
                  : result.emq >= 8
                    ? styles.pos
                    : result.emq >= 5.5
                      ? styles.warnText
                      : styles.neg
              }
            >
              {result ? result.emq.toFixed(1) : "—"}
            </b>
          </div>
        </div>

        {/* tabs */}
        <div className={styles.tabs} role="tablist">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`${styles.tab} ${tab === id ? styles.tabActive : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── campaign ─────────────────────────────────────────── */}
        {tab === "campaign" && (
          <div className={styles.panel}>
            <div className={styles.cols2}>
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <h3>Budget Allocation</h3>
                  <span className={styles.hint}>daily</span>
                </div>
                {CHANNELS.map((ch) => {
                  const v = state.budgets[ch.id];
                  const over = v > ch.capacity;
                  return (
                    <div key={ch.id} className={styles.budgetItem}>
                      <div className={styles.budgetTop}>
                        <i className={styles.dot} style={{ background: ch.color }} />
                        <b>{ch.name}</b>
                        <input
                          type="number"
                          min={0}
                          max={GAME.MAX_DAILY_BUDGET_PER_CHANNEL}
                          step={25}
                          value={v}
                          aria-label={`${ch.name} daily budget`}
                          onChange={(e) => setBudget(ch.id, +e.target.value)}
                        />
                      </div>
                      <input
                        className={styles.slider}
                        type="range"
                        min={0}
                        max={GAME.MAX_DAILY_BUDGET_PER_CHANNEL}
                        step={25}
                        value={v}
                        aria-label={`${ch.name} daily budget slider`}
                        onChange={(e) => setBudget(ch.id, +e.target.value)}
                      />
                      <div className={styles.budgetMeta}>
                        <span>capacity {money(ch.capacity)}</span>
                        <span className={over ? styles.over : ""}>
                          {over ? "⚠ scaling penalty" : "efficient range"}
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div className={styles.rows}>
                  <div className={styles.row}>
                    <span>Ad spend</span>
                    <b>{money(adSpend)}</b>
                  </div>
                  <div className={styles.row}>
                    <span>Infrastructure (daily)</span>
                    <b>{money(infraDaily)}</b>
                  </div>
                  <div className={`${styles.row} ${styles.rowTotal}`}>
                    <span>Total daily outflow</span>
                    <b>{money(adSpend + infraDaily)}</b>
                  </div>
                  <div className={styles.row}>
                    <span>Cash on hand</span>
                    <b className={state.cash < adSpend + infraDaily ? styles.neg : ""}>
                      {money(state.cash)}
                    </b>
                  </div>
                </div>

                <div className={styles.presets}>
                  {Object.entries(PRESETS).map(([label, budgets]) => (
                    <button
                      key={label}
                      type="button"
                      className={styles.chip}
                      onClick={() => applyPreset(budgets)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className={styles.card}>
                  <div className={styles.cardHead}>
                    <h3>Signal Health</h3>
                    <span className={styles.hint}>if today ran now</span>
                  </div>
                  {signalHealth.map(({ channel, engine, cpa }) => (
                    <div key={channel.id} className={styles.shItem}>
                      <div className={styles.shTop}>
                        <span>
                          <i className={styles.dot} style={{ background: channel.color }} />
                          {channel.short}
                        </span>
                        <span>
                          EMQ {engine.emq.toFixed(1)} · {pct(engine.retention)} · CPA ~
                          {money(cpa)}
                        </span>
                      </div>
                      <div className={styles.bar}>
                        <i
                          style={{
                            width: `${(engine.emq / 10) * 100}%`,
                            background:
                              engine.emq >= 8
                                ? "var(--accent-3)"
                                : engine.emq >= 5.5
                                  ? "var(--accent)"
                                  : "var(--accent-4)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.card}>
                  <div className={styles.cardHead}>
                    <h3>Crisis Radar</h3>
                  </div>
                  {radar.length === 0 ? (
                    <p className={styles.note}>No scheduled crises left.</p>
                  ) : (
                    radar.map((e) => (
                      <div
                        key={e.title}
                        className={`${styles.radarItem} ${e.covered ? styles.radarSafe : ""}`}
                      >
                        <span className={styles.radarDay}>D{e.day}</span>
                        <div className={styles.radarBody}>
                          <b>{e.title}</b>
                          <span>
                            {e.mitigatedBy.length === 0
                              ? "cannot be prevented"
                              : e.covered
                                ? "🛡 you are covered"
                                : `needs: ${e.mitigatedBy.map(moduleShortName).join(", ")}`}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className={styles.card}>
                  <div className={styles.cardHead}>
                    <h3>Live Customer Feed</h3>
                    <span className={styles.hint}>sample</span>
                  </div>
                  {!result || result.journeys.length === 0 ? (
                    <p className={styles.note}>
                      Run a day and sampled customer journeys appear here.
                    </p>
                  ) : (
                    result.journeys.slice(0, 5).map((j, i) => (
                      <div
                        key={`${j.name}-${i}`}
                        className={`${styles.journey} ${j.tracked ? styles.journeyOk : styles.journeyLost}`}
                      >
                        <div className={styles.journeyTop}>
                          <b>{j.name}</b>
                          <span className={styles.miniTag}>{j.os}</span>
                          <span className={styles.miniTag}>{BROWSER_LABEL[j.browser]}</span>
                          {j.adblock && <span className={styles.miniTag}>AdBlock</span>}
                          {!j.consent && <span className={styles.miniTag}>No consent</span>}
                        </div>
                        <div
                          className={`${styles.verdict} ${j.tracked ? styles.pos : styles.neg}`}
                        >
                          {j.tracked ? "✓ measured" : "✕ lost"} — {j.reason}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── stack ────────────────────────────────────────────── */}
        {tab === "stack" && (
          <div className={styles.panel}>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h3>Measurement Stack</h3>
                <span className={styles.hint}>
                  Monthly: {money(Sim.monthlyInfraCost(state.stack))}
                </span>
              </div>
              <p className={styles.note}>
                Each module has a one-off setup fee and a monthly fee drawn from cash
                daily (÷30). Every server-side module requires Hardal Server-Side GTM.
              </p>
            </div>

            <div className={styles.stackGrid}>
              {STACK_ITEMS.map((item) => {
                const owned = state.stack.includes(item.id);
                const reqOk = Sim.requirementsMet(state, item);
                const buyCheck = Sim.canBuy(state, item);
                const removeCheck = Sim.canRemove(state, item);
                return (
                  <div
                    key={item.id}
                    className={`${styles.stackCard} ${owned ? styles.stackOwned : ""} ${
                      !owned && !reqOk ? styles.stackLocked : ""
                    }`}
                  >
                    <div>
                      <span className={styles.vendor}>{item.vendor}</span>
                      <h4>{item.name}</h4>
                    </div>
                    <span className={styles.tag}>{item.tag}</span>
                    <p>{item.desc}</p>
                    <ul>
                      {item.effects.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                    <div className={styles.price}>
                      <span>
                        Setup <b>{item.setup ? money(item.setup) : "—"}</b>
                      </span>
                      <span>
                        Monthly <b>{item.monthly ? money(item.monthly) : "Free"}</b>
                      </span>
                    </div>
                    {item.permanent ? (
                      <div className={styles.stackStatus}>● Always on</div>
                    ) : owned ? (
                      <>
                        <div className={styles.stackStatus}>✓ Installed</div>
                        <button
                          type="button"
                          className={styles.btn}
                          disabled={!removeCheck.ok}
                          onClick={() => removeModule(item)}
                        >
                          {removeCheck.ok ? "Cancel subscription" : removeCheck.reason}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={`${styles.btn} ${buyCheck.ok ? styles.btnPrimary : ""}`}
                        disabled={!buyCheck.ok}
                        onClick={() => buy(item)}
                      >
                        {buyCheck.ok ? `Install · ${money(item.setup)}` : buyCheck.reason}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── daily report ─────────────────────────────────────── */}
        {tab === "report" && (
          <div className={styles.panel}>
            {!result ? (
              <div className={styles.empty}>
                <b>Day 1 is about to begin.</b>
                <br />
                Allocate your budget in Campaign, build your stack in Stack, then hit Run
                Day. The four agents fire in sequence.
              </div>
            ) : (
              <>
                <div className={styles.truthGrid}>
                  <div className={styles.truth} style={{ borderLeftColor: "var(--accent-3)" }}>
                    <label>Revenue that happened</label>
                    <b className={styles.pos}>{money(result.realRevenue)}</b>
                    <span>
                      {num(result.sales)} sales · {money(result.spend)} spent
                    </span>
                  </div>
                  <div className={styles.truth} style={{ borderLeftColor: "var(--accent-2)" }}>
                    <label>Revenue on the dashboard</label>
                    <b style={{ color: "var(--accent-2)" }}>{money(result.reportedRevenue)}</b>
                    <span>
                      {num(result.trackedSales)} measured
                      {result.channels.some((c) => c.attribution.inflation > 0)
                        ? " · ⚠ inflated"
                        : ""}
                    </span>
                  </div>
                  <div className={styles.truth} style={{ borderLeftColor: "var(--accent-4)" }}>
                    <label>Left in the dark</label>
                    <b className={styles.neg}>{money(gap)}</b>
                    <span>
                      {result.realRevenue > 0
                        ? `${((gap / result.realRevenue) * 100).toFixed(0)}% of revenue missing`
                        : "—"}
                    </span>
                  </div>
                  <div className={styles.truth} style={{ borderLeftColor: "var(--accent)" }}>
                    <label>Net profit / loss</label>
                    <b className={signClass(result.netProfit)}>{money(result.netProfit)}</b>
                    <span>
                      gross {money(result.grossProfit)} − ads {money(result.spend)} − infra{" "}
                      {money(result.infraCost)}
                    </span>
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.cardHead}>
                    <h3>Attribution Split</h3>
                    <span className={styles.hint}>where the sales ended up</span>
                  </div>
                  <canvas
                    ref={attributionRef}
                    className={`${styles.chart} ${styles.chartBar}`}
                  />
                  <div className={styles.legend}>
                    {attributionParts.map((p) => (
                      <span key={p.label}>
                        <i style={{ background: p.color }} />
                        {p.label} — {num(p.value)} sales
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.cardHead}>
                    <h3>Channel Performance</h3>
                  </div>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Channel</th>
                          <th>Spend</th>
                          <th>CPC</th>
                          <th>CPA eff</th>
                          <th>EMQ</th>
                          <th>Capture</th>
                          <th>Sales</th>
                          <th>Dash.</th>
                          <th>True</th>
                          <th>Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.channels.map((c) => {
                          const net = c.grossProfit - c.spend;
                          if (c.spend <= 0) {
                            return (
                              <tr key={c.id} className={styles.dim}>
                                <td>
                                  <span className={styles.chCell}>
                                    <i className={styles.dot} style={{ background: c.color }} />
                                    {c.short}
                                  </span>
                                </td>
                                <td colSpan={9} style={{ textAlign: "left" }}>
                                  no budget allocated
                                </td>
                              </tr>
                            );
                          }
                          return (
                            <tr key={c.id}>
                              <td>
                                <span className={styles.chCell}>
                                  <i className={styles.dot} style={{ background: c.color }} />
                                  {c.short}
                                </span>
                              </td>
                              <td>{money(c.spend)}</td>
                              <td>{money(c.perf.cpc, 2)}</td>
                              <td
                                className={
                                  c.perf.cpaEffective > c.perf.cpaBase * 1.6
                                    ? styles.neg
                                    : styles.pos
                                }
                              >
                                {money(c.perf.cpaEffective, 2)}
                              </td>
                              <td
                                className={
                                  c.engine.emq >= 8
                                    ? styles.pos
                                    : c.engine.emq >= 5.5
                                      ? styles.warnText
                                      : styles.neg
                                }
                              >
                                {c.engine.emq.toFixed(1)}
                              </td>
                              <td>{pct(c.engine.retention)}</td>
                              <td>{num(c.perf.sales)}</td>
                              <td className={styles.dim}>{c.reportedRoas.toFixed(2)}x</td>
                              <td className={c.realRoas >= 2.4 ? styles.pos : ""}>
                                {c.realRoas.toFixed(2)}x
                              </td>
                              <td className={signClass(net)}>{money(net)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.cardHead}>
                    <h3>Today&apos;s Events</h3>
                  </div>
                  {result.events.length === 0 ? (
                    <p className={styles.note}>No new crisis fired today.</p>
                  ) : (
                    result.events.map(({ event, mitigated }) => {
                      const color = mitigated
                        ? "var(--accent-2)"
                        : event.severity === "good"
                          ? "var(--accent-3)"
                          : event.severity === "critical"
                            ? "var(--accent-4)"
                            : "var(--accent)";
                      return (
                        <div
                          key={event.id}
                          className={styles.event}
                          style={{ borderLeftColor: color }}
                        >
                          <b>
                            {mitigated
                              ? "🛡"
                              : event.severity === "good"
                                ? "✨"
                                : event.severity === "critical"
                                  ? "🔥"
                                  : "⚠"}{" "}
                            {event.title}
                          </b>
                          <p>
                            {mitigated
                              ? (event.mitigatedText ?? "Your stack absorbed this crisis.")
                              : event.body}
                          </p>
                          {event.mitigatedBy.length > 0 && (
                            <span className={styles.badge} style={{ color }}>
                              {mitigated
                                ? "Mitigated"
                                : `Fix: ${event.mitigatedBy.map(moduleShortName).join(" / ")}`}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── analytics ────────────────────────────────────────── */}
        {tab === "analytics" && (
          <div className={styles.panel}>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h3>ROAS: Dashboard vs Reality</h3>
                <span className={styles.hint}>dashed = what you see</span>
              </div>
              <canvas ref={roasRef} className={styles.chart} />
              <div className={styles.legend}>
                <span>
                  <i style={{ background: C_TRUE }} />
                  True ROAS
                </span>
                <span>
                  <i style={{ background: C_DASH }} />
                  Dashboard ROAS
                </span>
              </div>
            </div>

            <div className={styles.cols2}>
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <h3>Cash Flow</h3>
                </div>
                <canvas ref={cashRef} className={`${styles.chart} ${styles.chartSm}`} />
              </div>
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <h3>EMQ &amp; Capture</h3>
                </div>
                <canvas ref={signalRef} className={`${styles.chart} ${styles.chartSm}`} />
                <div className={styles.legend}>
                  <span>
                    <i style={{ background: "var(--accent)" }} />
                    EMQ (/10)
                  </span>
                  <span>
                    <i style={{ background: "var(--accent-2)" }} />
                    Capture %
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h3>Channel Breakdown</h3>
                <span className={styles.hint}>last day · faded = dashboard</span>
              </div>
              <canvas ref={channelsRef} className={`${styles.chart} ${styles.chartSm}`} />
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h3>Cumulative</h3>
              </div>
              <div className={styles.totals}>
                <div className={styles.totalItem}>
                  <label>Ad spend</label>
                  <b>{money(cumulative.spend)}</b>
                </div>
                <div className={styles.totalItem}>
                  <label>True revenue</label>
                  <b className={styles.pos}>{money(cumulative.realRevenue)}</b>
                </div>
                <div className={styles.totalItem}>
                  <label>On dashboard</label>
                  <b>{money(cumulative.reportedRevenue)}</b>
                </div>
                <div className={styles.totalItem}>
                  <label>Dash / reality</label>
                  <b
                    className={
                      cumulative.off < 0.12
                        ? styles.pos
                        : cumulative.off < 0.4
                          ? styles.warnText
                          : styles.neg
                    }
                  >
                    {pct(cumulative.ratio)}
                  </b>
                </div>
                <div className={styles.totalItem}>
                  <label>Cumulative ROAS</label>
                  <b>{cumulative.roas.toFixed(2)}x</b>
                </div>
                <div className={styles.totalItem}>
                  <label>Cumulative net</label>
                  <b className={signClass(cumulative.profit)}>{money(cumulative.profit)}</b>
                </div>
                <div className={styles.totalItem}>
                  <label>Infra invested</label>
                  <b>{money(cumulative.infraCost)}</b>
                </div>
                <div className={styles.totalItem}>
                  <label>Brand equity</label>
                  <b>{pct(state.brandEquity)}</b>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── agents ───────────────────────────────────────────── */}
        {tab === "console" && (
          <div className={styles.panel}>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h3>Multi-Agent Architecture</h3>
              </div>
              <div className={styles.arch}>
                <div className={styles.archNode}>
                  4 · MARKET EVENT AGENT
                  <span>Apple / Google / TikTok crises</span>
                </div>
                <div className={styles.archArrow}>▼</div>
                <div className={styles.archRow}>
                  <div className={styles.archNode}>
                    1 · CUSTOMER TRAFFIC AGENT
                    <span>iOS, Chrome, ad blockers, consent</span>
                  </div>
                  <div className={styles.archArrow}>▶</div>
                  <div className={styles.archNode}>
                    2 · TRACKING ENGINE AGENT
                    <span>GA4 vs sGTM · CAPI / EAPI</span>
                  </div>
                </div>
                <div className={styles.archArrow}>▼</div>
                <div className={styles.archNode}>
                  3 · AD PLATFORM ALGO AGENT
                  <span>Meta / Google / TikTok bidding</span>
                </div>
                <div className={styles.archArrow}>▼</div>
                <div className={styles.archNode}>ANALYTICS &amp; ROAS DASHBOARD</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h3>Agent Log Stream</h3>
                <span className={styles.hint}>{result ? `Day ${result.day}` : "—"}</span>
              </div>
              <div className={styles.console}>
                {!result ? (
                  <div className={styles.logMsg}>Waiting for the first day…</div>
                ) : (
                  result.log.map((l, i) => (
                    <div key={`${result.day}-${i}`} className={styles.logLine}>
                      <span className={`${styles.agentTag} ${AGENT_CLASS[l.agent]}`}>
                        {AGENT_LABEL[l.agent]}
                      </span>
                      <span className={styles.logMsg}>{l.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── modals ─────────────────────────────────────────────── */}
      {modal === "help" && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className={styles.modal} role="dialog" aria-modal="true">
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <h3>Attribution Tycoon: The Tracking Wars</h3>
            <p>
              You run the performance marketing budget of an e-commerce brand for 30 days.
              Making sales is not enough to win — you have to be able to{" "}
              <strong>measure</strong> them. Every sale you cannot measure is a sale the ad
              algorithm never learns from.
            </p>

            <h4>The four agents</h4>
            <ul>
              <li>
                <strong>Customer Traffic</strong> — builds the cohort: iOS/Android,
                Safari/Chrome/In-App, ad blockers, consent.
              </li>
              <li>
                <strong>Tracking Engine</strong> — captures or drops those events based on
                your stack.
              </li>
              <li>
                <strong>Ad Platform Algo</strong> — prices delivery from your signal quality.
              </li>
              <li>
                <strong>Market Event</strong> — fires Apple LTP, Google Cookielock, the
                TikTok in-app restriction and more.
              </li>
            </ul>

            <h4>The math</h4>
            <div className={styles.formula}>
              S_retention = (1 − AdBlocker_eff) × (1 − SignalLoss) × PipelineIntegrity
            </div>
            <div className={styles.formula}>CPA_effective = CPA_base ÷ (EMQ / 10)</div>
            <p>
              A client-side stack lands near EMQ 3.4, turning Meta&apos;s $20 base CPA into
              about $59. A full server-side stack reaches EMQ 9.4 and the same CPA drops to
              about $21. With a 42% contribution margin your break-even sits near{" "}
              <strong>2.4x true ROAS</strong>.
            </p>

            <h4>Watch out</h4>
            <ul>
              <li>
                <strong>Dashboard ROAS ≠ True ROAS.</strong> Cutting budget based on the
                number the platform shows you is the most expensive mistake available.
              </li>
              <li>
                Install CAPI/EAPI without <strong>Event Deduplication</strong> and the
                dashboard inflates instead — you see more revenue than happened.
              </li>
              <li>Budget above a channel&apos;s capacity takes a scaling penalty.</li>
              <li>
                Crises appear in the Crisis Radar in advance. Buy the fix before the day
                arrives.
              </li>
            </ul>
            <p className={styles.dim}>If cash drops below zero, you go bankrupt.</p>
          </div>
        </div>
      )}

      {modal === "end" && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className={styles.modal} role="dialog" aria-modal="true">
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <h3>{state.status === "bankrupt" ? "You went bankrupt" : "30 days complete"}</h3>
            <p>
              {state.status === "bankrupt"
                ? `Cash ran out on day ${state.day}. The revenue you could not measure turned into a bill you could not pay.`
                : "The campaign period is over. Here is the report card for your measurement strategy."}
            </p>
            <div className={styles.gradeBox}>
              <div className={styles.grade}>{score.grade}</div>
              <div className={styles.points}>
                {score.points.toLocaleString("en-US")} points
              </div>
            </div>
            <div className={styles.scoreGrid}>
              <div className={styles.totalItem}>
                <label>Net profit / loss</label>
                <b className={signClass(score.profit)}>{money(score.profit)}</b>
              </div>
              <div className={styles.totalItem}>
                <label>Cumulative true ROAS</label>
                <b>{score.roas.toFixed(2)}x</b>
              </div>
              <div className={styles.totalItem}>
                <label>Measurement accuracy</label>
                <b>{pct(score.accuracy)}</b>
              </div>
              <div className={styles.totalItem}>
                <label>Avg. EMQ, last 5 days</label>
                <b>{score.avgEmq.toFixed(1)}/10</b>
              </div>
            </div>
            <h4>Verdict</h4>
            <p>{verdict(score, state)}</p>
            <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={reset}
              >
                New game
              </button>
              <button
                type="button"
                className={styles.btn}
                onClick={() => {
                  setModal(null);
                  setTab("analytics");
                }}
              >
                Review the data
              </button>
            </div>
          </div>
        </div>
      )}

      {toasts.length > 0 && (
        <div className={styles.toasts}>
          {toasts.map((t) => (
            <div key={t.id} className={styles.toast} style={{ borderLeftColor: t.tone }}>
              {t.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
