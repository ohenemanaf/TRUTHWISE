"use client";

import { useMemo } from "react";
import { checkArgument, format, parseArgument } from "@/lib/logic";
import { NOTATION, valueLabel } from "@/lib/notation";
import { useProgress } from "@/lib/progress";
import { NotationToggle } from "./notation-toggle";
import { RowOrderToggle } from "./row-order-toggle";
import { TableGrid, type GridColumn } from "./table-grid";

/**
 * Validity, made visible. Rows where every premise is true are tinted: they
 * are the only rows that matter. A red row is a counterexample (premises
 * true, conclusion false), and a single one makes the argument invalid.
 */
export function ArgumentTable({
  argument,
  showVerdict = true,
  showToggle = true,
}: {
  /** e.g. "P → Q, P ∴ Q" */
  argument: string;
  showVerdict?: boolean;
  showToggle?: boolean;
}) {
  const notation = useProgress((s) => s.notation);
  const setNotation = useProgress((s) => s.setNotation);
  const order = useProgress((s) => s.rowOrder);
  const report = useMemo(() => {
    const parsed = parseArgument(argument);
    if (!parsed.ok) throw new Error(`Bad argument in content: ${argument} (${parsed.error.message})`);
    return checkArgument(parsed.argument, order);
  }, [argument, order]);

  const text = NOTATION[notation].text;
  const { premises, conclusion } = report.argument;
  const columns: GridColumn[] = [
    ...premises.map((p, i) => ({
      key: `p${i}`,
      label: p,
      caption: `premise ${i + 1}`,
      values: report.rows.map((r) => r.premises[i]),
    })),
    {
      key: "c",
      label: conclusion,
      caption: "conclusion",
      values: report.rows.map((r) => r.conclusion),
      emphasis: true,
    },
  ];
  const first = report.counterexamples[0];

  return (
    <div className="space-y-3" data-notation={notation}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="expr text-[14px]">
          {premises.map((p) => format(p, text)).join(",  ")}
          <span className="mx-2 text-faint">∴</span>
          {format(conclusion, text)}
        </p>
        {showToggle && (
          <div className="flex flex-wrap gap-2">
            <RowOrderToggle notation={notation} />
            <NotationToggle value={notation} onChange={setNotation} showCourse={false} />
          </div>
        )}
      </div>
      <TableGrid
        variables={report.variables}
        rows={report.rows.map((r) => r.inputs)}
        rowKeys={report.rows.map((r) => r.index)}
        columns={columns}
        notation={notation}
        rowTone={(i) => (report.rows[i].counterexample ? "counterexample" : report.rows[i].critical ? "critical" : undefined)}
        caption="Argument truth table"
      />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-graphite">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-[var(--accent-tint)]" /> every premise true
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-bad-tint" /> premises true, conclusion false
        </span>
      </div>
      {showVerdict && (
        <p
          className={`rounded-xl px-3.5 py-2.5 text-[13.5px] ${
            report.valid ? "bg-good-tint text-ink" : "bg-bad-tint text-ink"
          }`}
        >
          {report.valid ? (
            report.inconsistentPremises ? (
              <>
                <strong>Valid, but only vacuously.</strong> No row makes all the premises true at once, so there is
                no row where they could mislead you.
              </>
            ) : (
              <>
                <strong>Valid.</strong> In every row where all the premises are true, the conclusion is true as well.
                There is no counterexample.
              </>
            )
          ) : (
            <>
              <strong>Invalid.</strong> Row{" "}
              {report.variables.map((v) => `${v} = ${valueLabel(first.assignment[v], notation)}`).join(", ")} makes
              every premise true but the conclusion false. One counterexample is enough.
            </>
          )}
        </p>
      )}
    </div>
  );
}
