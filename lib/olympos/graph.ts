// Olympos — graf motoru (Data & Network Engine katmanı).
//
// Bu modül, projenin Python/NetworkX referans uygulamasının birebir portudur:
// ağırlıklı Dijkstra en kısa yol, ağırlıklı betweenness centrality (Brandes)
// ve Friction Score. Sayısal sonuçlar NetworkX ile aynı olmak zorunda —
// lib/olympos/__tests__ içindeki fixture bunu referans değerlerle doğrular.
//
// Oyun kuralları burada YOK; onlar engine.ts içinde.

import raw from "./mythology-graph.json";
import type {
  Edge,
  EdgeType,
  FrictionReport,
  GraphData,
  Node,
  NodeStatus,
  PenaltyRow,
} from "./types";

export const MIN_EDGE_WEIGHT = 0.5;

const DATA = raw as unknown as GraphData;

/** Kenarın yönsüz anahtarı — komşuluk sözlüğü için. */
const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export class OlymposNetwork {
  nodes = new Map<string, Node>();
  edges = new Map<string, Edge>();
  /** komşuluk: düğüm → komşu id kümesi */
  adj = new Map<string, Set<string>>();

  /**
   * Türetilmiş değerler için önbellek.
   *
   * Buna ihtiyaç var çünkü "Athena'nın Öğüdü" ~60 aday hamleyi simüle ediyor ve
   * her hamle friction'ı birkaç kez okuyor. Önbelleksiz hâlde betweenness
   * yüzlerce kez hesaplanıyor ve öğüt ~1 saniye sürüyordu — bir çocuk oyununda
   * ana düğmenin o kadar süre kaybolması kabul edilemez.
   *
   * `dirty()` her mutasyonda çağrılır; başka geçersizleme yolu yok.
   */
  private cacheBetweenness: Map<string, number> | null = null;
  private cacheFriction: FrictionReport | null = null;

  private dirty(): void {
    this.cacheBetweenness = null;
    this.cacheFriction = null;
  }

  readonly source: string;
  readonly target: string;
  readonly victoryThreshold: number;
  readonly penaltyCoefficient: number;
  readonly apPerTurn: number;
  readonly maxTurns: number;
  readonly title: string;
  readonly subtitle: string;

  constructor() {
    const meta = DATA.meta;
    this.source = meta.source;
    this.target = meta.target;
    this.victoryThreshold = meta.victory_threshold;
    this.penaltyCoefficient = meta.centrality_penalty_coefficient;
    this.apPerTurn = meta.ap_per_turn;
    this.maxTurns = meta.max_turns;
    this.title = meta.title;
    this.subtitle = meta.subtitle;
    this.reset();
  }

  /** Grafı JSON'daki başlangıç durumuna döndürür. */
  reset(): void {
    this.dirty();
    this.nodes = new Map();
    this.edges = new Map();
    this.adj = new Map();

    for (const node of DATA.nodes) {
      this.nodes.set(node.id, {
        id: node.id,
        name: node.name,
        type: node.type,
        influenceCost: node.influence_cost,
        status: node.status as NodeStatus,
        baseStatus: node.status as NodeStatus,
        epithet: node.epithet,
        description: node.description,
        emoji: node.emoji,
        kidNote: node.kid_note,
        penaltyMultiplier: node.penalty_multiplier ?? 1,
        suppression: 0,
        neutralizeCount: 0,
        persuaded: false,
      });
      this.adj.set(node.id, new Set());
    }

    for (const edge of DATA.edges) {
      this.addEdge({
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        baseWeight: edge.weight,
        type: edge.type as EdgeType,
        baseType: edge.type as EdgeType,
        label: edge.label,
        synthetic: false,
        lobbied: false,
      });
    }
  }

  private addEdge(edge: Edge): void {
    this.edges.set(key(edge.source, edge.target), edge);
    this.adj.get(edge.source)!.add(edge.target);
    this.adj.get(edge.target)!.add(edge.source);
    this.dirty();
  }

  // ---------------------------------------------------------------- //
  // Sorgular
  // ---------------------------------------------------------------- //

  node(id: string): Node {
    const node = this.nodes.get(id);
    if (!node) throw new Error(`Bilinmeyen düğüm: ${id}`);
    return node;
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  edge(a: string, b: string): Edge | undefined {
    return this.edges.get(key(a, b));
  }

  hasEdge(a: string, b: string): boolean {
    return this.edges.has(key(a, b));
  }

  neighbors(id: string): string[] {
    return [...(this.adj.get(id) ?? [])];
  }

  allNodeIds(): string[] {
    return [...this.nodes.keys()];
  }

  allEdges(): Edge[] {
    return [...this.edges.values()];
  }

  nodesByStatus(status: NodeStatus): string[] {
    return this.allNodeIds().filter((id) => this.node(id).status === status);
  }

  weight(a: string, b: string): number {
    const edge = this.edge(a, b);
    if (!edge) throw new Error(`Kenar yok: ${a}–${b}`);
    return edge.weight;
  }

  // ---------------------------------------------------------------- //
  // En kısa yol (ağırlıklı Dijkstra)
  // ---------------------------------------------------------------- //

  /**
   * Dijkstra. `predecessor` haritası ve mesafeler döner.
   *
   * Not: 21 düğümlük bir graf için O(n²) tarama, binary heap'ten hızlıdır ve
   * kodu çok daha basit tutar — bu grafın boyutunda ölçeklenme sorunu yok.
   */
  private dijkstra(source: string): {
    dist: Map<string, number>;
    prev: Map<string, string | null>;
  } {
    const dist = new Map<string, number>();
    const prev = new Map<string, string | null>();
    const unvisited = new Set(this.allNodeIds());

    for (const id of unvisited) dist.set(id, Infinity);
    dist.set(source, 0);
    prev.set(source, null);

    while (unvisited.size > 0) {
      let current: string | null = null;
      let best = Infinity;
      for (const id of unvisited) {
        const d = dist.get(id)!;
        if (d < best) {
          best = d;
          current = id;
        }
      }
      if (current === null || best === Infinity) break;
      unvisited.delete(current);

      for (const nb of this.adj.get(current)!) {
        if (!unvisited.has(nb)) continue;
        const alt = best + this.weight(current, nb);
        if (alt < dist.get(nb)!) {
          dist.set(nb, alt);
          prev.set(nb, current);
        }
      }
    }
    return { dist, prev };
  }

  /** Ağırlıklı en kısa yol. Yol yoksa `[[], Infinity]`. */
  shortestPath(source?: string, target?: string): [string[], number] {
    const src = source ?? this.source;
    const dst = target ?? this.target;
    if (!this.hasNode(src) || !this.hasNode(dst)) return [[], Infinity];

    const { dist, prev } = this.dijkstra(src);
    const total = dist.get(dst)!;
    if (!Number.isFinite(total)) return [[], Infinity];

    const path: string[] = [];
    let cursor: string | null = dst;
    while (cursor !== null && cursor !== undefined) {
      path.unshift(cursor);
      cursor = prev.get(cursor) ?? null;
    }
    return [path, this.pathWeight(path)];
  }

  pathWeight(path: string[]): number {
    let total = 0;
    for (let i = 0; i + 1 < path.length; i++) total += this.weight(path[i], path[i + 1]);
    return total;
  }

  pathEdges(path: string[]): Array<[string, string]> {
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i + 1 < path.length; i++) pairs.push([path[i], path[i + 1]]);
    return pairs;
  }

  /** İki düğüm arasındaki ağırlıklı mesafe (yol yoksa Infinity). */
  distance(source: string, target: string): number {
    if (!this.hasNode(source) || !this.hasNode(target)) return Infinity;
    return this.dijkstra(source).dist.get(target) ?? Infinity;
  }

  /** Ağırlıksız adım sayısı (yol yoksa null). */
  hopDistance(source: string, target: string): number | null {
    if (!this.hasNode(source) || !this.hasNode(target)) return null;
    if (source === target) return 0;
    const seen = new Set([source]);
    let frontier = [source];
    let hops = 0;
    while (frontier.length > 0) {
      hops++;
      const next: string[] = [];
      for (const id of frontier) {
        for (const nb of this.adj.get(id)!) {
          if (nb === target) return hops;
          if (!seen.has(nb)) {
            seen.add(nb);
            next.push(nb);
          }
        }
      }
      frontier = next;
    }
    return null;
  }

  // ---------------------------------------------------------------- //
  // Centrality
  // ---------------------------------------------------------------- //

  /**
   * Ağırlıklı, normalize edilmiş betweenness centrality — Brandes algoritması.
   *
   * NetworkX ile birebir uyumlu olması için iki ayrıntı kritik:
   *  1. Kaynakların TAMAMI üzerinde toplanır, yani her (s,t) çifti iki kez
   *     sayılır (sıralı çiftler).
   *  2. Yönsüz + normalize durumunda ölçek 1/((n-1)(n-2)) — bu, sıralı
   *     toplamı sırasız çift sayısına böler ve sonucu [0,1] aralığına getirir.
   *
   * Eşit uzunluklu yollar (`alt === seen`) sigma'ya eklenir; bu graf ağırlıklı
   * olduğu için de eşitlikler oluşabiliyor, atlanamaz.
   */
  betweennessCentrality(): Map<string, number> {
    if (this.cacheBetweenness) return this.cacheBetweenness;
    const ids = this.allNodeIds();
    const betweenness = new Map<string, number>(ids.map((id) => [id, 0]));

    for (const s of ids) {
      // — Dijkstra tabanlı en kısa yol sayımı —
      const stack: string[] = [];
      const preds = new Map<string, string[]>(ids.map((id) => [id, []]));
      const sigma = new Map<string, number>(ids.map((id) => [id, 0]));
      const dist = new Map<string, number>();
      const seen = new Map<string, number>();
      sigma.set(s, 1);
      seen.set(s, 0);

      // Basit öncelik taraması (21 düğüm için yeterli ve deterministik).
      const pending = new Set<string>([s]);
      while (pending.size > 0) {
        let v: string | null = null;
        let bestDist = Infinity;
        for (const id of pending) {
          const d = seen.get(id)!;
          if (d < bestDist) {
            bestDist = d;
            v = id;
          }
        }
        if (v === null) break;
        pending.delete(v);
        if (dist.has(v)) continue;
        dist.set(v, bestDist);
        stack.push(v);

        for (const w of this.adj.get(v)!) {
          const vwDist = bestDist + this.weight(v, w);
          if (dist.has(w)) continue;
          const known = seen.get(w);
          if (known === undefined || vwDist < known) {
            seen.set(w, vwDist);
            pending.add(w);
            sigma.set(w, sigma.get(v)!);
            preds.set(w, [v]);
          } else if (vwDist === known) {
            sigma.set(w, sigma.get(w)! + sigma.get(v)!);
            preds.get(w)!.push(v);
          }
        }
      }

      // — Bağımlılık birikimi (geri yönde) —
      const delta = new Map<string, number>(ids.map((id) => [id, 0]));
      while (stack.length > 0) {
        const w = stack.pop()!;
        const coeff = (1 + delta.get(w)!) / sigma.get(w)!;
        for (const v of preds.get(w)!) {
          delta.set(v, delta.get(v)! + sigma.get(v)! * coeff);
        }
        if (w !== s) betweenness.set(w, betweenness.get(w)! + delta.get(w)!);
      }
    }

    // — Normalizasyon (yönsüz) —
    const n = ids.length;
    if (n > 2) {
      const scale = 1 / ((n - 1) * (n - 2));
      for (const id of ids) betweenness.set(id, betweenness.get(id)! * scale);
    }
    this.cacheBetweenness = betweenness;
    return betweenness;
  }

  /** degree / (n-1) */
  degreeCentrality(): Map<string, number> {
    const n = this.nodes.size;
    const out = new Map<string, number>();
    for (const id of this.allNodeIds()) {
      out.set(id, n <= 1 ? 0 : this.adj.get(id)!.size / (n - 1));
    }
    return out;
  }

  /** 2m / (n(n-1)) */
  density(): number {
    const n = this.nodes.size;
    const m = this.edges.size;
    return n <= 1 ? 0 : (2 * m) / (n * (n - 1));
  }

  connectedComponents(): number {
    const seen = new Set<string>();
    let count = 0;
    for (const id of this.allNodeIds()) {
      if (seen.has(id)) continue;
      count++;
      const queue = [id];
      seen.add(id);
      while (queue.length > 0) {
        const current = queue.pop()!;
        for (const nb of this.adj.get(current)!) {
          if (!seen.has(nb)) {
            seen.add(nb);
            queue.push(nb);
          }
        }
      }
    }
    return count;
  }

  /** Köprüler (kaldırılınca grafı bölen kenarlar) — iteratif Tarjan. */
  bridges(): Array<[string, string]> {
    const disc = new Map<string, number>();
    const low = new Map<string, number>();
    const parent = new Map<string, string | null>();
    const found: Array<[string, string]> = [];
    let timer = 0;

    for (const root of this.allNodeIds()) {
      if (disc.has(root)) continue;
      parent.set(root, null);
      const stack: Array<{ id: string; iter: Iterator<string> }> = [];
      disc.set(root, timer);
      low.set(root, timer);
      timer++;
      stack.push({ id: root, iter: this.adj.get(root)!.values() });

      while (stack.length > 0) {
        const frame = stack[stack.length - 1];
        const step = frame.iter.next();
        if (step.done) {
          stack.pop();
          const up = parent.get(frame.id) ?? null;
          if (up !== null) {
            low.set(up, Math.min(low.get(up)!, low.get(frame.id)!));
            if (low.get(frame.id)! > disc.get(up)!) found.push([up, frame.id]);
          }
          continue;
        }
        const nb = step.value;
        if (nb === parent.get(frame.id)) continue;
        if (disc.has(nb)) {
          low.set(frame.id, Math.min(low.get(frame.id)!, disc.get(nb)!));
        } else {
          parent.set(nb, frame.id);
          disc.set(nb, timer);
          low.set(nb, timer);
          timer++;
          stack.push({ id: nb, iter: this.adj.get(nb)!.values() });
        }
      }
    }
    return found;
  }

  // ---------------------------------------------------------------- //
  // Friction Score
  // ---------------------------------------------------------------- //

  /** Odysseus ↔ İthaka arasında doğrudan 'Support' kenarı var mı? */
  hasDirectSafeLink(): boolean {
    const edge = this.edge(this.source, this.target);
    return !!edge && edge.type === "Support";
  }

  /**
   * D = en kısa yol ağırlığı + düşman merkeziyet cezası − eşik.
   *
   * Poseidon gibi düşmanların betweenness'ı yüksek olduğu sürece rotaya ceza
   * biner; nötralize edildikçe (`suppression`) katkıları azalır.
   */
  friction(): FrictionReport {
    if (this.cacheFriction) return this.cacheFriction;
    const [path, weight] = this.shortestPath();
    const betweenness = this.betweennessCentrality();
    const onPath = new Set(path);

    const breakdown: PenaltyRow[] = [];
    let penalty = 0;
    for (const id of this.allNodeIds()) {
      const node = this.node(id);
      if (node.status !== "Enemy") continue;
      const bc = betweenness.get(id) ?? 0;
      if (bc <= 0) continue;
      const contribution =
        bc * (1 - node.suppression) * this.penaltyCoefficient * node.penaltyMultiplier;
      if (contribution <= 0) continue;
      penalty += contribution;
      breakdown.push({
        id,
        name: node.name,
        betweenness: bc,
        suppression: node.suppression,
        multiplier: node.penaltyMultiplier,
        penalty: contribution,
        onPath: onPath.has(id),
      });
    }
    breakdown.sort((a, b) => b.penalty - a.penalty);

    const direct = this.hasDirectSafeLink();
    const score = direct ? 0 : weight + penalty - this.victoryThreshold;

    this.cacheFriction = {
      path,
      pathWeight: weight,
      centralityPenalty: penalty,
      threshold: this.victoryThreshold,
      score,
      directSafeLink: direct,
      penaltyBreakdown: breakdown,
    };
    return this.cacheFriction;
  }

  // ---------------------------------------------------------------- //
  // Mutasyonlar (engine.ts tarafından çağrılır)
  // ---------------------------------------------------------------- //

  /** Kenar ağırlığını çarpanla ölçekler, alt sınırda tutar. */
  adjustEdgeWeight(a: string, b: string, factor: number): number {
    const edge = this.edge(a, b);
    if (!edge) throw new Error(`Kenar yok: ${a}–${b}`);
    // round(x, 2) — Python'daki davranışı birebir eşlemek için.
    edge.weight = Math.max(MIN_EDGE_WEIGHT, round2(edge.weight * factor));
    this.dirty();
    return edge.weight;
  }

  setEdgeType(a: string, b: string, type: EdgeType): void {
    const edge = this.edge(a, b);
    if (edge) edge.type = type;
    this.dirty();
  }

  setNodeStatus(id: string, status: NodeStatus): void {
    this.node(id).status = status;
    this.dirty();
  }

  suppressNode(id: string, amount: number): number {
    const node = this.node(id);
    node.suppression = Math.min(1, round2(node.suppression + amount));
    this.dirty();
    return node.suppression;
  }

  /** Reroute için: yeni kenar açar ya da mevcut kenarı iyileştirir. */
  addOrStrengthenEdge(
    a: string,
    b: string,
    weight: number,
    type: EdgeType,
    label: string,
  ): void {
    const existing = this.edge(a, b);
    if (existing) {
      existing.weight = Math.max(MIN_EDGE_WEIGHT, Math.min(existing.weight, weight));
      existing.type = type;
      existing.label = label || existing.label;
      this.dirty();
    } else {
      this.addEdge({
        source: a,
        target: b,
        weight: Math.max(MIN_EDGE_WEIGHT, weight),
        baseWeight: weight,
        type,
        baseType: type,
        label,
        synthetic: true,
        lobbied: false,
      });
    }
  }

  /** Derin kopya — öğüt motoru hamleleri simüle ederken kullanır. */
  clone(): OlymposNetwork {
    const copy = Object.create(OlymposNetwork.prototype) as OlymposNetwork;
    Object.assign(copy, {
      source: this.source,
      target: this.target,
      victoryThreshold: this.victoryThreshold,
      penaltyCoefficient: this.penaltyCoefficient,
      apPerTurn: this.apPerTurn,
      maxTurns: this.maxTurns,
      title: this.title,
      subtitle: this.subtitle,
      nodes: new Map([...this.nodes].map(([id, node]) => [id, { ...node }])),
      edges: new Map([...this.edges].map(([k, edge]) => [k, { ...edge }])),
      adj: new Map([...this.adj].map(([id, set]) => [id, new Set(set)])),
      // Önbellek kopyaya taşınmaz: kopya birazdan değişecek.
      cacheBetweenness: null,
      cacheFriction: null,
    });
    return copy;
  }
}

/** Python'un round(x, 2) davranışı (yarı-yukarı yerine bankacı yuvarlaması değil). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
