"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { format, truthTable, type Expr } from "@/lib/logic";
import { NOTATION, type Notation } from "@/lib/notation";
import { useProgress } from "@/lib/progress";
import { CircuitDiagram } from "./circuit-diagram";
import { CodeView } from "./code-view";
import { NotationToggle } from "./notation-toggle";
import { RollingText } from "./rolling-text";
import { RosettaList } from "./rosetta-list";
import { TableGrid, type GridColumn } from "./table-grid";

/**
 * A truth table you can read in any course's notation. The table, its
 * headers, the expression and the side view all change together when you
 * switch notation; the logic underneath never does.
 */
export function TruthPanel({
  expr,
  notation: controlled,
  onNotationChange,
  workingColumns = true,
  hideToggle = false,
  label,
}: {
  expr: Expr;
  /** Omit to use (and update) the learner's saved preference. */
  notation?: Notation;
  onNotationChange?: (n: Notation) => void;
  /** Show intermediate columns (¬A, A ∧ B …) as well as the result. */
  workingColumns?: boolean;
  hideToggle?: boolean;
  label?: string;
}) {
  const saved = useProgress((s) => s.notation);
  const setSaved = useProgress((s) => s.setNotation);
  const notation = controlled ?? saved;
  const setNotation = onNotationChange ?? setSaved;

  const table = useMemo(() => truthTable(expr), [expr]);
  const [selected, setSelected] = useState<number | null>(null);
  // Default to the all-ones row: it lights the most wires.
  const selectedRow = selected !== null && selected < table.rows.length ? selected : table.rows.length - 1;
  const assignment = table.rows[selectedRow]?.assignment ?? null;

  const columns: GridColumn[] = (workingColumns ? table.columns : table.columns.slice(-1)).map((col, i, all) => ({
    key: col.key,
    label: col.expr,
    values: col.values,
    emphasis: i === all.length - 1,
  }));
  const info = NOTATION[notation];

  return (
    <section data-notation={notation} aria-label={label ?? "Truth table"} className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] text-graphite">
            <RollingText text={`As written in ${info.course}`} />
          </p>
          <p className="expr text-[18px] font-semibold text-[var(--accent)] transition-colors duration-300 break-words">
            <RollingText text={format(expr, info.text)} />
          </p>
        </div>
        {!hideToggle && <NotationToggle value={notation} onChange={setNotation} />}
      </div>

      <div className="grid items-start gap-3 md:grid-cols-[minmax(0,auto)_minmax(0,1fr)]">
        <TableGrid
          variables={table.variables}
          rows={table.rows.map((r) => r.inputs)}
          columns={columns}
          notation={notation}
          selectedRow={notation === "gate" || notation === "code" ? selectedRow : null}
          onSelectRow={setSelected}
          caption={`Truth table for ${format(expr)}`}
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={notation === "binary" || notation === "tf" ? "rosetta" : notation}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="min-w-0"
          >
            {notation === "gate" ? (
              <div className="rounded-xl border border-rule bg-sheet p-3">
                <CircuitDiagram expr={expr} assignment={assignment} />
                <p className="mt-2 text-[12px] text-graphite">Pick a row of the table to send its inputs through the circuit.</p>
              </div>
            ) : notation === "code" ? (
              <div className="space-y-2">
                <CodeView expr={expr} assignment={assignment} />
                <p className="text-[12px] text-graphite">Pick a row to run the condition with those values.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[12px] text-graphite">The same expression in each course:</p>
                <RosettaList expr={expr} current={info.text} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
