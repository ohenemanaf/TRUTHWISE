"use client";

import { useMemo } from "react";
import { assignments, evaluate, format, parseOrThrow, variablesOf } from "@/lib/logic";
import { NOTATION } from "@/lib/notation";
import { useProgress } from "@/lib/progress";
import { NotationToggle } from "./notation-toggle";
import { TableGrid } from "./table-grid";

/**
 * Two expressions in one table. They're equivalent exactly when their columns
 * match on every row; any row where they differ is highlighted.
 */
export function CompareTable({ left, right }: { left: string; right: string }) {
  const notation = useProgress((s) => s.notation);
  const setNotation = useProgress((s) => s.setNotation);
  const data = useMemo(() => {
    const l = parseOrThrow(left);
    const r = parseOrThrow(right);
    const variables = variablesOf(l, r);
    const rows = assignments(variables);
    const lv = rows.map((row) => evaluate(l, row.assignment));
    const rv = rows.map((row) => evaluate(r, row.assignment));
    return { l, r, variables, rows, lv, rv, same: lv.every((v, i) => v === rv[i]) };
  }, [left, right]);
  const text = NOTATION[notation].text;

  return (
    <div className="space-y-3" data-notation={notation}>
      <div className="flex justify-end">
        <NotationToggle value={notation} onChange={setNotation} showCourse={false} />
      </div>
      <TableGrid
        variables={data.variables}
        rows={data.rows.map((r) => r.inputs)}
        columns={[
          { key: "l", label: data.l, values: data.lv, emphasis: true },
          { key: "r", label: data.r, values: data.rv, emphasis: true },
        ]}
        notation={notation}
        rowTone={(i) => (data.lv[i] !== data.rv[i] ? "wrong" : undefined)}
      />
      <p className={`rounded-xl px-3.5 py-2.5 text-[13.5px] ${data.same ? "bg-good-tint" : "bg-bad-tint"}`}>
        {data.same ? (
          <>
            <strong>Equivalent.</strong> The two columns match in every row, so{" "}
            <span className="expr">{format(data.l, text)}</span> and <span className="expr">{format(data.r, text)}</span>{" "}
            can always replace each other.
          </>
        ) : (
          <>
            <strong>Not equivalent.</strong> The highlighted rows give different answers, so one can&apos;t replace the
            other.
          </>
        )}
      </p>
    </div>
  );
}
