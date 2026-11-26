"use client";

import { useMemo } from "react";
import type { Block } from "@/content/types";
import { parseOrThrow, simplify } from "@/lib/logic";
import { NOTATION } from "@/lib/notation";
import { useProgress } from "@/lib/progress";
import { RichText } from "@/components/rich-text";
import { ArgumentTable } from "@/components/truth/argument-table";
import { CircuitPlayground } from "@/components/truth/circuit-playground";
import { CompareTable } from "@/components/truth/compare-table";
import { GateCard } from "@/components/truth/gate-card";
import { SimplifySteps } from "@/components/truth/simplify-steps";
import { TableBuilder } from "@/components/truth/table-builder";
import { TruthPanel } from "@/components/truth/truth-panel";

export function LessonBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "text":
      return <RichText text={block.text} className="text-[14.5px] leading-relaxed" />;
    case "build":
      return (
        <Framed title="Build it row by row">
          <TableBuilder expr={parseOrThrow(block.expr)} caption={block.caption} />
        </Framed>
      );
    case "bridge":
      return (
        <Framed title="The notation bridge" tone="bridge">
          {block.text && <RichText text={block.text} className="mb-3 text-[13.5px] text-graphite" />}
          <TruthPanel expr={parseOrThrow(block.expr)} />
        </Framed>
      );
    case "table":
      return <TruthPanel expr={parseOrThrow(block.expr)} workingColumns={block.working ?? true} />;
    case "circuit":
      return <CircuitPlayground expr={parseOrThrow(block.expr)} caption={block.caption} />;
    case "gates":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {block.gates.map((g) => (
            <GateCard key={g} gate={g} />
          ))}
        </div>
      );
    case "simplify":
      return <SimplifyBlock expr={block.expr} text={block.text} />;
    case "argument":
      return (
        <Framed title={block.title ?? "Check it with a truth table"}>
          <ArgumentTable argument={block.argument} />
        </Framed>
      );
    case "compare":
      return (
        <Framed title="Compare the columns">
          {block.text && <RichText text={block.text} className="mb-3 text-[13.5px] text-graphite" />}
          <CompareTable left={block.left} right={block.right} />
        </Framed>
      );
    case "code":
      return (
        <figure>
          <pre className="expr overflow-x-auto rounded-xl bg-[#1d2335] p-3.5 text-[12.5px] leading-relaxed text-[#d9deea]">
            {block.code}
          </pre>
          {block.caption && <figcaption className="mt-1.5 text-[12.5px] text-graphite">{block.caption}</figcaption>}
        </figure>
      );
    case "callout":
      return (
        <aside className="rounded-xl border-l-[3px] border-[var(--color-tf)] bg-sheet px-4 py-3">
          <RichText text={block.text} className="text-[13.5px]" />
        </aside>
      );
  }
}

function SimplifyBlock({ expr, text }: { expr: string; text?: string }) {
  const notation = useProgress((s) => s.notation);
  const result = useMemo(() => simplify(parseOrThrow(expr)), [expr]);
  return (
    <Framed title="Simplify, one law at a time">
      {text && <RichText text={text} className="mb-3 text-[13.5px] text-graphite" />}
      <div data-notation={notation}>
        <SimplifySteps simplification={result} notation={NOTATION[notation].text} />
      </div>
    </Framed>
  );
}

function Framed({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "bridge" }) {
  return (
    <section
      className={`rounded-2xl border bg-sheet p-4 ${tone === "bridge" ? "border-[var(--color-tf)]/35" : "border-rule"}`}
    >
      <h3 className="mb-3 text-[13px] font-semibold text-graphite">{title}</h3>
      {children}
    </section>
  );
}
