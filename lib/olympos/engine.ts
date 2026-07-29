// Olympos — oyun kuralları motoru (Game Rules & Mechanics katmanı).
//
// Python referans uygulamasının portu: tur/güç (AP) yönetimi, ikna–uyutma–köprü
// mekanikleri, Poseidon'un deterministik karşı hamlesi, galibiyet/mağlubiyet ve
// "Athena'nın Öğüdü" (tüm hamleleri simüle edip en iyisini seçen akıl hocası).
//
// Graf matematiği graph.ts içinde.

import { OlymposNetwork, round2 } from "./graph";
import type {
  ActionName,
  AvailableAction,
  Difficulty,
  GameStatus,
  GameView,
  Hint,
  LogActor,
  LogEntry,
  RankedMove,
  ViewEdge,
  ViewNode,
} from "./types";

// --- Denge sabitleri ------------------------------------------------------ //

const PERSUADE_ENEMY_SURCHARGE = 2;
const SOCIAL_PROOF_MAX_DISCOUNT = 2;
const NEUTRALIZE_COST_RATIO = 0.6;
const NEUTRALIZE_MIN_COST = 2;
const NEUTRALIZE_REPEAT_SURCHARGE = 2;
const NEUTRALIZE_SUPPRESSION = 0.5;
const NEUTRALIZE_ENMITY_FACTOR = 0.75;

const PERSUADE_ENEMY_SUPPRESSION = 0.3;
const PERSUADE_ENEMY_FACTOR = 0.8;
const PERSUADE_ALLY_ENMITY_FACTOR = 0.55;
const PERSUADE_ALLY_SUPPORT_FACTOR = 0.7;
/** Kuşatma: bir düğüm müttefik olunca komşu düşmanlar birer aracı kaybeder. */
const ALLY_ISOLATION_SUPPRESSION = 0.15;

const REROUTE_BASE_COST = 3;
const REROUTE_MAX_HOPS = 2;
const REROUTE_DISCOUNT = 0.6;
const REROUTE_MIN_WEIGHT = 2;

const AP_CARRY_OVER_MAX = 3;

const POSEIDON_STORM_FACTOR = 1.35;
const POSEIDON_RALLY_RECOVERY = 0.25;

export const DIFFICULTIES: Record<
  Difficulty,
  { label: string; apBonus: number; extraTurns: number; poseidonPotency: number }
> = {
  kolay: {
    label: "Kolay",
    apBonus: 1,
    extraTurns: 4,
    poseidonPotency: 0.5,
  },
  kahraman: {
    label: "Kahraman",
    apBonus: 0,
    extraTurns: 0,
    poseidonPotency: 1,
  },
};

export const DEFAULT_DIFFICULTY: Difficulty = "kolay";

const KID_LABELS: Record<string, [string, string]> = {
  persuade: ["Arkadaş Ol", "🤝"],
  calm: ["Sakinleştir", "🕊️"],
  neutralize: ["Uyut", "😴"],
  reroute: ["Köprü Kur", "🌉"],
};

/** Kural ihlali — UI bunu kırmızı kutuda gösterir. */
export class ActionError extends Error {}

export class GameEngine {
  network: OlymposNetwork;
  difficulty: Difficulty;
  turn = 1;
  ap: number;
  apPerTurn: number;
  maxTurns: number;
  poseidonPotency: number;
  status: GameStatus = "playing";
  log: LogEntry[] = [];

  constructor(difficulty: Difficulty = DEFAULT_DIFFICULTY, network?: OlymposNetwork) {
    this.network = network ?? new OlymposNetwork();
    this.difficulty = DIFFICULTIES[difficulty] ? difficulty : DEFAULT_DIFFICULTY;
    const tuning = DIFFICULTIES[this.difficulty];
    this.apPerTurn = this.network.apPerTurn + tuning.apBonus;
    this.maxTurns = this.network.maxTurns + tuning.extraTurns;
    this.poseidonPotency = tuning.poseidonPotency;
    this.ap = this.apPerTurn;
    this.pushLog(
      "system",
      "start",
      `${this.turn}. gün başladı. Athena 🦉 yanında — yeni arkadaşlar onun ` +
        "tanıdıkları arasından çıkacak.",
    );
  }

