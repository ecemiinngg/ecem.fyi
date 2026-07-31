// Analytics & KPI Dashboard Agent.
//
// Oyuncunun tüm yolculuğunu (Player Vector) Odysseus'un orijinal hattıyla (Canon
// Vector) karşılaştıran nihai A/B raporunu üretir: yüzdesel farklar, liderlik
// profili, düğüm başına analist notu ve panoya kopyalanabilir düz metin çıktı.

import { METRICS, START_STATE } from "./canon-db";
import { checkAlignment, getCanonRun, getNodeById } from "./canon-agent";
import { narrateEpilogue } from "./narrator";
import type {
  AnalystNote,
  DecisionRow,
  GameState,
  KpiTile,
  LogEntry,
  MetricComparison,
  Report,
  ScaleKey,
} from "./types";

const START_CREW = START_STATE.crew;

/** Metrik başına yön dili: [artı yönü, eksi yönü]. */
const PHRASING: Record<ScaleKey, [string, string]> = {
  rationality: ["daha rasyonel", "daha az rasyonel"],
  curiosity: ["daha meraklı", "daha az meraklı"],
  risk: ["daha risk iştahlı", "daha temkinli"],
  authority: ["daha otoriter", "daha az otoriter"],
  wrath: ["tanrıları daha çok kızdırdın", "tanrıları daha az kızdırdın"],
};

export function pctDiff(player: number, canon: number): number {
  if (canon === 0) return player === 0 ? 0 : 100;
  return Math.round(((player - canon) / canon) * 100);
}

export function months2years(m: number): string {
  const years = Math.floor(m / 12);
  const rest = m % 12;
  if (years && rest) return `${years} yıl ${rest} ay`;
  if (years) return `${years} yıl`;
  return `${rest} ay`;
}

function profileOf(state: GameState, crewLossPct: number, arrived: boolean) {
  let title: string;
  if (!arrived) title = "Yarıda Kalan Destan";
  else if (state.rationality >= 65 && state.risk >= 65) title = "Hırslı Pragmatist";
  else if (state.rationality >= 65 && state.risk < 40) title = "Temkinli Stratejist";
  else if (state.rationality >= 65) title = "Soğukkanlı Kaptan";
  else if (state.rationality < 40 && state.risk >= 65) title = "Kaderin Kumarbazı";
  else if (state.rationality < 40 && state.risk < 40) title = "Tereddütlü Dümenci";
  else if (state.curiosity >= 80) title = "Doymak Bilmeyen Kâşif";
  else if (state.authority >= 75) title = "Demir Yumruk";
  else if (crewLossPct <= 25) title = "Mürettebatın Babası";
  else title = "Ölçülü Yolcu";

  let subtitle: string;
  if (!arrived) subtitle = "Yolculuk tamamlanmadı; veri seti kısmi ama okunabilir.";
  else if (crewLossPct === 0) subtitle = "Tek adam kaybetmeden dönen ilk kaptan.";
  else if (crewLossPct < 100 && state.wrath >= 70)
    subtitle = "Mürettebatını kurtardın, tanrıları kaybettin.";
  else if (crewLossPct < 50)
    subtitle = "Kayıpları hesapla yönettin, destanı takvime uydurdun.";
  else if (state.curiosity >= 80)
    subtitle = "Anlatacak çok şeyin var; anlatacak çok adamın yok.";
  else subtitle = "Ithaka bir liman değil, bir bilanço kalemi oldu.";

  return { title, subtitle };
}

function leadershipSummary(report: Omit<Report, "summary" | "tiles">): string {
  const parts: string[] = [];
  const { arrival, crew, alignment } = report;

  if (!arrival.arrived) {
    parts.push(
      "Yolculuk Ithaka'dan önce sona erdi: liderlik profili tamamlanmamış bir veri seti üzerinden okunuyor. Kaybedilen değişken zaman değil, seçenek sayısıydı.",
    );
  } else if (arrival.diffMonths > 0) {
    parts.push(
      `Ithaka'ya orijinalden ${months2years(arrival.diffMonths)} daha erken vardın (${months2years(arrival.months)} vs. ${months2years(arrival.canonMonths)}).`,
    );
  } else if (arrival.diffMonths < 0) {
    parts.push(
      `Ithaka'ya orijinalden ${months2years(-arrival.diffMonths)} daha geç vardın (${months2years(arrival.months)} vs. ${months2years(arrival.canonMonths)}).`,
    );
  } else {
    parts.push(
      `Ithaka'ya tam Odysseus'un takviminde vardın: ${months2years(arrival.months)}.`,
    );
  }

  if (crew.lossPct < crew.canonLossPct) {
    parts.push(
      `Hayatta kalan mürettebat oranı %${100 - crew.lossPct} — orijinalde bu oran %${100 - crew.canonLossPct}. Adam başına liderlik performansın canon'un üzerinde.`,
    );
  } else if (crew.lossPct > crew.canonLossPct) {
    parts.push(
      `Hayatta kalan mürettebat oranı %${100 - crew.lossPct} — orijinalin altında. Kararların yükünü büyük ölçüde kürekçiler taşıdı.`,
    );
  } else {
    parts.push(`Mürettebat kaybın orijinalle aynı: %${crew.lossPct}.`);
  }

  parts.push(
    `Canon ile örtüşme oranın %${alignment.pct} (${alignment.matched}/${alignment.total} düğüm). ` +
      (alignment.pct >= 60
        ? "Homeros'un çizgisine yakın yürüdün."
        : "Destanı büyük ölçüde yeniden yazdın."),
  );

  return parts.join(" ");
}

