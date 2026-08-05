/** A small, dependency-free BigQuery-flavoured SQL checker.
 *
 *  This does NOT execute anything — it can't, there's no warehouse in the
 *  browser. It reports the class of mistakes a compiler would catch before it
 *  ever reaches BigQuery (unbalanced parens, unterminated literals, clause
 *  order, trailing commas) and infers the output column list from the SELECT.
 */

export type Severity = "error" | "warning";

export interface Diagnostic {
  line: number; // 1-based
  column: number; // 1-based
  severity: Severity;
  message: string;
}

export interface Analysis {
  diagnostics: Diagnostic[];
  outputColumns: string[];
}

/** BigQuery's required clause order. Lower rank must come first. */
const CLAUSE_RANK: Record<string, number> = {
  WITH: 0,
  SELECT: 1,
  FROM: 2,
  WHERE: 3,
  "GROUP BY": 4,
  HAVING: 5,
  QUALIFY: 6,
  WINDOW: 7,
  "ORDER BY": 8,
  LIMIT: 9,
};

const CLAUSE_PATTERN =
  /\b(WITH|SELECT|FROM|WHERE|GROUP\s+BY|HAVING|QUALIFY|WINDOW|ORDER\s+BY|LIMIT)\b/gi;

interface Pos {
  line: number;
  column: number;
}

/** Replaces every string literal, backtick identifier and comment with spaces
 *  of the same length, so downstream regex work can't be fooled by their
 *  contents while byte offsets still line up with the original. */
function blankOutLiterals(src: string) {
  const out = src.split("");
  const diagnostics: Diagnostic[] = [];
  const parenStack: { index: number }[] = [];

  const posAt = (index: number): Pos => {
    let line = 1;
    let lastBreak = -1;
    for (let i = 0; i < index; i++) {
      if (src[i] === "\n") {
        line++;
        lastBreak = i;
      }
    }
    return { line, column: index - lastBreak };
  };

  let i = 0;
  while (i < src.length) {
    const c = src[i];

    // line comment
    if (c === "-" && src[i + 1] === "-") {
      while (i < src.length && src[i] !== "\n") out[i++] = " ";
      continue;
    }
    // block comment
    if (c === "/" && src[i + 1] === "*") {
      const start = i;
      let closed = false;
      out[i++] = " ";
      out[i++] = " ";
      while (i < src.length) {
        if (src[i] === "*" && src[i + 1] === "/") {
          out[i++] = " ";
          out[i++] = " ";
          closed = true;
          break;
        }
        if (src[i] !== "\n") out[i] = " ";
        i++;
      }
      if (!closed) {
        diagnostics.push({
          ...posAt(start),
          severity: "error",
          message: "Unterminated block comment — missing closing */",
        });
      }
      continue;
    }
    // single-quoted string
    if (c === "'" || c === '"') {
      const quote = c;
      const start = i;
      out[i++] = " ";
      let closed = false;
      while (i < src.length) {
        if (src[i] === "\\") {
          out[i] = " ";
          if (src[i + 1] !== undefined && src[i + 1] !== "\n") out[i + 1] = " ";
          i += 2;
          continue;
        }
        if (src[i] === quote) {
          out[i++] = " ";
          closed = true;
          break;
        }
        if (src[i] === "\n") break; // BigQuery strings don't span raw newlines
        out[i] = " ";
        i++;
      }
      if (!closed) {
        diagnostics.push({
          ...posAt(start),
          severity: "error",
          message: `Unterminated string literal — missing closing ${quote}`,
        });
      }
      continue;
    }
    // backtick-quoted identifier
    if (c === "`") {
      const start = i;
      out[i++] = " ";
      let closed = false;
      while (i < src.length) {
        if (src[i] === "`") {
          out[i++] = " ";
          closed = true;
          break;
        }
        if (src[i] !== "\n") out[i] = " ";
        i++;
      }
      if (!closed) {
        diagnostics.push({
          ...posAt(start),
          severity: "error",
          message: "Unterminated quoted identifier — missing closing backtick",
        });
      }
      continue;
    }

    if (c === "(") parenStack.push({ index: i });
    if (c === ")") {
      if (parenStack.length === 0) {
        diagnostics.push({
          ...posAt(i),
          severity: "error",
          message: "Unmatched closing parenthesis",
        });
      } else {
        parenStack.pop();
      }
    }
    i++;
  }

  for (const open of parenStack) {
    diagnostics.push({
      ...posAt(open.index),
      severity: "error",
      message: "Unclosed parenthesis — missing )",
    });
  }

  return { stripped: out.join(""), diagnostics, posAt };
}