  get frictionScore(): number {
    return this.network.friction().score;
  }

  private pushLog(
    actor: LogActor,
    action: string,
    message: string,
    apSpent = 0,
    before?: number,
    after?: number,
  ): void {
    // İki değer de verilmişse friction'ı hiç hesaplama — simülasyon sırasında
    // bu fonksiyon çok sık çağrılıyor.
    const current = before === undefined || after === undefined ? this.frictionScore : 0;
    const frictionBefore = before ?? current;
    const frictionAfter = after ?? current;
    this.log.push({
      turn: this.turn,
      actor,
      action,
      message,
      apSpent,
      frictionBefore,
      frictionAfter,
      frictionDelta: frictionAfter - frictionBefore,
    });
  }

  // ---------------------------------------------------------------- //
  // Maliyet & uygunluk
  // ---------------------------------------------------------------- //

  isProtected(id: string): boolean {
    return id === this.network.source || id === this.network.target;
  }

  allyNeighborCount(id: string): number {
    return this.network.neighbors(id).filter((nb) => this.network.node(nb).status === "Ally")
      .length;
  }

  /** Bir düğüme ancak müttefiklerinden biri komşuysa dokunulabilir. */
  inInfluenceSphere(id: string): boolean {
    return this.allyNeighborCount(id) > 0;
  }

  persuadeCost(id: string): number {
    const node = this.network.node(id);
    let base = node.influenceCost;
    if (node.status === "Enemy") base += PERSUADE_ENEMY_SURCHARGE;
    // Sosyal kanıt: müttefik komşu arttıkça ikna kolaylaşır.
    const discount = Math.min(
      SOCIAL_PROOF_MAX_DISCOUNT,
      Math.max(0, this.allyNeighborCount(id) - 1),
    );
    return Math.max(1, base - discount);
  }

  neutralizeCost(id: string): number {
    const node = this.network.node(id);
    const raw = Math.ceil(node.influenceCost * NEUTRALIZE_COST_RATIO);
    return Math.max(NEUTRALIZE_MIN_COST, raw) + node.neutralizeCount * NEUTRALIZE_REPEAT_SURCHARGE;
  }

  rerouteCost(id: string): number {
    return REROUTE_BASE_COST + Math.ceil(this.network.node(id).influenceCost / 3);
  }

  actionCost(action: ActionName, id: string): number {
    if (action === "persuade") return this.persuadeCost(id);
    if (action === "neutralize") return this.neutralizeCost(id);
    return this.rerouteCost(id);
  }

  kidActionLabel(action: ActionName, id: string): [string, string] {
    if (action === "persuade" && this.network.node(id).status === "Enemy") {
      return KID_LABELS.calm;
    }
    return KID_LABELS[action];
  }

  /** `to` düğümüne köprü kurabilecek müttefikler. */
  rerouteOptions(to: string): string[] {
    if (this.isProtected(to)) return [];
    const options: string[] = [];
    for (const ally of this.network.nodesByStatus("Ally")) {
      if (ally === to) continue;
      const hops = this.network.hopDistance(ally, to);
      if (hops === null || hops < 1 || hops > REROUTE_MAX_HOPS) continue;
      const newWeight = this.rerouteWeight(ally, to);
      const existing = this.network.edge(ally, to);
      if (existing) {
        // Aynı ilişki bir kez lobilenir; tekrarı öğütme sömürüsü olurdu.
        if (existing.lobbied) continue;
        if (existing.type === "Support" && existing.weight <= newWeight) continue;
      }
      options.push(ally);
    }
    return options;
  }

