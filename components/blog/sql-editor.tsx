"use client";

import { useRef, useState } from "react";
import { Check, Copy, RotateCcw } from "lucide-react";

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

      <figcaption className="border-t border-border/70 bg-background-alt/40 px-4 py-2 font-mono text-[11px] text-muted/70">
        {lines.length} lines · editable scratchpad — tweak it here, then run it
        in the BigQuery console
      </figcaption>
    </figure>
  );
}
