"use client";

// Destanı Yeniden Yaz — render katmanı.
//
// Oyun mantığı lib/rewrite-the-epic altındaki ajan modüllerinde (engine,
// narrator, canon-agent, analytics); bu bileşen sadece durumu gösterir ve
// kararları motora iletir. Motor saf olduğu için her karardan sonra yeni bir
// durum nesnesi doğuyor ve React değişikliği nesne kimliğinden görüyor.
//
// Anlatı metinleri repo içinde yazılmış statik HTML parçaları (yalnızca <em> ve
// <strong>); kullanıcı girdisi hiçbir yere karışmadığı için daktilo efekti bu
// parçaları doğrudan DOM'a yazarak ilerliyor.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { METRICS, NODES } from "@/lib/rewrite-the-epic/canon-db";
import {
  getCanonRecord,
  getChoice,
  getNode,
} from "@/lib/rewrite-the-epic/canon-agent";
import {
  applyChoice,
  createState,
  isFinished,
  makeRng,
} from "@/lib/rewrite-the-epic/engine";
import { narrate, narrateOutcome } from "@/lib/rewrite-the-epic/narrator";
import {
  buildReport,
  pctDiff,
  toPlainText,
} from "@/lib/rewrite-the-epic/analytics";
import {
  NODE_CAST,
  ROSTER,
  castOf,
  characterOf,
  figureMarkup,
} from "@/lib/rewrite-the-epic/characters";
import type {
  CanonRecord,
  EffectKey,
  GameState,
  LogEntry,
  Report,
  Scene,
} from "@/lib/rewrite-the-epic/types";
import styles from "./rewrite-the-epic-game.module.css";

type Phase = "prologue" | "scene" | "outcome" | "report";

const TOTAL_NODES = NODES.length;
const VOYAGE_STOPS = ["Kiklop", "Kirke", "Sirenler", "Boğaz", "Helios", "Ithaka"];
const GREEK_KEYS = ["Α", "Β", "Γ", "Δ"];

const TAG_LABEL: Record<string, string> = {
  merak: "Merak",
  pragmatik: "Pragmatik",
  temkin: "Temkin",
  kumar: "Kumar",
};

const TAG_CLASS: Record<string, string> = {
  merak: styles.tagMerak,
  pragmatik: styles.tagPragmatik,
  temkin: styles.tagTemkin,
  kumar: styles.tagKumar,
};

const METRIC_ROWS: Array<{
  key: EffectKey;
  label: string;
  scale: boolean;
  fmt: (v: number) => string;
}> = [
  { key: "crew", label: "Mürettebat", scale: false, fmt: (v) => String(v) },
  { key: "months", label: "Geçen süre", scale: false, fmt: (v) => `${v} ay` },
  { key: "rationality", label: "Rasyonellik", scale: true, fmt: (v) => `${v} / 100` },
  { key: "curiosity", label: "Merak & Keşif", scale: true, fmt: (v) => `${v} / 100` },
  { key: "risk", label: "Risk toleransı", scale: true, fmt: (v) => `${v} / 100` },
  { key: "authority", label: "Liderlik otoritesi", scale: true, fmt: (v) => `${v} / 100` },
  { key: "wrath", label: "Tanrıların gazabı", scale: true, fmt: (v) => `${v} / 100` },
];

/** Kaynak metrikleri iyi–kötü yönü taşır; kişilik metrikleri değer yargısı taşımaz. */
function toneOf(key: EffectKey, delta: number): "up" | "down" | "neutral" {
  if (key === "crew") return delta > 0 ? "up" : "down";
  if (key === "months" || key === "wrath") return delta > 0 ? "down" : "up";
  return "neutral";
}

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotion(onChange: () => void) {
  const mq = window.matchMedia(MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Harici bir kaynağa abonelik; effect içinde setState çağırmadan okunur. */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false,
  );
}

/* ── Karakter madalyonu ─────────────────────────────────────────────────── */

function Figure({
  id,
  size,
  alive,
  tone,
}: {
  id: string;
  size: "sm" | "md" | "lg" | "xl";
  alive?: boolean;
  tone?: "gold" | "canon" | "player";
}) {
  const sizeClass = { sm: styles.mdSm, md: styles.mdMd, lg: styles.mdLg, xl: styles.mdXl }[size];
  const toneClass = tone
    ? { gold: styles.toneGold, canon: styles.toneCanon, player: styles.tonePlayer }[tone]
    : "";
  return (
    <span
      className={[styles.medallion, sizeClass, toneClass, alive ? styles.alive : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: figureMarkup(id) }}
      />
    </span>
  );
}