  /** Yeni köprünün ağırlığı: mevcut mesafenin indirimli hâli (ışınlanma yok). */
  private rerouteWeight(via: string, to: string): number {
    const distance = this.network.distance(via, to);
    if (!Number.isFinite(distance)) return REROUTE_MIN_WEIGHT;
    return round2(Math.max(REROUTE_MIN_WEIGHT, distance * REROUTE_DISCOUNT));
  }

  availableActions(id: string): AvailableAction[] {
    const node = this.network.node(id);
    const reachable = this.inInfluenceSphere(id);
    const guarded = this.isProtected(id);
    const playing = this.status === "playing";
    const actions: AvailableAction[] = [];

    // — İkna / Sakinleştir —
    const pCost = this.persuadeCost(id);
    let pReason = "";
    if (guarded) pReason = "Burada bir şey yapılmaz — bu senin kendi tarafın.";
    else if (node.status === "Ally") pReason = "O zaten arkadaşın! 😀";
    else if (!reachable) pReason = "Henüz çok uzak. Önce onun bir tanıdığını arkadaş yap.";
    else if (pCost > this.ap) pReason = `Şimşek gücün yetmiyor (${pCost} tane gerek).`;
    const [pLabel, pIcon] = this.kidActionLabel("persuade", id);
    actions.push({
      action: "persuade",
      kidLabel: pLabel,
      icon: pIcon,
      cost: pCost,
      enabled: pReason === "" && playing,
      reason: pReason,
      effect:
        node.status === "Enemy"
          ? "Kızgınlığını yumuşatır — bir daha konuşunca arkadaş olabilir."
          : "Arkadaşın olur, yollar açılır ve yanındaki kötüler zayıflar.",
    });

    // — Uyut —
    const nCost = this.neutralizeCost(id);
    let nReason = "";
    if (guarded) nReason = "Burada bir şey yapılmaz — bu senin kendi tarafın.";
    else if (node.status === "Ally") nReason = "Arkadaşını uyutmak olmaz! 😀";
    else if (node.suppression >= 1) nReason = "Çoktan derin uykuda. 😴";
    else if (!reachable) nReason = "Henüz çok uzak. Önce onun bir tanıdığını arkadaş yap.";
    else if (nCost > this.ap) nReason = `Şimşek gücün yetmiyor (${nCost} tane gerek).`;
    actions.push({
      action: "neutralize",
      kidLabel: KID_LABELS.neutralize[0],
      icon: KID_LABELS.neutralize[1],
      cost: nCost,
      enabled: nReason === "" && playing,
      reason: nReason,
      effect: "Uyuyunca sana engel olamaz ve gücü azalır.",
    });

    // — Köprü Kur —
    const rCost = this.rerouteCost(id);
    const vias = guarded ? [] : this.rerouteOptions(id);
    let rReason = "";
    if (guarded) rReason = "Buraya doğrudan köprü kurulamaz.";
    else if (node.status === "Enemy")
      rReason = "Sana kızgın biriyle köprü kurulmaz — önce sakinleştir.";
    else if (vias.length === 0) rReason = "Yardım edecek bir arkadaşın yok. Önce arkadaş topla.";
    else if (rCost > this.ap) rReason = `Şimşek gücün yetmiyor (${rCost} tane gerek).`;
    actions.push({
      action: "reroute",
      kidLabel: KID_LABELS.reroute[0],
      icon: KID_LABELS.reroute[1],
      cost: rCost,
      enabled: rReason === "" && playing,
      reason: rReason,
      effect: "Bir arkadaşın aracılığıyla daha kısa bir yol açar.",
      viaOptions: vias.map((v) => ({
        id: v,
        name: this.network.node(v).name,
        emoji: this.network.node(v).emoji,
      })),
    });

    return actions;
  }

  // ---------------------------------------------------------------- //
  // Eylemler
  // ---------------------------------------------------------------- //

