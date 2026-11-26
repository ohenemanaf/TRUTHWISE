"use client";

import Link from "next/link";
import { MODULES } from "@/content/modules";
import { useProgress, useProgressReady } from "@/lib/progress";

/** All modules and lessons, with ticks for finished ones. Nothing is locked. */
export function ModuleList() {
  const ready = useProgressReady();
  const completed = useProgress((s) => s.completedLessons);
  const isDone = (slug: string) => ready && completed.includes(slug);

  return (
    <ol className="space-y-6">
      {MODULES.map((m) => {
        const doneCount = m.lessons.filter((l) => isDone(l.slug)).length;
        return (
          <li key={m.id} className="grid gap-x-6 gap-y-2 md:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <p className="flex items-center gap-2 text-[12px] text-graphite">
                <span className="size-2 rounded-full" style={{ background: m.color }} aria-hidden="true" />
                Module {m.number}, {m.framing}
              </p>
              <h2 className="mt-0.5 text-[16px] font-semibold tracking-tight">{m.title}</h2>
              <p className="text-[12px] text-faint">
                {ready ? `${doneCount} of ${m.lessons.length} done` : `${m.lessons.length} lessons`}
              </p>
            </div>
            <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-sheet">
              {m.lessons.map((l) => (
                <li key={l.slug}>
                  <Link href={`/teach/${l.slug}`} className="flex items-start gap-3 px-3.5 py-3 hover:bg-wash/60">
                    <span
                      className={`mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full border text-[10px] ${
                        isDone(l.slug) ? "border-good bg-good text-white" : "border-rule-strong"
                      }`}
                      aria-label={isDone(l.slug) ? "Completed" : "Not completed"}
                    >
                      {isDone(l.slug) ? "✓" : ""}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium">{l.title}</span>
                      <span className="block text-[12.5px] text-graphite">{l.summary}</span>
                    </span>
                    <span className="ml-auto shrink-0 text-[12px] text-faint">{l.minutes} min</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
