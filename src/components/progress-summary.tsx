"use client";

import Link from "next/link";
import { LESSON_COUNT, findLesson } from "@/content/modules";
import { MISTAKES } from "@/content/mistakes";
import { useProgress, useProgressReady } from "@/lib/progress";

/** Progress across the whole app, with a way to start over. */
export function ProgressSummary() {
  const ready = useProgressReady();
  const { completedLessons, viewedMistakes, lastLesson, reset } = useProgress();
  if (!ready) return <div className="mb-6 h-[58px]" aria-hidden="true" />;

  const last = lastLesson ? findLesson(lastLesson) : null;
  const pct = Math.round((completedLessons.length / LESSON_COUNT) * 100);
  const started = completedLessons.length > 0 || viewedMistakes.length > 0 || last;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-rule bg-sheet px-4 py-3">
      <div className="min-w-[180px] flex-1">
        <div className="flex justify-between text-[12.5px]">
          <span className="font-medium">
            {completedLessons.length} of {LESSON_COUNT} lessons
          </span>
          <span className="text-faint">{pct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-wash" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Lessons completed">
          <div className="h-full rounded-full bg-tf transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <p className="text-[12.5px] text-graphite">
        {viewedMistakes.length} of {MISTAKES.length} mistakes studied
      </p>
      {last && (
        <Link href={`/teach/${last.lesson.slug}`} className="text-[13px] font-medium underline-offset-2 hover:underline">
          Continue: {last.lesson.title}
        </Link>
      )}
      {started && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Clear all saved progress on this device?")) reset();
          }}
          className="text-[12.5px] text-faint hover:text-bad"
        >
          Reset progress
        </button>
      )}
    </div>
  );
}