  private preAction(id: string, cost: number): number {
    if (this.status !== "playing") {
      throw new ActionError("Oyun bitti. «Yeniden oyna»ya basarak baştan başla.");
    }
    if (!this.network.hasNode(id)) throw new ActionError(`Bilinmeyen düğüm: ${id}`);
    if (this.isProtected(id)) {
      throw new ActionError(
        `${this.network.node(id).name} senin kendi tarafın — burada bir şey yapılmaz.`,
      );
    }
    if (cost > this.ap) {
      throw new ActionError(
        `Şimşek gücün yetmiyor: ${cost} tane gerek, ${this.ap} tane var.`,
      );
    }
    return this.frictionScore;
  }

  persuade(id: string): void {
    const cost = this.persuadeCost(id);
    const before = this.preAction(id, cost);
    const node = this.network.node(id);

    if (node.status === "Ally") throw new ActionError(`${node.name} zaten arkadaşın!`);
    if (!this.inInfluenceSphere(id)) {
      throw new ActionError(
        `${node.name} henüz çok uzak — önce onun bir tanıdığını arkadaş yap.`,
      );
    }

    let message: string;
    if (node.status === "Enemy") {
      this.network.setNodeStatus(id, "Neutral");
      this.network.suppressNode(id, PERSUADE_ENEMY_SUPPRESSION);
      for (const nb of this.network.neighbors(id)) {
        if (this.network.edge(id, nb)!.type === "Enmity") {
          this.network.adjustEdgeWeight(id, nb, PERSUADE_ENEMY_FACTOR);
        }
      }
      message = `${node.name} biraz sakinleşti. Artık sana o kadar kızgın değil.`;
    } else {
      this.network.setNodeStatus(id, "Ally");
      node.persuaded = true;
      const isolated: string[] = [];
      for (const nb of this.network.neighbors(id)) {
        const edge = this.network.edge(id, nb)!;
        if (edge.type === "Enmity") {
          this.network.setEdgeType(id, nb, "Support");
          this.network.adjustEdgeWeight(id, nb, PERSUADE_ALLY_ENMITY_FACTOR);
        } else {
          this.network.adjustEdgeWeight(id, nb, PERSUADE_ALLY_SUPPORT_FACTOR);
        }
        // Kuşatma: düşman komşu bir aracısını kaybeder.
        if (this.network.node(nb).status === "Enemy") {
          this.network.suppressNode(nb, ALLY_ISOLATION_SUPPRESSION);
          isolated.push(this.network.node(nb).name);
        }
      }
      message = `${node.name} artık arkadaşın! Yollar biraz daha açıldı.`;
      if (isolated.length > 0) {
        message += ` ${isolated.join(" ve ")} bu yüzden zayıfladı.`;
      }
    }

    this.ap -= cost;
    this.pushLog("player", "persuade", message, cost, before, this.frictionScore);
    this.finishAction();
  }

  neutralize(id: string): void {
    const cost = this.neutralizeCost(id);
    const before = this.preAction(id, cost);
    const node = this.network.node(id);

    if (node.status === "Ally") {
      throw new ActionError(`${node.name} arkadaşın — onu uyutmak olmaz!`);
    }
    if (node.suppression >= 1) throw new ActionError(`${node.name} çoktan derin uykuda.`);
    if (!this.inInfluenceSphere(id)) throw new ActionError(`${node.name} henüz çok uzak.`);

    const level = this.network.suppressNode(id, NEUTRALIZE_SUPPRESSION);
    node.neutralizeCount += 1;
    for (const nb of this.network.neighbors(id)) {
      if (this.network.edge(id, nb)!.type === "Enmity") {
        this.network.adjustEdgeWeight(id, nb, NEUTRALIZE_ENMITY_FACTOR);
      }
    }

    this.ap -= cost;
    this.pushLog(
      "player",
      "neutralize",
      `${node.name} uyudu! Artık sana pek engel olamaz.` +
        (level >= 1 ? " Derin uykuda." : ""),
      cost,
      before,
      this.frictionScore,
    );
    this.finishAction();
  }

