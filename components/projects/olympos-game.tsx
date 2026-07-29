"use client";

// Olympos Sosyal Ağı — render katmanı.
//
// Oyun mantığı lib/olympos altındaki motor modüllerinde (graph.ts + engine.ts);
// bu bileşen sadece durumu gösterir ve eylemleri motora iletir. Motor tamamen
// istemcide çalıştığı için sunucu, ağ isteği veya cold start yok.
//
// Arayüz 7 yaşındaki bir oyuncu için tasarlandı: sayılar yerine resim, hikâye ve
// tek bir "şunu yap" yönlendirmesi. Gerçek graf matematiği «Büyükler için»
// panelinin arkasında duruyor.

import { useState } from "react";
import {
  ActionError,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  GameEngine,
} from "@/lib/olympos/engine";
import { MAP_HEIGHT, MAP_WIDTH, positionOf } from "@/lib/olympos/layout";
import type {
  ActionName,
  Difficulty,
  EdgeType,
  GameView,
  Hint,
  NodeStatus,
  RankedMove,
  ViewNode,
} from "@/lib/olympos/types";
import styles from "./olympos-game.module.css";

const FACE: Record<NodeStatus, string> = { Ally: "😀", Enemy: "😠", Neutral: "😐" };
const STATUS_WORD: Record<NodeStatus, string> = {
  Ally: "Arkadaşın",
  Enemy: "Sana kızgın",
  Neutral: "Kararsız",
};
const STATUS_CLASS: Record<NodeStatus, string> = {
  Ally: styles.statusTextAlly,
  Enemy: styles.statusTextEnemy,
  Neutral: styles.statusTextNeutral,
};
const STORY_ICON: Record<string, string> = {
  player: "🤝",
  poseidon: "🔱",
  system: "📜",
};

/** Aracılık gücünü çocuk diline çevir: 1–5 yıldız. */
const importanceStars = (betweenness: number) =>
  Math.max(1, Math.min(5, Math.round(betweenness * 14) + 1));

const bolts = (n: number) => "⚡".repeat(Math.max(0, Math.min(n, 12)));

/** Seçili karakterin panelde gösterilecek hâli. */
interface Detail {
  node: ViewNode;
  actions: ReturnType<GameEngine["availableActions"]>;
  neighbors: Array<{ id: string; name: string; emoji: string; type: EdgeType }>;
}

/**
 * Tek bir render'ın ihtiyaç duyduğu her şey.
 *
 * Motor bilerek `useRef` içinde DEĞİL: ref'i render sırasında okumak React
 * Compiler kurallarını ihlal ediyor ve eşzamanlı render'da güvensiz. Motor
 * mutable olduğu için her eylemden sonra yeni bir snapshot nesnesi üretiyoruz;
 * React değişikliği nesne kimliğinden görüyor, motorun içini gözetlemesi
 * gerekmiyor.
 */
interface Snapshot {
  engine: GameEngine;
  view: GameView;
  hint: Hint;
  detail: Detail | null;
  selected: string | null;
  startFriction: number;
}

function buildDetail(engine: GameEngine, view: GameView, id: string): Detail | null {
  const node = view.nodes.find((n) => n.id === id);
  if (!node) return null;
  return {
    node,
    actions: engine.availableActions(id),
    neighbors: engine.network.neighbors(id).map((nb) => {
      const other = engine.network.node(nb);
      return {
        id: nb,
        name: other.name,
        emoji: other.emoji,
        type: engine.network.edge(id, nb)!.type,
      };
    }),
  };
}

function snapshot(
  engine: GameEngine,
  selected: string | null,
  startFriction: number,
): Snapshot {
  const view = engine.view();
  return {
    engine,
    view,
    hint: engine.hint(),
    detail: selected ? buildDetail(engine, view, selected) : null,
    selected,
    startFriction,
  };
}

function newGame(difficulty: Difficulty): Snapshot {
  const engine = new GameEngine(difficulty);
  return snapshot(engine, null, engine.frictionScore);
}