/* ── Daktilo ────────────────────────────────────────────────────────────── */

/**
 * Paragrafları sırayla yazar. Metin düğümlerini gezip harf harf açtığı için
 * inline <em>/<strong> etiketleri bozulmadan kalır.
 */
function useTypewriter(
  paragraphs: string[],
  cps: number,
  reduced: boolean,
  onDone?: () => void,
) {
  const ref = useRef<HTMLDivElement | null>(null);
  const finishRef = useRef<() => void>(() => {});
  const doneRef = useRef(onDone);

  // Ref'e render sırasında değil effect içinde yazıyoruz (React 19 kuralı).
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const full = paragraphs.map((p) => `<p>${p}</p>`).join("");

    if (reduced) {
      host.innerHTML = full;
      host.classList.remove(styles.typing);
      doneRef.current?.();
      return;
    }

    host.innerHTML = "";
    // İmleç sınıfı DOM'a doğrudan yazılıyor: geçici bir görsel durum için
    // render tetiklemeye değmez.
    host.classList.add(styles.typing);
    let raf = 0;
    let index = 0;
    let cancelled = false;

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      host.classList.remove(styles.typing);
    };

    finishRef.current = () => {
      if (cancelled) return;
      cancelled = true;
      stop();
      host.innerHTML = full;
      doneRef.current?.();
    };

    const typeParagraph = () => {
      if (cancelled) return;
      if (index >= paragraphs.length) {
        cancelled = true;
        stop();
        doneRef.current?.();
        return;
      }

      const p = document.createElement("p");
      p.innerHTML = paragraphs[index];
      host.appendChild(p);

      const parts: Array<{ node: Text; text: string }> = [];
      const walk = (node: Node) => {
        node.childNodes.forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const textNode = child as Text;
            parts.push({ node: textNode, text: textNode.nodeValue ?? "" });
            textNode.nodeValue = "";
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            walk(child);
          }
        });
      };
      walk(p);

      const total = parts.reduce((sum, part) => sum + part.text.length, 0);
      let shown = -1;
      let start = 0;

      const paint = (count: number) => {
        let remaining = count;
        for (const part of parts) {
          const len = Math.max(0, Math.min(part.text.length, remaining));
          if ((part.node.nodeValue ?? "").length !== len) {
            part.node.nodeValue = part.text.slice(0, len);
          }
          remaining -= part.text.length;
        }
      };

      const frame = (ts: number) => {
        if (cancelled) return;
        if (!start) start = ts;
        const target = Math.min(total, Math.round(((ts - start) / 1000) * cps));
        if (target !== shown) {
          paint(target);
          shown = target;
        }
        if (target < total) {
          raf = requestAnimationFrame(frame);
        } else {
          index += 1;
          raf = requestAnimationFrame(typeParagraph);
        }
      };
      raf = requestAnimationFrame(frame);
    };

    typeParagraph();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      host.classList.remove(styles.typing);
    };
  }, [paragraphs, cps, reduced]);

  return { ref, skip: () => finishRef.current() };
}

/* ── Sayaç ──────────────────────────────────────────────────────────────── */

/**
 * Sayacı ref üzerinden yazar. Kare başına setState çağırmak 600 ms'lik bir
 * animasyon için ~36 gereksiz render demek olurdu; geçici değer DOM'a doğrudan
 * yazılıyor, React yalnızca hedef değiştiğinde devreye giriyor.
 */
function useCountUp(
  target: number,
  delta: number,
  reduced: boolean,
  fmt: (v: number) => string,
) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced || !delta) {
      el.textContent = fmt(target);
      return;
    }
    const from = target - delta;
    let raf = 0;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / 620);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, delta, reduced, fmt]);

  return ref;
}

/* ── Durum takipçisi satırı ─────────────────────────────────────────────── */

