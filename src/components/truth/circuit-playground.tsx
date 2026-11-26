"use client";

import { useMemo, useState } from "react";
import { evaluate, format, variablesOf, type Expr } from "@/lib/logic";
import { CircuitDiagram } from "./circuit-diagram";

/** Flip input switches and watch the signal travel through the gates. */
export function CircuitPlayground({ expr, caption }: { expr: Expr; caption?: string }) {
  const variables = useMemo(() => variablesOf(expr), [expr]);
  const [inputs, setInputs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(variables.map((v) => [v, true])),
  );
  const assignment = Object.fromEntries(variables.map((v) => [v, inputs[v] ?? true]));
  const out = evaluate(expr, assignment);

  return (
    <div className="rounded-xl border border-rule bg-sheet p-3.5" data-notation="gate">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-graphite">Inputs</span>
        {variables.map((v) => (
          <button
            key={v}
            type="button"
            role="switch"
            aria-checked={assignment[v]}
            onClick={() => setInputs((s) => ({ ...s, [v]: !(s[v] ?? true) }))}
            className={`expr flex h-8 items-center gap-2 rounded-lg border px-2.5 text-[13px] font-semibold transition-colors ${
              assignment[v]
                ? "border-transparent bg-[var(--accent-tint)] text-[var(--accent)]"
                : "border-rule-strong bg-sheet text-graphite"
            }`}
          >
            {v} = {assignment[v] ? "1" : "0"}
          </button>
        ))}
        <span className="ml-auto text-[12.5px] text-graphite">
          Output <span className="expr font-semibold text-ink">{format(expr, "electronics")}</span> ={" "}
          <span className={`expr font-semibold ${out ? "text-[var(--accent)]" : "text-graphite"}`}>{out ? "1" : "0"}</span>
        </span>
      </div>
      <CircuitDiagram expr={expr} assignment={assignment} />
      {caption && <p className="mt-2 text-[12.5px] text-graphite">{caption}</p>}
    </div>
  );
}
