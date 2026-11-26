"use client";

import { useEffect, useMemo, useState } from "react";
import { truthTable, type Expr } from "@/lib/logic";
import { explainRow } from "@/lib/explain";
import { useProgress } from "@/lib/progress";
import { NotationToggle } from "./notation-toggle";
import { RollingText } from "./rolling-text";
import { RowOrderToggle } from "./row-order-toggle";
import { TableGrid, type GridColumn } from "./table-grid";

const PLAY_MS = 1100;

/**
 * Builds a truth table one row at a time, the way you'd do it on paper:
 * list the inputs, then work out each column left to right, row by row.
 * Each step comes with a sentence explaining that row's result.
 */
export function TableBuilder({ expr, caption }: { expr: Expr; caption?: string }) {
  const notation = useProgress((s) => s.notation);
  const setNotation = useProgress((s) => s.setNotation);
  const order = useProgress((s) => s.rowOrder);
  const table = useMemo(() => truthTable(expr, { order }), [expr, order]);
  const total = table.rows.length;
  /** Rows filled so far (0 = only the inputs are written). */
  const [filled, setFilled] = useState(0);
  const [playRequested, setPlayRequested] = useState(false);
  // Playback stops by itself at the last row; no effect needs to reset it.
  const playing = playRequested && filled < total;

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => setFilled((f) => Math.min(total, f + 1)), PLAY_MS);
    return () => window.clearTimeout(t);
  }, [playing, filled, total]);

  const step = (delta: number) => {
    setPlayRequested(false);
    setFilled((f) => Math.max(0, Math.min(total, f + delta)));
  };

  const columns: GridColumn[] = table.columns.map((col, i) => ({
    key: col.key,
    label: col.expr,
    values: col.values.map((v, r) => (r < filled ? v : null)),
    emphasis: i === table.columns.length - 1,
  }));
  const current = filled > 0 ? filled - 1 : null;
  const n = table.variables.length;
  const narration =
    current === null
      ? `Start with every combination of inputs: ${n} variable${n === 1 ? "" : "s"} gives 2${superscript(n)} = ${total} rows, listed in a fixed counting order so none are missed. Then work out the columns one row at a time.`
      : `Row ${current + 1}: ${explainRow(expr, table.rows[current].assignment, notation)}`;

  return (
    <div className="space-y-3" data-notation={notation}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <NotationToggle value={notation} onChange={setNotation} showCourse={false} />
          <RowOrderToggle notation={notation} />
        </div>
        <span className="text-[12px] text-faint">
          {filled} of {total} rows filled
        </span>
      </div>
      <TableGrid
        variables={table.variables}
        rows={table.rows.map((r) => r.inputs)}
        rowKeys={table.rows.map((r) => r.index)}
        columns={columns}
        notation={notation}
        activeRow={current}
        caption={caption}
      />
      <p className="min-h-[3.2em] rounded-xl bg-wash/70 px-3.5 py-2.5 text-[13.5px]" aria-live="polite">
        <RollingText text={narration} wrap className="block" />
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={filled === 0}
          className="h-9 rounded-lg border border-rule-strong bg-sheet px-3 text-[13px] font-medium disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={filled === total}
          className="h-9 rounded-lg bg-ink px-3.5 text-[13px] font-medium text-paper disabled:opacity-40"
        >
          {filled === 0 ? "Fill row 1" : "Next row"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (filled === total) {
              setFilled(0);
              setPlayRequested(true);
            } else {
              setPlayRequested(!playing);
            }
          }}
          className="h-9 rounded-lg border border-rule-strong bg-sheet px-3 text-[13px] font-medium"
        >
          {playing ? "Pause" : filled === total ? "Replay" : "Play"}
        </button>
        {filled < total && (
          <button type="button" onClick={() => step(total)} className="h-9 rounded-lg px-2 text-[13px] text-graphite hover:text-ink">
            Fill all
          </button>
        )}
      </div>
    </div>
  );
}

function superscript(n: number): string {
  const digits = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  return String(n)
    .split("")
    .map((d) => digits[Number(d)])
    .join("");
}
