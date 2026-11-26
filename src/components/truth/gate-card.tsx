"use client";

import { useMemo } from "react";
import { GATES } from "@/content/gates";
import { format, parseOrThrow, truthTable, type GateType } from "@/lib/logic";
import { valueLabel, type Notation } from "@/lib/notation";
import { CircuitDiagram } from "./circuit-diagram";

/** One gate: symbol, compact truth table and the expression in every notation. */
export function GateCard({ gate, notation = "binary" }: { gate: GateType; notation?: Notation }) {
  const info = GATES[gate];
  const expr = useMemo(() => parseOrThrow(info.expr), [info.expr]);
  const table = useMemo(() => truthTable(expr), [expr]);

  return (
    <article className="flex flex-col rounded-xl border border-rule bg-sheet p-3.5" data-notation="gate">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[14px] font-semibold">{gate}</h3>
        <span className="expr flex gap-3 text-[12px]">
          <span className="text-binary">{format(expr, "electronics")}</span>
          <span className="text-tf">{format(expr, "symbolic")}</span>
          <span className="text-code">{format(expr, "code")}</span>
        </span>
      </div>
      <p className="mt-1 text-[12.5px] text-graphite">{info.meaning}</p>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <CircuitDiagram expr={expr} showGateNames={false} title={`${gate} gate symbol`} />
        <table className="expr text-[12px] tabular-nums">
          <thead>
            <tr className="text-faint">
              {table.variables.map((v) => (
                <th key={v} scope="col" className="px-1.5 font-medium">
                  {v}
                </th>
              ))}
              <th scope="col" className="border-l border-rule px-1.5 font-medium">
                out
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r) => (
              <tr key={r.index}>
                {r.inputs.map((v, i) => (
                  <td key={i} className="px-1.5 text-center text-graphite">
                    {valueLabel(v, notation)}
                  </td>
                ))}
                <td
                  className={`border-l border-rule px-1.5 text-center font-semibold ${
                    r.output ? "text-[var(--accent)]" : "text-graphite"
                  }`}
                >
                  {valueLabel(r.output, notation)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