  reroute(id: string, via?: string): void {
    const cost = this.rerouteCost(id);
    const before = this.preAction(id, cost);
    const node = this.network.node(id);

    if (node.status === "Enemy") {
      throw new ActionError(`${node.name} sana kızgın — önce sakinleştirmen gerek.`);
    }

    const options = this.rerouteOptions(id);
    if (options.length === 0) {
      throw new ActionError(`${node.name} için yardım edecek bir arkadaşın yok.`);
    }
    let broker = via;
    if (broker === undefined) broker = options[0];
    else if (!options.includes(broker)) {
      throw new ActionError(`${this.network.node(broker).name} aracı olamaz.`);
    }

    const weight = this.rerouteWeight(broker, id);
    const brokerName = this.network.node(broker).name;
    this.network.addOrStrengthenEdge(broker, id, weight, "Support", `Lobi: ${brokerName}`);
    this.network.edge(broker, id)!.lobbied = true;

    this.ap -= cost;
    this.pushLog(
      "player",
      "reroute",
      `${brokerName} yardım etti: ${node.name} ile aranızda kestirme bir yol açıldı!`,
      cost,
      before,
      this.frictionScore,
    );
    this.finishAction();
  }

  act(action: ActionName, id: string, via?: string): void {
    if (action === "persuade") this.persuade(id);
    else if (action === "neutralize") this.neutralize(id);
    else this.reroute(id, via);
  }

  // ---------------------------------------------------------------- //
  // Tur döngüsü
  // ---------------------------------------------------------------- //

  private finishAction(): void {
    this.checkVictory();
    if (this.status === "playing" && this.ap <= 0) this.endTurn(true);
  }

  private checkVictory(): boolean {
    const report = this.network.friction();
    if (report.directSafeLink || report.score <= 0) {
      this.status = "won";
      this.pushLog(
        "system",
        "victory",
        "Yol tamamen açıldı! Odysseus arkadaşlarının yardımıyla İthaka'ya varıyor. 🎉",
      );
      return true;
    }
    return false;
  }

  endTurn(auto = false): void {
    if (this.status !== "playing") return;
    if (auto) this.pushLog("system", "ap_exhausted", "Şimşek gücün bitti, gün sona eriyor.");

    this.poseidonMove();
    if (this.checkVictory()) return;

    if (this.turn >= this.maxTurns) {
      this.status = "lost";
      this.pushLog(
        "system",
        "defeat",
        "Günler bitti ve deniz kapalı kaldı. Bir daha denemek ister misin?",
      );
      return;
    }

    const carried = Math.min(AP_CARRY_OVER_MAX, Math.max(0, this.ap));
    this.turn += 1;
    this.ap = this.apPerTurn + carried;
    const suffix = carried > 0 ? ` (${carried} tanesi dünden kaldı)` : "";
    this.pushLog(
      "system",
      "turn_start",
      `${this.turn}. gün başladı — ${this.ap} şimşek gücün var${suffix}.`,
    );
  }

