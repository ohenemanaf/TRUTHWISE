import { MODULE_1, MODULE_2, MODULE_3 } from "./modules-a";
import { MODULE_4, MODULE_5, MODULE_6 } from "./modules-b";
import type { Lesson, Module } from "./types";

export const MODULES: readonly Module[] = [MODULE_1, MODULE_2, MODULE_3, MODULE_4, MODULE_5, MODULE_6];

export interface LessonRef {
  readonly lesson: Lesson;
  readonly module: Module;
  readonly prev: Lesson | null;
  readonly next: Lesson | null;
  readonly position: number;
}

const ALL: readonly { lesson: Lesson; module: Module }[] = MODULES.flatMap((module) =>
  module.lessons.map((lesson) => ({ lesson, module })),
);

export const LESSON_COUNT = ALL.length;

export function allLessons(): readonly { lesson: Lesson; module: Module }[] {
  return ALL;
}

export function findLesson(slug: string): LessonRef | null {
  const i = ALL.findIndex((x) => x.lesson.slug === slug);
  if (i < 0) return null;
  return {
    ...ALL[i],
    prev: ALL[i - 1]?.lesson ?? null,
    next: ALL[i + 1]?.lesson ?? null,
    position: i + 1,
  };
}
