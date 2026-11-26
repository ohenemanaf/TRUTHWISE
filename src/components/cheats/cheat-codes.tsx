"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ARGUMENT_FORMS, ROSETTA } from "@/content/reference";
import { GATES } from "@/content/gates";
import {
  GATE_TYPES,
  LAWS,
  checkArgument,
  format,
  parseArgument,
  parseOrThrow,
  signature,
  type TextNotation,
} from "@/lib/logic";
import { NOTATION, valueLabel } from "@/lib/notation";
import { useProgress } from "@/lib/progress";
import { NotationToggle } from "@/components/truth/notation-toggle";
import { GateCard } from "@/components/truth/gate-card";
import { MiniGate } from "./mini-gate";

const NOTATION_COLUMNS: readonly { notation: TextNotation; course: string; color: string }[] = [
  { notation: "electronics", course: "Electronics", color: "var(--color-binary)" },
  { notation: "symbolic", course: "Discrete maths", color: "var(--color-tf)" },
  { notation: "code", course: "Code", color: "var(--color-code)" },
  { notation: "word", course: "Words", color: "var(--color-word)" },
];

const matches = (query: string, ...haystack: string[]) =>
  query === "" || haystack.some((h) => h.toLowerCase().includes(query));

export function CheatCodes() {
  const notation = useProgress((s) => s.notation);
  const setNotation = useProgress((s) => s.setNotation);
  const [rawQuery, setQuery] = useState("");
  const query = useDeferredValue(rawQuery.trim().toLowerCase());
  const text = NOTATION[notation].text;

  // Every searchable string per item, in all notations, so "&&" finds AND and "nand" finds ↑.
  const allForms = (expr: string) => NOTATION_COLUMNS.map((c) => format(parseOrThrow(expr), c.notation));

  const rosetta = ROSETTA.filter((r) => matches(query, r.concept, r.everyday, r.gate ?? "", ...allForms(r.expr)));
  const gates = GATE_TYPES.filter((g) => matches(query, g, GATES[g].meaning, ...allForms(GATES[g].expr)));
  const laws = LAWS.filter((l) =>
    matches(query, l.name, l.aka ?? "", l.explanation, ...l.forms.flatMap((f) => [...allForms(f.left), ...allForms(f.right)])),
  );
  const forms = useMemo(
    () =>
      ARGUMENT_FORMS.map((f) => {
        const parsed = parseArgument(f.argument);
        if (!parsed.ok) throw new Error(f.argument);
        return { ...f, report: checkArgument(parsed.argument) };
      }),
    [],
  );
  const shownForms = forms.filter((f) => matches(query, f.name, f.example, f.argument, f.looksLike ?? ""));
  const nothing = rosetta.length + gates.length + laws.length + shownForms.length === 0;

  return (
    <div data-notation={notation}>
      <div className="sticky top-14 z-20 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b border-rule bg-paper/95 px-4 py-3 backdrop-blur">
        <input
          type="search"
          value={rawQuery}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search: de morgan, &&, nand, modus…"
          aria-label="Search the cheat codes"
          className="h-10 min-w-0 flex-1 rounded-xl border border-rule-strong bg-sheet px-3.5 text-[14px] outline-none focus:border-[var(--accent)]"
        />
        <NotationToggle value={notation} onChange={setNotation} showCourse={false} />
      </div>

      {nothing && (
        <p className="rounded-xl border border-dashed border-rule-strong p-5 text-center text-graphite">
          Nothing matches “{rawQuery}”. Try a gate name, a law, or a symbol like ↔.
        </p>
      )}

      {rosetta.length > 0 && (
        <Section id="rosetta" title="Notation Rosetta Stone" intro="The same connective in every course's notation. This is the cross-reference the whole app is built around.">
          <div className="overflow-x-auto rounded-xl border border-rule bg-sheet">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="border-b border-rule bg-wash/60 text-left text-[12px]">
                  <th scope="col" className="px-3 py-2 font-medium text-graphite">Concept</th>
                  <th scope="col" className="px-3 py-2 font-medium text-graphite">Gate</th>
                  {NOTATION_COLUMNS.map((c) => (
                    <th key={c.notation} scope="col" className="px-3 py-2 font-medium" style={{ color: c.color }}>
                      {c.course}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2 font-medium text-graphite">Output column</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-rule">
                  <th scope="row" className="px-3 py-2 text-left font-medium">Values</th>
                  <td className="px-3 py-2 text-faint">high / low</td>
                  <td className="expr px-3 py-2">1 / 0</td>
                  <td className="expr px-3 py-2">T / F</td>
                  <td className="expr px-3 py-2">true / false</td>
                  <td className="expr px-3 py-2">TRUE / FALSE</td>
                  <td className="px-3 py-2 text-faint">rows in 00, 01, 10, 11 order</td>
                </tr>
                {rosetta.map((r) => {
                  const expr = parseOrThrow(r.expr);
                  return (
                    <tr key={r.concept} className="border-b border-rule last:border-b-0">
                      <th scope="row" className="px-3 py-2 text-left align-middle font-medium">
                        {r.concept}
                        <span className="block text-[12px] font-normal text-graphite">{r.everyday}</span>
                      </th>
                      <td className="px-3 py-1 align-middle">
                        {r.gate ? <MiniGate gate={r.gate} /> : <span className="text-[12px] text-faint">NOT + OR</span>}
                      </td>
                      {NOTATION_COLUMNS.map((c) => (
                        <td key={c.notation} className="expr px-3 py-2 align-middle whitespace-nowrap" style={{ color: c.color }}>
                          {format(expr, c.notation)}
                        </td>
                      ))}
                      <td className="expr px-3 py-2 align-middle tracking-[0.2em]">
                        {signature(expr)
                          .split("")
                          .map((bit) => valueLabel(bit === "1", notation))
                          .join(notation === "code" ? " " : "")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {gates.length > 0 && (
        <Section id="gates" title="Logic gates">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gates.map((g) => (
              <GateCard key={g} gate={g} notation={notation === "tf" || notation === "code" ? notation : "binary"} />
            ))}
          </div>
        </Section>
      )}

      {laws.length > 0 && (
        <Section id="laws" title="Boolean algebra laws" intro="Each law is checked by the app's own truth-table engine, so every pair below really is equivalent.">
          <div className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-sheet">
            {laws.map((law) => (
              <article key={law.id} className="grid gap-x-6 gap-y-1 px-4 py-3 md:grid-cols-[200px_minmax(0,1fr)]">
                <div>
                  <h3 className="text-[14px] font-semibold">{law.name}</h3>
                  {law.aka && <p className="text-[12px] text-faint">{law.aka}</p>}
                </div>
                <div>
                  <ul className="flex flex-wrap gap-x-6 gap-y-1">
                    {law.forms.map((f) => (
                      <li key={f.left + f.right} className="expr text-[13.5px]">
                        {format(parseOrThrow(f.left), text)} <span className="text-faint">≡</span>{" "}
                        <span className="text-[var(--accent)]">{format(parseOrThrow(f.right), text)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-[12.5px] text-graphite">{law.explanation}</p>
                </div>
              </article>
            ))}
          </div>
        </Section>
      )}

      {shownForms.length > 0 && (
        <Section id="arguments" title="Argument forms" intro="Valid forms and the invalid look-alikes that get mistaken for them. Each verdict comes from the truth table, not from a lookup.">
          <div className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-sheet">
            {shownForms.map((f) => {
              const { premises, conclusion } = f.report.argument;
              return (
                <article key={f.name} className="grid gap-x-6 gap-y-1 px-4 py-3 md:grid-cols-[200px_minmax(0,1fr)_auto]">
                  <div>
                    <h3 className="text-[14px] font-semibold">{f.name}</h3>
                    {f.looksLike && <p className="text-[12px] text-faint">Often mistaken for {f.looksLike.toLowerCase()}</p>}
                  </div>
                  <div className="min-w-0">
                    <p className="expr text-[13.5px]">
                      {premises.map((p) => format(p, text)).join(",  ")}
                      <span className="mx-2 text-faint">∴</span>
                      {format(conclusion, text)}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-graphite">{f.example}</p>
                  </div>
                  <span
                    className={`self-start justify-self-start rounded-full px-2 py-0.5 text-[11.5px] font-medium md:justify-self-end ${
                      f.report.valid ? "bg-good-tint text-good" : "bg-bad-tint text-bad"
                    }`}
                  >
                    {f.report.valid ? "Valid" : "Invalid"}
                  </span>
                </article>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10 scroll-mt-32">
      <h2 className="text-[18px] font-semibold tracking-tight">{title}</h2>
      {intro && <p className="mt-0.5 mb-3 max-w-[70ch] text-[13.5px] text-graphite">{intro}</p>}
      {!intro && <div className="mb-3" />}
      {children}
    </section>
  );
}