  /**
   * Poseidon'un deterministik karşı hamlesi.
   *  - Tek günlerde fırtına: en kısa rotanın en ağır kenarını ağırlaştırır.
   *  - Çift günlerde tayfa toplama: uyutulmuş bir düşmanı uyandırır.
   * İkna edilip sakinleştikçe ve uyutuldukça zayıflar.
   */
  private poseidonMove(): void {
    const id = "poseidon";
    if (!this.network.hasNode(id)) return;
    const poseidon = this.network.node(id);

    if (poseidon.status === "Ally") {
      this.pushLog("poseidon", "idle", "Poseidon artık sana kızgın değil — deniz sakin. 🌤️");
      return;
    }

    let potency = poseidon.status === "Enemy" ? 1 : 0.5;
    potency *= Math.max(0, 1 - poseidon.suppression);
    potency *= this.poseidonPotency;
    if (potency <= 0.05) {
      this.pushLog("poseidon", "idle", "Poseidon derin uykuda, bugün hiçbir şey yapamadı. 😴");
      return;
    }

    const before = this.frictionScore;

    if (this.turn % 2 === 1) {
      const report = this.network.friction();
      const edges = this.network.pathEdges(report.path);
      if (edges.length > 0) {
        let worst = edges[0];
        for (const pair of edges) {
          if (this.network.weight(pair[0], pair[1]) > this.network.weight(worst[0], worst[1])) {
            worst = pair;
          }
        }
        const factor = 1 + (POSEIDON_STORM_FACTOR - 1) * potency;
        this.network.adjustEdgeWeight(worst[0], worst[1], factor);
        this.pushLog(
          "poseidon",
          "storm",
          `Fırtına! Poseidon ${this.network.node(worst[0]).name} ile ` +
            `${this.network.node(worst[1]).name} arasındaki yolu zorlaştırdı.`,
          0,
          before,
          this.frictionScore,
        );
        return;
      }
    }

    const candidates = this.network
      .allNodeIds()
      .filter((n) => {
        const node = this.network.node(n);
        return node.status !== "Ally" && node.suppression > 0 && n !== id;
      })
      .sort((a, b) => this.network.node(b).suppression - this.network.node(a).suppression);

    if (candidates.length > 0) {
      const victim = this.network.node(candidates[0]);
      victim.suppression = Math.max(
        0,
        round2(victim.suppression - POSEIDON_RALLY_RECOVERY * potency),
      );
      if (victim.status === "Neutral" && victim.baseStatus === "Enemy" && !victim.persuaded) {
        victim.status = "Enemy";
      }
      this.pushLog(
        "poseidon",
        "rally",
        `Poseidon ${victim.name} adlı yardımcısını uyandırdı!`,
        0,
        before,
        this.frictionScore,
      );
      return;
    }

    this.pushLog(
      "poseidon",
      "brooding",
      "Poseidon öfkeyle bekliyor ama elinden bir şey gelmiyor.",
      0,
      before,
      this.frictionScore,
    );
  }

  // ---------------------------------------------------------------- //
  // Athena'nın Öğüdü
  // ---------------------------------------------------------------- //

  /** Motorun derin kopyası — hamle simülasyonu için. */
  private clone(): GameEngine {
    const copy = Object.create(GameEngine.prototype) as GameEngine;
    Object.assign(copy, {
      network: this.network.clone(),
      difficulty: this.difficulty,
      turn: this.turn,
      ap: this.ap,
      apPerTurn: this.apPerTurn,
      maxTurns: this.maxTurns,
      poseidonPotency: this.poseidonPotency,
      status: this.status,
      log: this.log.map((entry) => ({ ...entry })),
    });
    return copy;
  }

  /**
   * Hamleyi kopya bir oyunda dener ve kazanılan engel puanını döner.
   *
   * Turun otomatik devri (ve Poseidon'un karşı hamlesi) ölçümü kirletmesin diye,
   * oyuncu hamlesinin hemen sonrasındaki değer günlükten okunur.
   */
  private simulate(action: ActionName, id: string): number | null {
    const trial = this.clone();
    try {
      trial.act(action, id);
    } catch {
      return null;
    }
    for (let i = trial.log.length - 1; i >= 0; i--) {
      const entry = trial.log[i];
      if (entry.actor === "player") return entry.frictionBefore - entry.frictionAfter;
    }
    return null;
  }

  /** Tüm geçerli hamleleri, güç başına kazanca göre sıralar. */
  rankMoves(): RankedMove[] {
    const ranked: RankedMove[] = [];
    for (const id of this.network.allNodeIds()) {
      for (const action of this.availableActions(id)) {
        if (!action.enabled) continue;
        const gain = this.simulate(action.action, id);
        if (gain === null) continue;
        const node = this.network.node(id);
        ranked.push({
          action: action.action,
          nodeId: id,
          name: node.name,
          emoji: node.emoji,
          kidLabel: action.kidLabel,
          icon: action.icon,
          cost: action.cost,
          gain: round2(gain),
          efficiency: gain / Math.max(1, action.cost),
        });
      }
    }
    ranked.sort((a, b) => b.efficiency - a.efficiency);
    return ranked;
  }

