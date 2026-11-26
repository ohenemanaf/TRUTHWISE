"use client";

import { useEffect } from "react";
import type { Mistake } from "@/content/mistakes";
import { useProgress, useProgressReady } from "@/lib/progress";
import { RichText } from "@/components/rich-text";
import { LessonBlock } from "@/components/teach/lesson-blocks";

/** Wrong reasoning, then the truth table that disproves it, then the fix. */
export function MistakeView({ mistake }: { mistake: Mistake }) {
  const ready = useProgressReady();
  const view = useProgress((s) => s.viewMistake);
  useEffect(() => {
    if (ready) view(mistake.slug);
  }, [ready, view, mistake.slug]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-bad/25 bg-bad-tint/50 p-4">
        <h2 className="mb-1.5 text-[13px] font-semibold text-bad">The wrong reasoning</h2>
        <RichText text={mistake.wrong} className="text-[14.5px]" />
      </section>

      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold text-graphite">Why it&apos;s wrong</h2>
        <RichText text={mistake.why} className="text-[14.5px] leading-relaxed" />
        {mistake.evidence.map((block, i) => (
          <LessonBlock key={i} block={block} />
        ))}
      </section>

      <section className="rounded-2xl border border-good/25 bg-good-tint/50 p-4">
        <h2 className="mb-1.5 text-[13px] font-semibold text-good">The correct version</h2>
        <RichText text={mistake.right} className="text-[14.5px]" />
      </section>
    </div>
  );
}
