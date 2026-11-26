"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { classify, parse, simplify, singleGate, variablesOf, type Classification, type Expr } from "@/lib/logic";
import { NOTATION, type Notation } from "@/lib/notation";
import { useProgress } from "@/lib/progress";
import { ExpressionInput } from "@/components/truth/expression-input";
import { SimplifySteps } from "@/components/truth/simplify-steps";
import { TruthPanel } from "@/components/truth/truth-panel";

/** Readable table limit for the sandbox (64 rows). The engine itself allows more. */
const SANDBOX_MAX_VARIABLES = 6;

const EXAMPLES = [
  "A AND B",
  "a && !b",
  "P → Q",
  "¬(¬A ∧ ¬B)",
  "(A ∧ B) ∨ (A ∧ ¬B)",
  "A XOR B XOR C",
  "!(isAdmin || isOwner)",
  "(P → Q) ∧ P → Q",
];

const CLASSIFICATION_COPY: Record<Classification, { title: string; body: string }> = {
  tautology: { title: "Tautology", body: "True in every row, whatever the inputs." },
  contradiction: { title: "Contradiction", body: "False in every row. It can never be satisfied." },
  contingency: { title: "Contingency", body: "True in some rows, false in others." },
};

export function Sandbox({ initial = "A AND NOT B" }: { initial?: string }) {
  const [text, setText] = useState(initial);
  const deferred = useDeferredValue(text);
  const parsed = useMemo(() => parse(deferred), [deferred]);
  // While the student is mid-edit (and the text doesn't parse), keep showing the last good expression.
  const [lastGood, setLastGood] = useState<Expr | null>(() => {
    const r = parse(initial);
    return r.ok ? r.expr : null;
  });
  if (parsed.ok && parsed.expr !== lastGood) setLastGood(parsed.expr);

  const expr = parsed.ok ? parsed.expr : lastGood;
  const variableCount = expr ? variablesOf(expr).length : 0;
  const notation = useProgress((s) => s.notation);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-rule bg-sheet p-4">
        <ExpressionInput value={text} onChange={setText} error={parsed.ok ? null : parsed.error} autoFocus />
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[12px] text-faint">Try</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setText(ex)}
              className="expr rounded-full border border-rule px-2.5 py-0.5 text-[12px] text-graphite hover:border-rule-strong hover:text-ink"
            >
              {ex}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-faint">
          Mix notations freely. <span className="expr">∧ && AND ·</span> all mean AND,{" "}
          <span className="expr">∨ || OR +</span> mean OR, and <span className="expr">¬ ! NOT A&apos;</span> mean NOT.{" "}
          <span className="expr">==</span> is ↔ and <span className="expr">!=</span> is XOR.
        </p>
      </div>

      {!expr ? null : variableCount > SANDBOX_MAX_VARIABLES ? (
        <p className="rounded-xl border border-dashed border-rule-strong p-4 text-[13px] text-graphite">
          That uses {variableCount} variables, which would be {2 ** variableCount} rows. Keep it to{" "}
          {SANDBOX_MAX_VARIABLES} or fewer so the table stays readable.
        </p>
      ) : (
        <>
          <TruthPanel expr={expr} />
          <Facts expr={expr} notation={notation} />
        </>
      )}
    </div>
  );
}

function Facts({ expr, notation }: { expr: Expr; notation: Notation }) {
  const simplification = useMemo(() => simplify(expr), [expr]);
  const kind = classify(expr);
  const gate = singleGate(expr);
  const copy = CLASSIFICATION_COPY[kind];

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" data-notation={notation}>
      <section className="rounded-2xl border border-rule bg-sheet p-4">
        <h2 className="mb-2 text-[14px] font-semibold">Simplify</h2>
        <SimplifySteps simplification={simplification} notation={NOTATION[notation].text} />
      </section>
      <section className="rounded-2xl border border-rule bg-sheet p-4">
        <h2 className="mb-2 text-[14px] font-semibold">What kind of expression is this?</h2>
        <p className="text-[13.5px]">
          <span className="font-semibold">{copy.title}.</span> <span className="text-graphite">{copy.body}</span>
        </p>
        {gate && (
          <p className="mt-2 text-[13.5px] text-graphite">
            It&apos;s a single <span className="font-semibold text-ink">{gate}</span> gate.
          </p>
        )}
        {simplification.steps.some((s) => s.law === "minimal-form") && (
          <p className="mt-2 text-[12.5px] text-faint">
            The last step reads the minimum straight off the truth table, as a Karnaugh map would. The named laws alone
            stopped short of it.
          </p>
        )}
      </section>
    </div>
  );
}