function buildTiles(report: Omit<Report, "summary" | "tiles">): KpiTile[] {
  const { arrival, crew, alignment, wrath } = report;

  let arrivalNote: string;
  if (!arrival.arrived) arrivalNote = "Yolculuk yarıda kesildi";
  else if (arrival.diffMonths > 0)
    arrivalNote = `${months2years(arrival.diffMonths)} daha erken`;
  else if (arrival.diffMonths < 0)
    arrivalNote = `${months2years(-arrival.diffMonths)} daha geç`;
  else arrivalNote = "Canon ile aynı takvim";

  return [
    {
      label: "Varış durumu",
      value: arrival.arrived ? "Ithaka" : "Kayıp",
      delta: arrivalNote,
      dir: arrival.arrived ? (arrival.diffMonths >= 0 ? "good" : "bad") : "bad",
    },
    {
      label: "Toplam süre",
      value: months2years(arrival.months),
      delta: `Canon: ${months2years(arrival.canonMonths)}`,
      dir: arrival.months <= arrival.canonMonths ? "good" : "bad",
    },
    {
      label: "Mürettebat kaybı",
      value: `%${crew.lossPct}`,
      delta: `Canon: %${crew.canonLossPct}`,
      dir:
        crew.lossPct < crew.canonLossPct
          ? "good"
          : crew.lossPct > crew.canonLossPct
            ? "bad"
            : "flat",
    },
    {
      label: "Hayatta kalan",
      value: `${crew.final} / ${START_CREW}`,
      delta: `Canon: ${crew.canonFinal} / ${START_CREW}`,
      dir:
        crew.final > crew.canonFinal
          ? "good"
          : crew.final < crew.canonFinal
            ? "bad"
            : "flat",
    },
    {
      label: "Canon örtüşmesi",
      value: `%${alignment.pct}`,
      delta: `${alignment.matched}/${alignment.total} düğüm aynı`,
      dir: "flat",
    },
    {
      label: "Tanrıların gazabı",
      value: `${wrath.player} / 100`,
      delta: `Canon: ${wrath.canon} / 100`,
      dir:
        wrath.player < wrath.canon
          ? "good"
          : wrath.player > wrath.canon
            ? "bad"
            : "flat",
    },
  ];
}

function buildNotes(playerLog: LogEntry[], canonLog: LogEntry[]): AnalystNote[] {
  return playerLog.map((player, index) => {
    const canon = canonLog[index];
    const node = getNodeById(player.nodeId);
    const same = player.choiceId === canon.choiceId;

    const crewDiff = player.applied.crew - canon.applied.crew;
    const monthDiff = player.applied.months - canon.applied.months;

    let text: string;
    if (same) {
      text = `Odysseus ile aynı hamleyi yaptın. ${player.analystNote}`;
    } else {
      text = `${player.analystNote} Odysseus ise <em>“${canon.choiceLabel}”</em> demişti: ${node?.canonSummary ?? ""}`;
      const bits: string[] = [];
      if (crewDiff > 0) bits.push(`${crewDiff} adam daha az kaybettin`);
      if (crewDiff < 0) bits.push(`${Math.abs(crewDiff)} adam daha fazla kaybettin`);
      if (monthDiff < 0) bits.push(`${Math.abs(monthDiff)} ay kazandın`);
      if (monthDiff > 0) bits.push(`${monthDiff} ay kaybettin`);
      if (bits.length) text += ` <strong>Net fark: ${bits.join(", ")}.</strong>`;
    }
    if (player.varianceFired && player.varianceNote) {
      text += ` Olasılıksal katman devreye girdi: ${player.varianceNote}`;
    }
    if (player.fatal) text += " Bu karar yolculuğu bitirdi.";

    return {
      node: node?.title ?? player.nodeTitle,
      nodeId: player.nodeId,
      same,
      text,
    };
  });
}