function StatRow({
  row,
  state,
  delta,
  reduced,
}: {
  row: (typeof METRIC_ROWS)[number];
  state: GameState;
  delta: number;
  reduced: boolean;
}) {
  const target = state[row.key as keyof GameState] as number;
  const valueRef = useCountUp(target, delta, reduced, row.fmt);
  const tone = toneOf(row.key, delta);
  const chipClass =
    tone === "up" ? styles.chipUp : tone === "down" ? styles.chipDown : styles.chipNeutral;

  // Bar genişliği CSS geçişiyle akıyor; hedefi DOM'a yazmak render'dan ucuz.
  const fillRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.style.width = `${target}%`;
    });
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <div className={`${styles.statRow} ${delta ? styles.bump : ""}`}>
      <div className={styles.statTop}>
        <span className={styles.statKey}>{row.label}</span>
        <span className={styles.statValue} ref={valueRef}>
          {row.fmt(target)}
        </span>
        {delta ? (
          <span className={`${styles.chip} ${chipClass}`}>
            {delta > 0 ? `+${delta}` : delta}
          </span>
        ) : null}
      </div>
      {row.scale ? (
        <div className={styles.miniTrack}>
          <div
            ref={fillRef}
            className={`${styles.miniFill} ${row.key === "wrath" ? styles.miniWrath : ""}`}
            style={{ width: `${delta ? target - delta : target}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

/* ── Kader zarı ─────────────────────────────────────────────────────────── */

function Dice({
  value,
  hit,
  reduced,
}: {
  value: number;
  hit: boolean;
  reduced: boolean;
}) {
  // Dönen sayı ve "dönüyor" sınıfı geçici görsel durumlar: kare başına render
  // etmek yerine DOM'a yazılıyor, böylece zar hiç yeniden render tetiklemiyor.
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const settle = () => {
      el.classList.remove(styles.diceRolling);
      el.classList.add(hit ? styles.diceHit : styles.diceMiss);
      el.textContent = value.toFixed(2);
    };

    if (reduced) {
      settle();
      return;
    }

    el.classList.remove(styles.diceHit, styles.diceMiss);
    el.classList.add(styles.diceRolling);

    let raf = 0;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      if (ts - start < 900) {
        el.textContent = Math.random().toFixed(2);
        raf = requestAnimationFrame(step);
      } else {
        settle();
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, hit, reduced]);

  return (
    <span ref={ref} className={styles.dice}>
      {reduced ? value.toFixed(2) : "—"}
    </span>
  );
}

/* ── Rapor barı ─────────────────────────────────────────────────────────── */

function Bar({
  value,
  kind,
  reduced,
  delayIndex,
}: {
  value: number;
  kind: "player" | "canon";
  reduced: boolean;
  delayIndex: number;
}) {
  // Sıfırdan hedefe büyüme CSS geçişiyle; sekme arka plandayken rAF durabildiği
  // için 80 ms'lik bir zamanlayıcı yedeği var.
  const barRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const grow = () => {
      el.style.width = `${Math.max(1.5, value)}%`;
    };
    if (reduced) {
      grow();
      return;
    }
    const raf = requestAnimationFrame(grow);
    const fallback = window.setTimeout(grow, 80);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
    };
  }, [value, reduced]);

  return (
    <div className={styles.barRow}>
      <div className={styles.barTrack}>
        <div
          ref={barRef}
          className={`${styles.bar} ${kind === "player" ? styles.barPlayer : styles.barCanon}`}
          style={{
            width: reduced ? `${Math.max(1.5, value)}%` : 0,
            transitionDelay: `${delayIndex * 90}ms`,
          }}
        />
      </div>
      <span className={styles.barValue}>{value}</span>
    </div>
  );
}

/* ── Ana bileşen ────────────────────────────────────────────────────────── */

export default function RewriteTheEpicGame() {
  const reduced = usePrefersReducedMotion();

  const [phase, setPhase] = useState<Phase>("prologue");
  const [seed, setSeed] = useState(0);
  const [state, setState] = useState<GameState>(() => createState());
  const [log, setLog] = useState<LogEntry[]>([]);
  const [scene, setScene] = useState<Scene | null>(null);
  const [entry, setEntry] = useState<LogEntry | null>(null);
  const [canonRecord, setCanonRecord] = useState<CanonRecord | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [choicesReady, setChoicesReady] = useState(false);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [copied, setCopied] = useState(false);

  const rngRef = useRef<() => number>(() => Math.random());
  const commitTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (commitTimer.current) window.clearTimeout(commitTimer.current);
    },
    [],
  );

  const start = useCallback(() => {
    const nextSeed = Math.floor(Math.random() * 0xffffff) + 1;
    rngRef.current = makeRng(nextSeed);
    const fresh = createState();
    setSeed(nextSeed);
    setState(fresh);
    setLog([]);
    setEntry(null);
    setReport(null);
    setChosenId(null);
    setChoicesReady(false);
    setScene(narrate(NODES[0], 0, fresh, nextSeed));
    setPhase("scene");
  }, []);

  const resolve = useCallback(
    (choiceId: string) => {
      const node = getNode(state.nodeIndex);
      if (!node) return;
      const choice = getChoice(node, choiceId);
      if (!choice) return;

      const result = applyChoice(state, node, choice, { rng: rngRef.current });
      setState(result.state);
      setLog((prev) => [...prev, result.entry]);
      setEntry(result.entry);
      setCanonRecord(getCanonRecord(node));
      setPhase("outcome");
      setChosenId(null);

      if (!reduced) {
        if (result.entry.applied.crew <= -25 || result.entry.fatal) setFlash("bad");
        else if (result.entry.isCanon) setFlash("good");
      }
    },
    [state, reduced],
  );

  const choose = useCallback(
    (choiceId: string) => {
      if (phase !== "scene" || chosenId) return;
      if (reduced) {
        resolve(choiceId);
        return;
      }
      setChosenId(choiceId);
      commitTimer.current = window.setTimeout(() => resolve(choiceId), 420);
    },
    [phase, chosenId, reduced, resolve],
  );

  const advance = useCallback(() => {
    if (phase !== "outcome") return;
    if (isFinished(state)) {
      setReport(buildReport(state, log, seed));
      setPhase("report");
      return;
    }
    const node = getNode(state.nodeIndex);
    if (!node) return;
    setChoicesReady(false);
    setScene(narrate(node, state.nodeIndex, state, seed));
    setPhase("scene");
  }, [phase, state, log, seed]);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 700);
    return () => window.clearTimeout(t);
  }, [flash]);

  const copyReport = useCallback(() => {
    if (!report) return;
    navigator.clipboard?.writeText(toPlainText(report)).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      },
      () => setCopied(false),
    );
  }, [report]);

  const voyageIndex = phase === "report" ? TOTAL_NODES : state.nodeIndex;
  const lastApplied = entry?.applied ?? null;

  return (
    <div
      className={styles.root}
      tabIndex={0}
      onKeyDown={(event) => {
        if (phase === "scene" && /^[1-4]$/.test(event.key)) {
          const index = Number(event.key) - 1;
          const choice = scene?.choices[index];
          if (choice && choicesReady) {
            event.preventDefault();
            choose(choice.id);
          }
        } else if (phase === "outcome" && event.key === "Enter") {
          event.preventDefault();
          advance();
        }
      }}
    >
      {flash ? (
        <span
          className={`${styles.flash} ${flash === "bad" ? styles.flashBad : styles.flashGood}`}
          aria-hidden="true"
        />
      ) : null}

      <header className={styles.head}>
        <div>
          <p className={styles.kicker}>ΟΔΥΣΣΕΙΑ · Karar ağacı &amp; A/B testi</p>
          <h3 className={styles.wordmark}>Destanı Yeniden Yaz</h3>
        </div>
        {seed ? <span className={styles.seed}>tohum {seed}</span> : null}
      </header>

      {phase === "prologue" ? (
        <Prologue onStart={start} />
      ) : phase === "report" && report ? (
        <ReportView
          report={report}
          reduced={reduced}
          onRestart={start}
          onCopy={copyReport}
          copied={copied}
        />
      ) : (
        <>
          <Voyage index={voyageIndex} />
          <div className={styles.layout}>
            <div className={styles.main}>
              {phase === "scene" && scene ? (
                <SceneView
                  scene={scene}
                  reduced={reduced}
                  chosenId={chosenId}
                  ready={choicesReady}
                  onReady={() => setChoicesReady(true)}
                  onChoose={choose}
                />
              ) : null}
              {phase === "outcome" && entry && canonRecord ? (
                <OutcomeView
                  entry={entry}
                  canonRecord={canonRecord}
                  reduced={reduced}
                  finished={isFinished(state)}
                  onAdvance={advance}
                />
              ) : null}
            </div>

            <aside className={styles.tablet} aria-label="Durum takipçisi">
              <h4 className={styles.tabletTitle}>Durum Takipçisi</h4>
              {METRIC_ROWS.map((row) => (
                <StatRow
                  key={row.key}
                  row={row}
                  state={state}
                  delta={phase === "outcome" && lastApplied ? lastApplied[row.key] : 0}
                  reduced={reduced}
                />
              ))}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Prolog ─────────────────────────────────────────────────────────────── */

function Prologue({ onStart }: { onStart: () => void }) {
  return (
    <section className={styles.card}>
      <p className={styles.eyebrow}>Prolog</p>
      <h4 className={styles.title}>Troya düştü. Deniz henüz bitmedi.</h4>
      <p className={styles.lede}>
        On yıllık savaşın külleri henüz soğumadı. Ithaka&apos;ya dönmek için on iki
        gemi, <strong>600 adam</strong> ve tanrıların değişken keyfi elinde.
        Homeros&apos;un yazdığı yol bellidir — ama <em>senin</em> yolun henüz
        yazılmadı.
      </p>
      <p className={styles.body}>
        Beş kader düğümünde karar vereceksin. Her karar mürettebatını, zamanını ve
        karakterini ölçen bir veri noktasıdır. Yolculuğun sonunda sistem seni
        Odysseus&apos;un orijinal destanıyla <strong>A/B testine</strong> tabi
        tutar: daha mı rasyonel, daha mı meraklı, daha mı hızlı?
      </p>

      <div className={styles.heroPortrait}>
        <Figure id="odysseus" size="xl" alive tone="gold" />
        <div>
          <p className={styles.heroName}>Odysseus</p>
          <p className={styles.heroRole}>
            Laertes oğlu · Troya&apos;nın tahta atını kuran akıl · şimdi sen
          </p>
        </div>
      </div>

      <ul className={styles.startStats}>
        <li>
          <span>Mürettebat</span>
          <strong>600 adam</strong>
        </li>
        <li>
          <span>Şu ana kadar geçen süre</span>
          <strong>23 ay</strong>
        </li>
        <li>
          <span>Kişilik metrikleri</span>
          <strong>hepsi 50 / 100</strong>
        </li>
        <li>
          <span>Karar düğümü</span>
          <strong>{TOTAL_NODES} adet</strong>
        </li>
      </ul>

      <div className={styles.rosterBlock}>
        <p className={styles.rosterHead}>
          Dramatis Personae <span>— yol boyunca karşılaşacakların</span>
        </p>
        <div className={styles.roster}>
          {ROSTER.map((id) => {
            const character = characterOf(id);
            if (!character) return null;
            return (
              <div key={id} className={styles.rosterItem} title={character.epithet}>
                <Figure id={id} size="md" />
                <span>{character.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <button type="button" className={styles.primaryBtn} onClick={onStart}>
        Yelken Aç
      </button>
    </section>
  );
}

/* ── Yolculuk haritası ──────────────────────────────────────────────────── */

function Voyage({ index }: { index: number }) {
  const position = ((Math.min(index, 5) + 0.5) / 6) * 100;
  return (
    <div className={styles.voyage} aria-label="Yolculuk haritası">
      <div className={styles.voyTrack}>
        <div className={styles.voyProgress} style={{ width: `${position}%` }} />
      </div>
      <span className={styles.voyShip} style={{ left: `${position}%` }} aria-hidden="true">
        <svg viewBox="0 0 30 22">
          <path d="M3 12h24l-4 7q-8 3-16 0z" />
          <path d="M15 12V2" />
          <path d="M16 4h7v7h-7z" />
        </svg>
      </span>
      <div className={styles.voyStops}>
        {VOYAGE_STOPS.map((stop, i) => (
          <span
            key={stop}
            className={[
              styles.voyStop,
              i < index ? styles.voyDone : "",
              i === index ? styles.voyNow : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <i />
            <b>{stop}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Sahne ──────────────────────────────────────────────────────────────── */

function SceneView({
  scene,
  reduced,
  chosenId,
  ready,
  onReady,
  onChoose,
}: {
  scene: Scene;
  reduced: boolean;
  chosenId: string | null;
  ready: boolean;
  onReady: () => void;
  onChoose: (id: string) => void;
}) {
  const prose = useMemo(() => scene.prose, [scene]);
  const { ref, skip } = useTypewriter(prose, 400, reduced, onReady);
  const cast = castOf(scene.nodeId);

  return (
    <>
      <section
        className={styles.card}
        onClick={skip}
        role="presentation"
      >
        <div className={styles.nodeHead}>
          <p className={styles.eyebrow}>{scene.eyebrow}</p>
          <div className={styles.progress} role="img" aria-label={scene.eyebrow}>
            {NODES.map((node, i) => (
              <span
                key={node.id}
                className={[
                  styles.dot,
                  scene.nodeId === node.id ? styles.dotNow : "",
                  NODES.findIndex((n) => n.id === scene.nodeId) > i ? styles.dotDone : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            ))}
          </div>
        </div>

        <h4 className={styles.title}>{scene.title}</h4>
        <p className={styles.place}>{scene.place}</p>

        <div className={styles.cast}>
          {cast.map((character, i) => (
            <div
              key={character.id}
              className={`${styles.castItem} ${i === 0 ? styles.castLead : ""}`}
              style={{ ["--i" as string]: i }}
            >
              <Figure
                id={character.id}
                size={i === 0 ? "lg" : "sm"}
                alive={i === 0}
                tone={i === 0 ? "canon" : undefined}
              />
              <span>
                <b>{character.name}</b>
                <i>{character.epithet}</i>
              </span>
            </div>
          ))}
        </div>

        <div className={styles.prose} ref={ref} />

        {!ready ? (
          <p className={styles.skipHint}>
            Anlatı yazılıyor… <strong>panele tıkla</strong> ile atla
          </p>
        ) : (
          <>
            <div className={styles.riskBox}>
              <p>Ölçülen riskler</p>
              <ul>
                {scene.risks.map((risk, i) => (
                  <li key={risk} style={{ ["--i" as string]: i }}>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
            {scene.whisper ? (
              <p
                className={styles.whisper}
                // Statik anlatıcı metni; yalnızca <em> içerir.
                dangerouslySetInnerHTML={{ __html: `☙ ${scene.whisper}` }}
              />
            ) : null}
          </>
        )}
      </section>

      {ready ? (
        <div className={styles.choiceArea}>
          <p className={styles.choicePrompt}>Karar anı — bir eylem seç:</p>
          <div className={`${styles.choices} ${chosenId ? styles.committing : ""}`}>
            {scene.choices.map((choice, i) => (
              <button
                key={choice.id}
                type="button"
                className={`${styles.choice} ${chosenId === choice.id ? styles.chosen : ""}`}
                style={{ ["--i" as string]: i }}
                onClick={(event) => {
                  event.stopPropagation();
                  onChoose(choice.id);
                }}
              >
                <span className={styles.choiceKey}>{GREEK_KEYS[i]}</span>
                <span className={styles.choiceBody}>
                  <span className={styles.choiceLabel}>{choice.label}</span>
                  <span className={styles.choiceHint}>{choice.hint}</span>
                  <span className={styles.choiceMeta}>
                    <span className={`${styles.tag} ${TAG_CLASS[choice.tag]}`}>
                      {TAG_LABEL[choice.tag]}
                    </span>
                    <span className={styles.unc}>
                      Belirsizlik
                      <span className={styles.uncDots}>
                        {[1, 2, 3, 4, 5].map((d) => (
                          <span key={d} className={d <= choice.uncertainty ? styles.uncOn : ""} />
                        ))}
                      </span>
                    </span>
                    <span className={styles.keyHint}>{i + 1}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ── Sonuç ──────────────────────────────────────────────────────────────── */

function OutcomeView({
  entry,
  canonRecord,
  reduced,
  finished,
  onAdvance,
}: {
  entry: LogEntry;
  canonRecord: CanonRecord;
  reduced: boolean;
  finished: boolean;
  onAdvance: () => void;
}) {
  const outcome = useMemo(() => narrateOutcome(entry), [entry]);
  const prose = useMemo(() => outcome.prose, [outcome]);
  const { ref, skip } = useTypewriter(prose, 520, reduced);

  const leadId = entry.fatal ? "crew" : (NODE_CAST[entry.nodeId]?.[0] ?? "odysseus");
  const heavy = entry.applied.crew <= -25 || entry.fatal;
  const same = entry.choiceId === canonRecord.canon_choice_id;

  const diceValue = entry.roll ?? entry.fatalRoll;
  const diceHit = entry.roll !== null ? entry.varianceFired : entry.fatal;
  const diceText =
    entry.roll === null
      ? entry.fatal
        ? "Ölüm zarı tuttu — destan burada kesildi."
        : "Ölüm zarı boşa düştü, hayattasın."
      : (entry.varianceFired
          ? "Varyans tetiklendi: beklenmeyen kalem geldi."
          : "Varyans tetiklenmedi, plan tuttu.") +
        (entry.fatalRoll !== null
          ? entry.fatal
            ? " Ölüm zarı da tuttu."
            : " Ölüm zarı boşa düştü."
          : "");

  return (
    <section
      className={`${styles.card} ${styles.outcomeCard} ${heavy && !reduced ? styles.shake : ""}`}
      onClick={skip}
      role="presentation"
    >
      <p className={styles.eyebrow}>Sonuç · Durum güncellemesi</p>
      <div className={styles.outcomeHead}>
        <Figure id={leadId} size="sm" alive tone="canon" />
        <h4 className={styles.outcomeTitle}>{outcome.title}</h4>
      </div>

      <div className={styles.prose} ref={ref} />

      <ul className={styles.deltaList}>
        {METRIC_ROWS.filter((row) => entry.applied[row.key]).map((row, i) => {
          const value = entry.applied[row.key];
          const tone = toneOf(row.key, value);
          return (
            <li
              key={row.key}
              className={[
                styles.delta,
                tone === "up" ? styles.deltaPos : tone === "down" ? styles.deltaNeg : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ ["--i" as string]: i }}
            >
              <span>{row.label}</span>
              <b>{value > 0 ? `+${value}` : value}</b>
            </li>
          );
        })}
      </ul>

      {diceValue !== null ? (
        <div className={styles.diceRow}>
          <Dice value={diceValue} hit={diceHit} reduced={reduced} />
          <span className={styles.diceText}>{diceText}</span>
        </div>
      ) : null}

      <details className={styles.canonReveal}>
        <summary>
          Odysseus burada ne yapmıştı? <span>(canon verisi)</span>
        </summary>
        <p>
          <strong>Orijinal karar:</strong> {canonRecord.canon_choice}
        </p>
        <p>
          <strong>Orijinal sonuç:</strong> {canonRecord.canon_summary}
        </p>
        <p className={same ? styles.verdictMatch : styles.verdictDiverge}>
          {same
            ? "✓ Odysseus ile aynı hattı seçtin."
            : "↯ Destan bu düğümde ikiye ayrıldı."}
        </p>
        <pre>{JSON.stringify(canonRecord.canon_effects, null, 2)}</pre>
      </details>

      <button
        type="button"
        className={styles.primaryBtn}
        onClick={(event) => {
          event.stopPropagation();
          onAdvance();
        }}
      >
        {finished ? "KPI Raporunu Aç" : "Yola Devam"}
      </button>
    </section>
  );
}

/* ── KPI raporu ─────────────────────────────────────────────────────────── */

function ReportView({
  report,
  reduced,
  onRestart,
  onCopy,
  copied,
}: {
  report: Report;
  reduced: boolean;
  onRestart: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <section className={styles.report}>
      <div className={styles.reportHead}>
        <p className={styles.eyebrow}>Destanî A/B testi sonuç raporu</p>
        <div className={styles.duel}>
          <div className={`${styles.duelSide} ${styles.duelPlayer}`}>
            <Figure id="odysseus" size="lg" alive tone="player" />
            <span>Senin Odysseus&apos;un</span>
          </div>
          <span className={styles.duelVs}>A / B</span>
          <div className={`${styles.duelSide} ${styles.duelCanon}`}>
            <Figure id="odysseus" size="lg" alive tone="canon" />
            <span>Homeros&apos;un Odysseus&apos;u</span>
          </div>
        </div>
        <p className={styles.profileLabel}>Liderlik profili</p>
        <p className={styles.profileTitle}>“{report.profile.title}”</p>
        <p className={styles.profileSub}>
          {report.profile.subtitle} {report.epilogue}
        </p>
      </div>

      <div className={styles.tiles}>
        {report.tiles.map((tile, i) => (
          <article key={tile.label} className={styles.tile} style={{ ["--i" as string]: i }}>
            <p className={styles.tileLabel}>{tile.label}</p>
            <p className={styles.tileValue}>{tile.value}</p>
            <p
              className={[
                styles.tileDelta,
                tile.dir === "good" ? styles.tileGood : tile.dir === "bad" ? styles.tileBad : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span aria-hidden="true">
                {tile.dir === "good" ? "▲" : tile.dir === "bad" ? "▼" : "="}
              </span>{" "}
              {tile.delta}
            </p>
          </article>
        ))}
      </div>

      <div className={styles.panel}>
        <h4 className={styles.panelTitle}>Kişilik metrikleri: oyuncu vs. Odysseus</h4>
        <p className={styles.panelSub}>
          0–100 ölçeğinde nihai değerler. Yüzdeler orijinal destana göre farkı gösterir.
        </p>
        <div className={styles.legend}>
          <span>
            <i className={styles.swPlayer} /> Senin yolculuğun
          </span>
          <span>
            <i className={styles.swCanon} /> Odysseus (canon)
          </span>
        </div>
        <div className={styles.bars}>
          {report.metrics.map((metric, i) => (
            <div key={metric.key} className={styles.barGroup}>
              <div className={styles.barHead}>
                <span>{metric.label}</span>
                <b>{metric.phrase}</b>
              </div>
              <Bar value={metric.player} kind="player" reduced={reduced} delayIndex={i} />
              <Bar value={metric.canon} kind="canon" reduced={reduced} delayIndex={i} />
            </div>
          ))}
        </div>

        <details className={styles.tableView}>
          <summary>Tabloyu göster</summary>
          <div className={styles.tableScroll}>
            <table>
              <thead>
                <tr>
                  <th>Metrik</th>
                  <th>Sen</th>
                  <th>Odysseus</th>
                  <th>Fark</th>
                </tr>
              </thead>
              <tbody>
                {report.metrics.map((metric) => (
                  <tr key={metric.key}>
                    <th scope="row">{metric.label}</th>
                    <td>{metric.player}</td>
                    <td>{metric.canon}</td>
                    <td>
                      {metric.pct > 0 ? "+" : ""}
                      {metric.pct}%
                    </td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">
                    {METRICS.find((m) => m.key === "wrath")?.label ?? "Tanrıların gazabı"}
                  </th>
                  <td>{report.wrath.player}</td>
                  <td>{report.wrath.canon}</td>
                  <td>
                    {pctDiff(report.wrath.player, report.wrath.canon) > 0 ? "+" : ""}
                    {pctDiff(report.wrath.player, report.wrath.canon)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </div>

      <div className={styles.panel}>
        <h4 className={styles.panelTitle}>Karar karar karşılaştırma</h4>
        <p className={styles.panelSub}>Beş kader düğümünde senin hattın ile canon hattı.</p>
        <div className={styles.tableScroll}>
          <table>
            <thead>
              <tr>
                <th>Düğüm</th>
                <th>Senin kararın</th>
                <th>Odysseus&apos;un kararı</th>
                <th>Adam</th>
                <th>Ay</th>
                <th>Hat</th>
              </tr>
            </thead>
            <tbody>
              {report.decisions.map((row) => (
                <tr key={row.nodeId}>
                  <th scope="row">{row.node}</th>
                  <td>{row.player}</td>
                  <td className={styles.canonCell}>{row.canon}</td>
                  <td>
                    <span className={styles.pair}>
                      <span>{row.playerCrew === null ? "—" : row.playerCrew}</span>
                      <span>{row.canonCrew}</span>
                    </span>
                  </td>
                  <td>
                    <span className={styles.pair}>
                      <span>
                        {row.playerMonths === null
                          ? "—"
                          : row.playerMonths > 0
                            ? `+${row.playerMonths}`
                            : row.playerMonths}
                      </span>
                      <span>
                        {row.canonMonths > 0 ? `+${row.canonMonths}` : row.canonMonths}
                      </span>
                    </span>
                  </td>
                  <td>
                    <span className={row.same ? styles.pillMatch : styles.pillDiverge}>
                      {row.same ? "aynı" : "ayrıldı"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.panel}>
        <h4 className={styles.panelTitle}>Analist notu</h4>
        <p className={styles.summaryLine}>{report.summary}</p>
        {report.notes.map((note) => (
          <div key={note.nodeId} className={styles.note}>
            <p className={styles.noteNode}>
              {note.node}
              {note.same ? <span className={styles.pillMatch}>canon</span> : null}
            </p>
            {/* Statik analist metni; yalnızca <em>/<strong> içerir. */}
            <p dangerouslySetInnerHTML={{ __html: note.text }} />
          </div>
        ))}
        <p className={styles.seedLine}>
          Simülasyon tohumu <code>{report.seed}</code> — aynı tohum aynı zarları verir.
        </p>
      </div>

      <div className={styles.reportCta}>
        <button type="button" className={styles.primaryBtn} onClick={onRestart}>
          Destanı Yeniden Yaz
        </button>
        <button type="button" className={styles.ghostBtn} onClick={onCopy}>
          {copied ? "Kopyalandı ✓" : "Raporu kopyala"}
        </button>
      </div>
    </section>
  );
}