  /** Sıradaki en iyi hamle, çocuk diliyle anlatılmış. */
  hint(): Hint {
    if (this.status === "won") {
      return { kind: "won", text: "Başardın! Odysseus evine döndü. 🎉", move: null, alternatives: [] };
    }
    if (this.status === "lost") {
      return {
        kind: "lost",
        text: "Günler bitti. Yeniden denemek ister misin?",
        move: null,
        alternatives: [],
      };
    }

    const moves = this.rankMoves();
    const helpful = moves.filter((move) => move.gain > 0.05);

    if (helpful.length === 0) {
      return {
        kind: "end_turn",
        text:
          "Bu gün yapacak iyi bir şey kalmadı. «Günü Bitir» düğmesine bas, " +
          "yarın gücün yenilenir.",
        move: null,
        alternatives: [],
      };
    }

    const best = helpful[0];
    let why: string;
    if (best.action === "persuade") {
      why =
        this.network.node(best.nodeId).status === "Enemy"
          ? `${best.name} artık sana kızgın değil, yol biraz açılıyor.`
          : `${best.name} arkadaşın olursa yol açılır ve yanındaki kötüler zayıflar.`;
    } else if (best.action === "neutralize") {
      why = `${best.name} uyursa sana engel olamaz.`;
    } else {
      why = `${best.name} ile kestirme bir yol açarsın.`;
    }

    return {
      kind: "move",
      text: `${best.emoji} ${best.name} → «${best.kidLabel}» yap! ${why}`,
      move: best,
      alternatives: helpful.slice(1, 4),
    };
  }

  // ---------------------------------------------------------------- //
  // Görünüm
  // ---------------------------------------------------------------- //

  view(): GameView {
    const friction = this.network.friction();
    const betweenness = this.network.betweennessCentrality();
    const degree = this.network.degreeCentrality();
    const onPath = new Set(friction.path);
    const pathEdgeKeys = new Set(
      this.network.pathEdges(friction.path).map(([a, b]) => (a < b ? `${a}|${b}` : `${b}|${a}`)),
    );

    const nodes: ViewNode[] = this.network.allNodeIds().map((id) => {
      const node = this.network.node(id);
      return {
        id,
        name: node.name,
        type: node.type,
        status: node.status,
        emoji: node.emoji,
        kidNote: node.kidNote,
        description: node.description,
        epithet: node.epithet,
        influenceCost: node.influenceCost,
        suppression: node.suppression,
        betweenness: betweenness.get(id) ?? 0,
        degree: degree.get(id) ?? 0,
        onPath: onPath.has(id),
        isSource: id === this.network.source,
        isTarget: id === this.network.target,
        reachable: this.inInfluenceSphere(id),
        cheapestCost: Math.min(this.persuadeCost(id), this.neutralizeCost(id)),
      };
    });

    const edges: ViewEdge[] = this.network.allEdges().map((edge) => {
      const k = edge.source < edge.target
        ? `${edge.source}|${edge.target}`
        : `${edge.target}|${edge.source}`;
      return {
        id: `${edge.source}__${edge.target}`,
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        type: edge.type,
        label: edge.label,
        synthetic: edge.synthetic,
        onPath: pathEdgeKeys.has(k),
      };
    });

    return {
      nodes,
      edges,
      friction,
      turn: this.turn,
      maxTurns: this.maxTurns,
      ap: this.ap,
      apPerTurn: this.apPerTurn,
      status: this.status,
      difficulty: this.difficulty,
      log: this.log.slice(-40),
      density: this.network.density(),
      components: this.network.connectedComponents(),
      bridgeCount: this.network.bridges().length,
    };
  }
}
