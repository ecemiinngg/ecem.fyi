"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CircleAlert,
  Copy,
  RotateCcw,
} from "lucide-react";
import { analyzeSql, type Diagnostic } from "@/lib/sql-lint";

/** Char offset of a 1-based line/column, for moving the caret to a diagnostic. */
function offsetOf(src: string, line: number, column: number) {
  const lines = src.split("\n");
  let offset = 0;
  for (let i = 0; i < line - 1 && i < lines.length; i++) {
    offset += lines[i].length + 1;
  }
  return offset + (column - 1);
}

const KEYWORDS = [
  "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "CASE", "WHEN", "THEN",
  "ELSE", "END", "AS", "AND", "OR", "NOT", "IN", "BETWEEN", "DISTINCT",
  "LIMIT", "DESC", "ASC", "JOIN", "LEFT", "ON", "WITH", "UNNEST", "HAVING",
  "IS", "NULL",
];
const FUNCTIONS = ["LOWER", "UPPER", "COUNT", "SUM", "AVG", "MAX", "MIN", "PARSE_DATE", "SAFE_CAST", "COALESCE"];

// Longest-first so "GROUP BY" wins over "GROUP", and \b won't work around a
// space, so multi-word keywords are matched literally.
const kw = [...KEYWORDS].sort((a, b) => b.length - a.length).join("|");
const fn = FUNCTIONS.join("|");

const TOKEN = new RegExp(
  [
    "(--[^\\n]*)",                       // 1 line comment
    "(/\\*[\\s\\S]*?\\*/)",              // 2 block comment
    "('(?:[^'\\\\]|\\\\.)*')",           // 3 string
    "(`[^`]*`)",                         // 4 quoted identifier
    `\\b(${fn})(?=\\s*\\()`,             // 5 function call
    `(?<![\\w.])(${kw})(?![\\w])`,       // 6 keyword
    "\\b(\\d+(?:\\.\\d+)?)\\b",          // 7 number
  ].join("|"),
  "gi"
);

const CLASS = {
  1: "text-muted/60 italic",
  2: "text-muted/60 italic",
  3: "text-accent-3",
  4: "text-accent-2",
  5: "text-accent-4",
  6: "text-accent font-semibold",
  7: "text-accent-2",
} as const;