/** Splits on commas that sit at paren depth 0. */
function splitTopLevel(segment: string) {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of segment) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function nameFor(expression: string, index: number) {
  const expr = expression.trim().replace(/\s+/g, " ");
  if (!expr) return `f${index}_`;
  const aliased = expr.match(/\sAS\s+`?([A-Za-z_][\w]*)`?$/i);
  if (aliased) return aliased[1];
  // bare column, possibly qualified: take the last dotted segment
  const bare = expr.match(/^([A-Za-z_][\w]*\.)*([A-Za-z_][\w]*)$/);
  if (bare) return bare[2];
  return `f${index}_`; // BigQuery's own name for an unaliased expression
}

export function analyzeSql(source: string): Analysis {
  const { stripped, diagnostics, posAt } = blankOutLiterals(source);
  const trimmed = stripped.trim();

  if (!trimmed) return { diagnostics: [], outputColumns: [] };

  // Collect clauses in the order they appear.
  const clauses: { name: string; index: number }[] = [];
  for (const m of stripped.matchAll(CLAUSE_PATTERN)) {
    clauses.push({
      name: m[1].toUpperCase().replace(/\s+/g, " "),
      index: m.index!,
    });
  }

  const hasSelect = clauses.some((c) => c.name === "SELECT");
  const hasFrom = clauses.some((c) => c.name === "FROM");

  if (!hasSelect && !clauses.some((c) => c.name === "WITH")) {
    diagnostics.push({
      line: 1,
      column: 1,
      severity: "error",
      message: "Statement must begin with SELECT or WITH",
    });
  }

  if (hasSelect && !hasFrom) {
    diagnostics.push({
      line: 1,
      column: 1,
      severity: "warning",
      message:
        "SELECT without FROM — valid for constant expressions, but usually a missing table",
    });
  }

  // Clause order, ignoring anything nested inside a subquery.
  let topLevel = clauses.filter((c) => {
    let depth = 0;
    for (let i = 0; i < c.index; i++) {
      if (stripped[i] === "(") depth++;
      else if (stripped[i] === ")") depth--;
    }
    return depth === 0;
  });
  // A second SELECT at depth 0 means a set operation (UNION etc.) — ordering
  // checks across that boundary would produce false positives.
  const secondSelect = topLevel.filter((c) => c.name === "SELECT").length > 1;
  if (secondSelect) topLevel = [];

  for (let i = 1; i < topLevel.length; i++) {
    const prev = topLevel[i - 1];
    const cur = topLevel[i];
    const a = CLAUSE_RANK[prev.name];
    const b = CLAUSE_RANK[cur.name];
    if (a !== undefined && b !== undefined && b < a) {
      diagnostics.push({
        ...posAt(cur.index),
        severity: "error",
        message: `${cur.name} cannot come after ${prev.name}`,
      });
    }
  }

  // Trailing comma right before a clause keyword is a hard syntax error.
  for (const c of topLevel) {
    if (c.name === "SELECT" || c.name === "WITH") continue;
    const before = stripped.slice(0, c.index).replace(/\s+$/, "");
    if (before.endsWith(",")) {
      diagnostics.push({
        ...posAt(before.length - 1),
        severity: "error",
        message: `Trailing comma before ${c.name}`,
      });
    }
  }

  // Output columns: read the SELECT list from the original source so aliases
  // keep their real text, bounded by the stripped copy's clause positions.
  let outputColumns: string[] = [];
  const selectClause = topLevel.find((c) => c.name === "SELECT");
  if (selectClause) {
    const listStart = selectClause.index + "SELECT".length;
    const next = topLevel.find((c) => c.index > selectClause.index);
    const listEnd = next ? next.index : stripped.length;
    if (listEnd > listStart) {
      // Use the stripped text for splitting (literals blanked, so commas in
      // strings can't break it), then map back to the original by offset.
      const strippedList = stripped.slice(listStart, listEnd);
      let cursor = listStart;
      outputColumns = splitTopLevel(strippedList).map((part, idx) => {
        const original = source.slice(cursor, cursor + part.length);
        cursor += part.length + 1; // +1 for the comma
        return nameFor(original.replace(/^\s*DISTINCT\s+/i, ""), idx);
      });
    }
  }

  diagnostics.sort((x, y) => x.line - y.line || x.column - y.column);
  return { diagnostics, outputColumns };
}