function buildDecisions(
  playerLog: LogEntry[],
  canonLog: LogEntry[],
): DecisionRow[] {
  return canonLog.map((canon, index) => {
    const player = playerLog[index] ?? null;
    return {
      nodeId: canon.nodeId,
      node: canon.nodeTitle,
      player: player ? player.choiceLabel : "—",
      canon: canon.choiceLabel,
      same: Boolean(player && player.choiceId === canon.choiceId),
      playerCrew: player ? player.applied.crew : null,
      canonCrew: canon.applied.crew,
      playerMonths: player ? player.applied.months : null,
      canonMonths: canon.applied.months,
      tag: player ? player.tag : null,
    };
  });
}

export function buildReport(
  playerState: GameState,
  playerLog: LogEntry[],
  seed: number,
): Report {
  const canonRun = getCanonRun();
  const canonState = canonRun.state;
  const canonLog = canonRun.log;

  const arrived = playerState.alive;
  const crewLoss = Math.round(
    ((START_CREW - playerState.crew) / START_CREW) * 100,
  );
  const canonLoss = Math.round(
    ((START_CREW - canonState.crew) / START_CREW) * 100,
  );

  const metrics: MetricComparison[] = METRICS.filter((m) => m.axis).map((m) => {
    const player = playerState[m.key];
    const canon = canonState[m.key];
    const pct = pctDiff(player, canon);
    const words = PHRASING[m.key];
    const phrase =
      pct === 0
        ? "canon ile aynı"
        : `%${Math.abs(pct)} ${pct > 0 ? words[0] : words[1]}`;
    return {
      key: m.key,
      label: m.label,
      short: m.short,
      player,
      canon,
      pct,
      phrase,
    };
  });

  const core = {
    seed,
    profile: profileOf(playerState, crewLoss, arrived),
    arrival: {
      arrived,
      months: playerState.months,
      canonMonths: canonState.months,
      diffMonths: canonState.months - playerState.months,
      label: arrived ? "Ithaka'ya ulaşıldı" : "Ithaka'ya ulaşılamadı",
    },
    crew: {
      final: playerState.crew,
      canonFinal: canonState.crew,
      lossPct: crewLoss,
      canonLossPct: canonLoss,
    },
    wrath: { player: playerState.wrath, canon: canonState.wrath },
    metrics,
    alignment: checkAlignment(playerLog),
    decisions: buildDecisions(playerLog, canonLog),
    notes: buildNotes(playerLog, canonLog),
    epilogue: narrateEpilogue(playerState),
  };

  return { ...core, tiles: buildTiles(core), summary: leadershipSummary(core) };
}

/** Panoya kopyalanabilir düz metin rapor. */
export function toPlainText(report: Report): string {
  const lines: string[] = [];
  lines.push("[DESTANÎ A/B TESTİ SONUÇ RAPORU]", "");
  lines.push(
    `Liderlik Profili: "${report.profile.title}" — ${report.profile.subtitle}`,
  );
  lines.push(
    `Varış Durumu: ${report.arrival.label} (${months2years(report.arrival.months)}) · Canon: ${months2years(report.arrival.canonMonths)}`,
  );
  lines.push(
    `Mürettebat Kaybı: %${report.crew.lossPct} (Canon: %${report.crew.canonLossPct})`,
  );
  lines.push(
    `Canon Örtüşmesi: %${report.alignment.pct} (${report.alignment.matched}/${report.alignment.total})`,
    "",
  );
  lines.push("Kişilik Metrikleri (Player vs. Odysseus):");
  for (const m of report.metrics) {
    lines.push(`  · ${m.label}: ${m.player} / ${m.canon}  (${m.phrase})`);
  }
  lines.push(
    `  · Tanrıların Gazabı: ${report.wrath.player} / ${report.wrath.canon}`,
    "",
  );
  lines.push(`Liderlik Özeti: ${report.summary}`, "");
  lines.push("Analist Notları:");
  for (const note of report.notes) {
    lines.push(`  · ${note.node}: ${note.text.replace(/<[^>]+>/g, "")}`);
  }
  lines.push("", `Simülasyon tohumu: ${report.seed}`);
  return lines.join("\n");
}
