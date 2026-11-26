"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { Lesson, Module } from "@/content/types";
import { useProgress, useProgressReady } from "@/lib/progress";
import { ExerciseView } from "@/components/exercises/exercises";
import { LessonBlock } from "./lesson-blocks";

export function LessonView({
  lesson,
  module,
  prev,
  next,
}: {
  lesson: Lesson;
  module: Module;
  prev: Lesson | null;
  next: Lesson | null;
}) {
  const ready = useProgressReady();
  const visit = useProgress((s) => s.visitLesson);
  const complete = useProgress((s) => s.completeLesson);
  const done = useProgress((s) => s.completedLessons.includes(lesson.slug));
  const allSolved = useProgress((s) => lesson.exercises.every((e) => s.solvedExercises.includes(e.id)));

  useEffect(() => {
    if (ready) visit(lesson.slug);
  }, [ready, visit, lesson.slug]);

  // Solving every exercise completes the lesson; the button is there for anyone who'd rather skip.
  useEffect(() => {
    if (ready && allSolved && !done) complete(lesson.slug);
  }, [ready, allSolved, done, complete, lesson.slug]);

  return (
    <article className="space-y-5">
      {lesson.blocks.map((block, i) => (
        <LessonBlock key={i} block={block} />
      ))}

      <h2 className="pt-4 text-[16px] font-semibold tracking-tight">Try it yourself</h2>
      <div className="space-y-4">
        {lesson.exercises.map((ex, i) => (
          <ExerciseView key={ex.id} exercise={ex} index={i + 1} />
        ))}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5">
        <div className="flex items-center gap-3">
          {ready && done ? (
            <span className="rounded-full bg-good-tint px-2.5 py-1 text-[12.5px] font-medium text-good">Lesson complete</span>
          ) : (
            <button
              type="button"
              onClick={() => complete(lesson.slug)}
              className="h-9 rounded-lg border border-rule-strong bg-sheet px-3 text-[13px] font-medium hover:border-ink"
            >
              Mark as complete
            </button>
          )}
        </div>
        <nav aria-label="Lesson navigation" className="flex gap-2">
          {prev && (
            <Link href={`/teach/${prev.slug}`} className="h-9 rounded-lg px-3 py-2 text-[13px] text-graphite hover:text-ink">
              Previous: {prev.title}
            </Link>
          )}
          {next ? (
            <Link
              href={`/teach/${next.slug}`}
              className="inline-flex h-9 items-center rounded-lg bg-ink px-3.5 text-[13px] font-medium text-paper"
            >
              Next: {next.title}
            </Link>
          ) : (
            <Link
              href="/experiment"
              className="inline-flex h-9 items-center rounded-lg bg-ink px-3.5 text-[13px] font-medium text-paper"
            >
              All done. Open the sandbox
            </Link>
          )}
        </nav>
      </footer>
      <p className="sr-only">Module {module.number}</p>
    </article>
  );
}