export default function OlymposGame() {
  // Lazy initializer: oyun bir kez kurulur, effect içinde setState yok.
  const [snap, setSnap] = useState<Snapshot>(() => newGame(DEFAULT_DIFFICULTY));
  const [error, setError] = useState<string | null>(null);
  const [intro, setIntro] = useState(true);
  const [scholarOpen, setScholarOpen] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const [via, setVia] = useState("");

  const { view, hint, detail } = snap;

  const boot = (difficulty: Difficulty) => {
    setError(null);
    setVia("");
    setSnap(newGame(difficulty));
  };

  const select = (id: string | null) =>
    setSnap(snapshot(snap.engine, id, snap.startFriction));

  /**
   * Eylemi uygular. Motor mutasyonu bilerek setState updater'ının DIŞINDA:
   * updater'lar saf olmalı ve StrictMode onları iki kez çağırıyor — içeride
   * mutasyon yapmak hamleyi iki kez oynatırdı.
   */
  const run = (action: ActionName, nodeId: string, broker?: string) => {
    const { engine, startFriction } = snap;
    try {
      engine.act(action, nodeId, broker);
      setError(null);
      setVia("");
    } catch (err) {
      setError(err instanceof ActionError ? err.message : String(err));
    }
    setSnap(snapshot(engine, nodeId, startFriction));
  };

  const doIt = (move: RankedMove) => run(move.action, move.nodeId);

  const endTurn = () => {
    const { engine, selected, startFriction } = snap;
    engine.endTurn();
    setError(null);
    setSnap(snapshot(engine, selected, startFriction));
  };

  if (!view) {
    return <div className={styles.root}>🏛️ Olympos hazırlanıyor…</div>;
  }

  const span = Math.max(1, snap.startFriction);
  const progress = Math.round(
    Math.max(0, Math.min(100, ((span - view.friction.score) / span) * 100)),
  );
  const waves = Math.max(0, Math.ceil(view.friction.score / 3));
  const daysLeft = Math.max(0, view.maxTurns - view.turn);
  const finished = view.status !== "playing";
  const nodeById = new Map(view.nodes.map((n) => [n.id, n]));

  const playable = view.nodes
    .filter((n) => !n.isSource && !n.isTarget && n.reachable && n.status !== "Ally")
    .sort((a, b) => a.cheapestCost - b.cheapestCost);
  const locked = view.nodes.filter((n) => !n.isSource && !n.isTarget && !n.reachable);

  return (
    <div className={styles.root}>
      <div className={styles.shell}>
        {/* ── Üst tabela ─────────────────────────────────────────── */}
        <header className={styles.header}>
          <div className={styles.meander} aria-hidden="true" />
          <div className={styles.headerTop}>
            <h2 className={styles.title}>🏛️ Odysseus&apos;u Evine Götür</h2>
            <div className={styles.headerControls}>
              <label className={styles.difficulty}>
                Zorluk
                <select
                  value={view.difficulty}
                  onChange={(event) => boot(event.target.value as Difficulty)}
                >
                  <option value="kolay">😊 {DIFFICULTIES.kolay.label}</option>
                  <option value="kahraman">💪 {DIFFICULTIES.kahraman.label}</option>
                </select>
              </label>
              <button type="button" onClick={() => boot(view.difficulty)}>
                🔄 Baştan
              </button>
            </div>
          </div>

          <p className={styles.quest}>
            Poseidon 🔱 denizi kapattı. <strong>Arkadaş toplayarak</strong> eve giden
            yolu aç!
          </p>

          <div className={styles.voyage}>
            <div className={styles.voyageTrack}>
              <div className={styles.voyageDone} style={{ width: `${progress}%` }} />
              <span className={styles.voyageShip} style={{ left: `${progress}%` }}>
                🚢
              </span>
              <span className={styles.voyageHome}>🏠</span>
            </div>
            <p className={styles.voyageLabel}>
              Eve giden yol <strong>%{progress}</strong> açık
              {waves > 0 ? (
                <span className={styles.waves}>
                  {" "}
                  · önünde {waves} dalga var {"🌊".repeat(Math.min(waves, 10))}
                </span>
              ) : (
                <span className={styles.wavesClear}> · yol tamamen açık! 🎉</span>
              )}
            </p>
          </div>

          <div className={styles.headerBottom}>
            <div className={styles.resource}>
              <span className={styles.resourceName}>Gücün</span>
              <span className={styles.bolts}>
                {Array.from({ length: Math.min(view.apPerTurn, 12) }, (_, index) => (
                  <span key={index} className={index < view.ap ? undefined : styles.spent}>
                    ⚡
                  </span>
                ))}
              </span>
              <span className={styles.resourceCount}>{view.ap}</span>
            </div>
            <div className={styles.resource}>
              <span className={styles.resourceName}>Zaman</span>
              <span>☀️</span>
              <span className={styles.resourceCount}>{daysLeft} gün kaldı</span>
            </div>
            <button
              type="button"
              className={styles.dayButton}
              onClick={endTurn}
              disabled={finished}
            >
              🌙 Günü Bitir
            </button>
          </div>
        </header>

        {/* ── Sahne ──────────────────────────────────────────────── */}
        <main className={styles.stage}>
          <div className={styles.stageColumn}>
            {/* Harita: sabit yerleşimli SVG — her düğüm gerçek bir düğme,
                yani klavyeyle de gezilebilir. */}
            <div className={styles.map}>
              <svg
                className={styles.mapSvg}
                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                role="group"
                aria-label="Olympos sosyal ağ haritası"
              >
                {view.edges.map((edge) => {
                  const a = positionOf(edge.source);
                  const b = positionOf(edge.target);
                  const classes = [styles.edge];
                  if (edge.type === "Enmity") classes.push(styles.edgeEnmity);
                  if (edge.synthetic) classes.push(styles.edgeLobby);
                  if (edge.onPath) classes.push(styles.edgeOnPath);
                  return (
                    <g key={edge.id}>
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        className={classes.join(" ")}
                      />
                      {showNumbers && (
                        <text
                          x={(a.x + b.x) / 2}
                          y={(a.y + b.y) / 2 - 4}
                          className={styles.nodeName}
                          style={{ fontSize: 11 }}
                        >
                          {edge.weight}
                        </text>
                      )}
                    </g>
                  );
                })}

                {view.nodes.map((node) => {
                  const { x, y } = positionOf(node.id);
                  const endpoint = node.isSource || node.isTarget;
                  const radius = endpoint ? 30 : 26;
                  const classes = [styles.nodeGroup];
                  classes.push(
                    node.status === "Ally"
                      ? styles.statusAlly
                      : node.status === "Enemy"
                        ? styles.statusEnemy
                        : styles.statusNeutral,
                  );
                  if (endpoint) classes.push(styles.endpoint);
                  if (node.suppression > 0) classes.push(styles.asleep);
                  if (node.onPath) classes.push(styles.nodeOnPath);
                  if (snap.selected === node.id) classes.push(styles.selected);
                  return (
                    <g
                      key={node.id}
                      className={classes.join(" ")}
                      transform={`translate(${x} ${y})`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${node.name} — ${STATUS_WORD[node.status]}`}
                      onClick={() => select(node.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          select(node.id);
                        }
                      }}
                    >
                      <circle className={styles.nodeCircle} r={radius} />
                      <text className={styles.nodeEmoji} y={2}>
                        {node.emoji}
                      </text>
                      <text className={styles.nodeName} y={radius + 18}>
                        {node.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className={styles.legend}>
                <span>😀 arkadaş</span>
                <span>😠 kötü</span>
                <span>😐 kararsız</span>
                <span>😴 uykuda</span>
                <span>
                  <i className={styles.legendRoad} /> eve giden yol
                </span>
              </div>
            </div>

            {/* Dokunma rafı */}
            <section className={styles.tray}>
              <h3>
                👋 Şimdi bunlarla konuşabilirsin <small>en ucuzdan pahalıya</small>
              </h3>
              <div className={styles.trayRow}>
                {playable.length === 0 && (
                  <p className={styles.trayEmpty}>
                    Şu an konuşulacak yeni kimse yok — «Günü Bitir»e bas.
                  </p>
                )}
                {playable.map((node) => (
                  <button
                    type="button"
                    key={node.id}
                    className={[
                      styles.chip,
                      snap.selected === node.id ? styles.chipOn : "",
                      node.status === "Enemy" ? styles.chipEnemy : styles.chipAlly,
                    ].join(" ")}
                    onClick={() => select(node.id)}
                  >
                    <span className={styles.chipEmoji}>{node.emoji}</span>
                    <span className={styles.chipName}>
                      {node.name} {FACE[node.status]}
                    </span>
                    <span className={styles.chipCost}>{bolts(node.cheapestCost)}</span>
                  </button>
                ))}
              </div>

              {locked.length > 0 && (
                <details className={styles.trayLocked}>
                  <summary>🔒 Henüz ulaşamadığın {locked.length} kişi</summary>
                  <div className={styles.trayRow}>
                    {locked.map((node) => (
                      <button
                        type="button"
                        key={node.id}
                        className={[styles.chip, styles.chipLocked].join(" ")}
                        onClick={() => select(node.id)}
                      >
                        <span className={styles.chipEmoji}>{node.emoji}</span>
                        <span className={styles.chipName}>{node.name}</span>
                      </button>
                    ))}
                  </div>
                  <p className={styles.trayTip}>
                    Bunlara ulaşmak için önce onların bir tanıdığını arkadaş yapmalısın.
                  </p>
                </details>
              )}
            </section>
          </div>

          {/* ── Sağ kolon ─────────────────────────────────────────── */}
          <div className={styles.stageColumn}>
            <section className={styles.advisor}>
              <div className={styles.advisorHead}>
                <span className={styles.owl}>🦉</span>
                <h3>Athena diyor ki</h3>
              </div>
              {!hint ? (
                <p className={styles.advisorText}>Athena düşünüyor…</p>
              ) : (
                <>
                  <p className={styles.advisorText}>{hint.text}</p>
                  {hint.kind === "move" && hint.move && (
                    <>
                      <button
                        type="button"
                        className={styles.doitButton}
                        onClick={() => doIt(hint.move!)}
                      >
                        <span className={styles.doitIcon}>{hint.move.icon}</span>
                        <span className={styles.doitLabel}>
                          {hint.move.emoji} {hint.move.name} ile «{hint.move.kidLabel}»
                        </span>
                        <span className={styles.doitCost}>{bolts(hint.move.cost)}</span>
                      </button>
                      <button
                        type="button"
                        className={styles.lookButton}
                        onClick={() => select(hint.move!.nodeId)}
                      >
                        👀 Önce bu kişiye bakalım
                      </button>
                    </>
                  )}
                  {hint.alternatives.length > 0 && (
                    <div className={styles.alts}>
                      <h4>Başka fikirler</h4>
                      <ul>
                        {hint.alternatives.map((alt) => (
                          <li key={`${alt.action}-${alt.nodeId}`}>
                            <button type="button" onClick={() => select(alt.nodeId)}>
                              {alt.emoji} {alt.name} → {alt.icon} {alt.kidLabel}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Karakter kartı */}
            {!detail ? (
              <section className={[styles.card, styles.cardEmpty].join(" ")}>
                <h3>👆 Birine dokun</h3>
                <p>
                  Haritadaki bir yüze ya da yukarıdaki kartlardan birine dokun; kim
                  olduğunu ve ne yapabileceğini burada anlatayım.
                </p>
              </section>
            ) : (
              <section className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.cardFace}>{detail.node.emoji}</span>
                  <div>
                    <h3>{detail.node.name}</h3>
                    <p className={[styles.cardStatus, STATUS_CLASS[detail.node.status]].join(" ")}>
                      {FACE[detail.node.status]} {STATUS_WORD[detail.node.status]}
                      {detail.node.suppression > 0 && <span> · 😴 uykuda</span>}
                    </p>
                  </div>
                </div>

                <p className={styles.cardNote}>{detail.node.kidNote}</p>

                <p className={styles.cardPower}>
                  Ağdaki gücü:{" "}
                  {"⭐".repeat(importanceStars(detail.node.betweenness))}
                  <span className={styles.starsOff}>
                    {"☆".repeat(5 - importanceStars(detail.node.betweenness))}
                  </span>
                </p>

                {error && <p className={styles.cardError}>🚫 {error}</p>}

                <div className={styles.cardActions}>
                  {detail.actions.map((action) => (
                    <div key={action.action}>
                      <button
                        type="button"
                        className={styles.actButton}
                        disabled={!action.enabled || finished}
                        onClick={() =>
                          run(
                            action.action,
                            detail.node.id,
                            action.action === "reroute" ? via || undefined : undefined,
                          )
                        }
                      >
                        <span className={styles.actIcon}>{action.icon}</span>
                        <span className={styles.actName}>{action.kidLabel}</span>
                        <span className={styles.actCost}>{bolts(action.cost)}</span>
                      </button>
                      {!action.enabled && (
                        <small className={styles.actWhy}>{action.reason}</small>
                      )}
                      {action.action === "reroute" &&
                        action.enabled &&
                        (action.viaOptions?.length ?? 0) > 0 && (
                          <select
                            value={via}
                            onChange={(event) => setVia(event.target.value)}
                            style={{ marginTop: 8 }}
                          >
                            <option value="">Kimin yardımıyla? (kendim seçme)</option>
                            {action.viaOptions!.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.emoji} {option.name} yardım etsin
                              </option>
                            ))}
                          </select>
                        )}
                    </div>
                  ))}
                </div>

                <h4>Tanıdıkları</h4>
                <ul className={styles.friends}>
                  {detail.neighbors.map((nb) => (
                    <li key={nb.id}>
                      <span className={styles.friendEmoji}>{nb.emoji}</span>
                      <span>{nb.name}</span>
                      <span
                        className={
                          nb.type === "Enmity" ? styles.bondEnmity : styles.bondSupport
                        }
                      >
                        {nb.type === "Enmity" ? "💢 kavgalı" : "💚 dost"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </main>

        {/* ── Hikâye şeridi ──────────────────────────────────────── */}
        <section className={styles.storyLog}>
          <h3>📜 Hikâyemiz</h3>
          <ul>
            {view.log.map((entry, index) => (
              <li
                key={`${entry.turn}-${index}`}
                className={
                  entry.actor === "player"
                    ? styles.storyPlayer
                    : entry.actor === "poseidon"
                      ? styles.storyPoseidon
                      : styles.storySystem
                }
              >
                <span className={styles.storyIcon}>{STORY_ICON[entry.actor]}</span>
                <span className={styles.storyDay}>{entry.turn}. gün</span>
                <span>{entry.message}</span>
                {entry.frictionDelta < 0 && (
                  <span className={styles.storyGood}>yol açıldı 👍</span>
                )}
                {entry.frictionDelta > 0 && (
                  <span className={styles.storyBad}>yol zorlaştı 👎</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Büyükler için ──────────────────────────────────────── */}
        <section className={styles.scholar}>
          <button
            type="button"
            className={styles.scholarToggle}
            onClick={() => setScholarOpen((value) => !value)}
            aria-expanded={scholarOpen}
          >
            {scholarOpen ? "▾" : "▸"} 🔍 Büyükler için: graf matematiği
          </button>
          {scholarOpen && (
            <div className={styles.scholarBody}>
              <label className={styles.scholarSwitch}>
                <input
                  type="checkbox"
                  checked={showNumbers}
                  onChange={(event) => setShowNumbers(event.target.checked)}
                />
                Harita üzerinde kenar ağırlıklarını göster
              </label>

              <div className={styles.scholarGrid}>
                <div>
                  <h4>Friction Score</h4>
                  <p className={styles.formula}>
                    D = {view.friction.pathWeight.toFixed(2)} (en kısa yol) +{" "}
                    {view.friction.centralityPenalty.toFixed(2)} (düşman merkeziyet
                    cezası) − {view.friction.threshold} (eşik) =
                    <strong className={view.friction.score <= 0 ? styles.ok : styles.bad}>
                      {" "}
                      {view.friction.score.toFixed(2)}
                    </strong>
                  </p>
                  <p className={styles.scholarNote}>
                    Galibiyet: D ≤ 0 ya da Odysseus–İthaka arasında doğrudan Support
                    kenarı.
                  </p>
                </div>

                <div>
                  <h4>En kısa yol (Dijkstra)</h4>
                  <p className={styles.formula}>
                    {view.friction.path
                      .map((id) => nodeById.get(id)?.name ?? id)
                      .join(" → ")}
                  </p>
                </div>

                <div>
                  <h4>Düşman merkeziyet cezası</h4>
                  {view.friction.penaltyBreakdown.length === 0 ? (
                    <p className={styles.scholarNote}>Ceza kalmadı.</p>
                  ) : (
                    <ul className={styles.scholarList}>
                      {view.friction.penaltyBreakdown.map((row) => (
                        <li key={row.id}>
                          <button type="button" onClick={() => select(row.id)}>
                            {row.name}
                          </button>
                          <code>
                            BC {row.betweenness.toFixed(4)} × (1−{row.suppression}) ×{" "}
                            {row.multiplier} × 45 = +{row.penalty.toFixed(2)}
                          </code>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h4>Betweenness centrality (ağırlıklı)</h4>
                  <ul className={styles.scholarList}>
                    {[...view.nodes]
                      .sort((a, b) => b.betweenness - a.betweenness)
                      .slice(0, 8)
                      .map((node) => (
                        <li key={node.id}>
                          <button type="button" onClick={() => select(node.id)}>
                            {node.name}
                          </button>
                          <code>{node.betweenness.toFixed(4)}</code>
                        </li>
                      ))}
                  </ul>
                </div>

                <div>
                  <h4>Graf metrikleri</h4>
                  <p className={styles.formula}>
                    düğüm {view.nodes.length} · kenar {view.edges.length} · yoğunluk{" "}
                    {view.density.toFixed(4)} · bileşen {view.components} · köprü{" "}
                    {view.bridgeCount}
                  </p>
                  <p className={styles.scholarNote}>
                    Bu değerler Python/NetworkX referans uygulamasıyla birebir aynı
                    (1e-9 toleransta doğrulandı).
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Papirüs kartları ───────────────────────────────────── */}
        {intro && (
          <div className={styles.overlay}>
            <div className={styles.scroll}>
              <h3>🏛️ Odysseia</h3>
              <p className={styles.scrollLead}>
                Odysseus savaştan dönüyor ama denizlerin tanrısı{" "}
                <strong>Poseidon 🔱</strong> ona çok kızgın ve yolu kapattı.
              </p>
              <ul className={styles.scrollRules}>
                <li>
                  🤝 <strong>Arkadaş topla.</strong> Bir tanrı ya da insan arkadaşın
                  olursa eve giden yol biraz daha açılır.
                </li>
                <li>
                  😴 <strong>Kötüleri uyut.</strong> Uyuyan bir canavar sana engel
                  olamaz.
                </li>
                <li>
                  ⚡ <strong>Gücünü harca.</strong> Her gün şimşek gücün yenilenir.
                </li>
                <li>
                  🦉 <strong>Takılırsan Athena&apos;ya bak.</strong> Sana her zaman ne
                  yapacağını söyler.
                </li>
              </ul>
              <button
                type="button"
                className={styles.startButton}
                onClick={() => setIntro(false)}
              >
                ⛵ Hadi başlayalım!
              </button>
            </div>
          </div>
        )}

        {finished && !intro && (
          <div className={styles.overlay}>
            <div className={styles.scroll}>
              <h3>{view.status === "won" ? "🎉 Eve Vardık!" : "🌊 Deniz Kapalı Kaldı"}</h3>
              <p className={styles.scrollLead}>
                {view.status === "won"
                  ? "Odysseus arkadaşlarının yardımıyla İthaka’ya döndü. Penelope ve Telemachos onu bekliyordu!"
                  : "Günler bitti ve Poseidon denizi açmadı. Bir daha denesek mi?"}
              </p>
              <button
                type="button"
                className={styles.startButton}
                onClick={() => boot(view.difficulty)}
              >
                🔄 Yeniden oyna
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
