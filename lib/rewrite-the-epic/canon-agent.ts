// Canon Database & Checker Agent.
//
// Odysseus'un tarihsel kararlarını ve sonuç parametrelerini sunar; oyuncu
// hattının canon ile örtüşmesini ölçer. Canon Vector'ü elle yazmak yerine canon
// kararlarını AYNI motordan deterministik modda geçiriyoruz — böylece oyuncu
// vektörüyle birebir kıyaslanabilir ve referans değerlerden sapma anında görülür.

import { CANON_REFERENCE, NODES } from "./canon-db";
import { applyChoice, createState } from "./engine";
import type { CanonNode, CanonRecord, Choice, GameState, LogEntry } from "./types";

export const getNode = (index: number): CanonNode | null =>
  NODES[index] ?? null;

export const getNodeById = (id: string): CanonNode | null =>
  NODES.find((node) => node.id === id) ?? null;

export const getChoice = (node: CanonNode, choiceId: string): Choice | null =>
  node.choices.find((choice) => choice.id === choiceId) ?? null;

export const getCanonChoice = (node: CanonNode): Choice =>
  node.choices.find((choice) => choice.canon) ?? node.choices[0];

/** Bir düğümün orijinal kararı — JSON sözleşmesi olarak. */
export function getCanonRecord(node: CanonNode): CanonRecord {
  const choice = getCanonChoice(node);
  return {
    node_id: node.id,
    node_title: node.title,
    canon_choice_id: choice.id,
    canon_choice: choice.label,
    canon_summary: node.canonSummary,
    canon_effects: { ...choice.effects },
    canon_outcome: choice.outcome,
    canon_analyst_note: choice.analystNote,
  };
}

let canonRunCache: { state: GameState; log: LogEntry[] } | null = null;

/** Canon Vector: canon kararlarının deterministik simülasyonu (cache'li). */
export function getCanonRun(): { state: GameState; log: LogEntry[] } {
  if (canonRunCache) return canonRunCache;
  let state = createState();
  const log: LogEntry[] = [];
  for (const node of NODES) {
    const result = applyChoice(state, node, getCanonChoice(node), {
      deterministic: true,
    });
    state = result.state;
    log.push(result.entry);
  }
  canonRunCache = { state, log };
  return canonRunCache;
}

/** Oyuncu hattının canon ile örtüşme oranı. */
export function checkAlignment(playerLog: LogEntry[]) {
  let matched = 0;
  for (const entry of playerLog) {
    const node = getNodeById(entry.nodeId);
    if (node && getCanonChoice(node).id === entry.choiceId) matched += 1;
  }
  return {
    matched,
    total: playerLog.length,
    pct: playerLog.length
      ? Math.round((matched / playerLog.length) * 100)
      : 0,
  };
}

/** Motor çıktısı canon referansıyla tutarlı mı? (120 ay / 0 hayatta kalan) */
export function verifyReference() {
  const run = getCanonRun();
  return {
    months: {
      computed: run.state.months,
      expected: CANON_REFERENCE.totalMonths,
      ok: run.state.months === CANON_REFERENCE.totalMonths,
    },
    crew: {
      computed: run.state.crew,
      expected: CANON_REFERENCE.finalCrew,
      ok: run.state.crew === CANON_REFERENCE.finalCrew,
    },
  };
}