function highlight(src: string) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of src.matchAll(TOKEN)) {
    const start = m.index!;
    if (start > last) out.push(src.slice(last, start));
    // Find which alternative matched.
    const group = m.slice(1).findIndex((g) => g !== undefined) + 1;
    const cls = CLASS[group as keyof typeof CLASS] ?? "";
    out.push(
      <span key={i++} className={cls}>
        {m[0]}
      </span>
    );
    last = start + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

export default function SqlEditor({
  code,
  filename = "query.sql",
}: {
  code: string;
  filename?: string;
}) {
  const initial = code.replace(/\n$/, "");
  const [value, setValue] = useState(initial);
  const [copied, setCopied] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lines = value.split("\n");
  const dirty = value !== initial;

  // Derived during render, not in an effect. Memoised so a long query isn't
  // re-analysed on unrelated re-renders.
  const { diagnostics, outputColumns } = useMemo(
    () => analyzeSql(value),
    [value]
  );
  const errors = diagnostics.filter((d) => d.severity === "error").length;
  const warnings = diagnostics.length - errors;

  /** Put the caret on a diagnostic so it's obvious which token is at fault. */
  function jumpTo(d: Diagnostic) {
    const ta = taRef.current;
    if (!ta) return;
    const at = offsetOf(value, d.line, d.column);
    ta.focus();
    ta.setSelectionRange(at, at + 1);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — leave the button state alone */
    }
  }

  // Keep the highlight layer and gutter aligned with the textarea's scroll.
  function onScroll() {
    const ta = taRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
  }

  // Tab should indent, not escape the field.
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const ta = e.currentTarget;
    const { selectionStart: s, selectionEnd: en } = ta;
    const next = value.slice(0, s) + "  " + value.slice(en);
    setValue(next);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = s + 2;
    });
  }

  return (
    <figure className="mb-6 overflow-hidden rounded-xl border border-border bg-[#0b1424]">
      {/* chrome */}
      <div className="flex items-center gap-3 border-b border-border/70 bg-background-alt/60 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-accent-4/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent-2/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent-3/80" />
        </div>
        <span className="font-mono text-xs text-muted">{filename}</span>
        <span className="rounded border border-accent/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
          BigQuery
        </span>
        <span
          className={`inline-flex items-center gap-1 font-mono text-[11px] ${
            errors ? "text-accent-4" : warnings ? "text-accent-2" : "text-accent-3"
          }`}
        >
          {errors > 0 ? (
            <>
              <CircleAlert className="h-3 w-3" /> {errors} error
              {errors > 1 ? "s" : ""}
            </>
          ) : warnings > 0 ? (
            <>
              <AlertTriangle className="h-3 w-3" /> {warnings} warning
              {warnings > 1 ? "s" : ""}
            </>
          ) : (
            <>
              <Check className="h-3 w-3" /> parsed
            </>
          )}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {dirty && (
            <button
              type="button"
              onClick={() => setValue(initial)}
              className="inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[11px] text-muted transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
          <button
            type="button"
            onClick={copy}
            aria-label="Copy query"
            className="inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[11px] text-muted transition-colors hover:bg-white/5 hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-accent-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* editor body: gutter + (highlight layer under a transparent textarea) */}
      <div className="relative flex max-h-[26rem] text-[13px] leading-[1.6]">
        <div
          ref={gutterRef}
          aria-hidden
          className="select-none overflow-hidden border-r border-border/50 bg-background-alt/30 px-3 py-3 text-right font-mono text-muted/50"
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <div className="relative flex-1 overflow-hidden">
          <pre
            ref={preRef}
            aria-hidden
            className="pointer-events-none overflow-auto px-4 py-3 font-mono whitespace-pre text-foreground"
          >
            <code>{highlight(value)}</code>
            {"\n"}
          </pre>
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onScroll={onScroll}
            onKeyDown={onKeyDown}
            spellCheck={false}
            aria-label={`${filename} — editable SQL`}
            className="absolute inset-0 resize-none overflow-auto bg-transparent px-4 py-3 font-mono whitespace-pre text-transparent caret-accent-2 outline-none"
          />
        </div>
      </div>

      {/* Compiler-style output: diagnostics if the statement won't parse,
          otherwise the schema it would return. Nothing is executed here — no
          warehouse in the browser — so no row counts are implied. */}
      <div className="border-t border-border/70 bg-background-alt/40 px-4 py-2.5 font-mono text-[11px]">
        {diagnostics.length > 0 ? (
          <ul className="space-y-1">
            {diagnostics.map((d, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => jumpTo(d)}
                  className="flex w-full items-start gap-2 text-left transition-colors hover:text-foreground"
                >
                  <span
                    className={
                      d.severity === "error" ? "text-accent-4" : "text-accent-2"
                    }
                  >
                    {d.severity}
                  </span>
                  <span className="text-muted/60">
                    {d.line}:{d.column}
                  </span>
                  <span className="text-muted">{d.message}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-muted/70">
            <span className="text-accent-3">✓ no problems</span>
            <span>·</span>
            <span>{lines.length} lines</span>
            {outputColumns.length > 0 && (
              <>
                <span>·</span>
                <span>
                  returns{" "}
                  <span className="text-accent-2">
                    {outputColumns.join(", ")}
                  </span>
                </span>
              </>
            )}
          </div>
        )}
      </div>
      <figcaption className="border-t border-border/70 px-4 py-2 font-mono text-[10px] text-muted/50">
        Checked in-browser for syntax only — run it in the BigQuery console to
        get results.
      </figcaption>
    </figure>
  );
}
