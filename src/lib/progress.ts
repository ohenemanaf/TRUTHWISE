"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Notation } from "./notation";

/**
 * Everything the app remembers, kept in localStorage. Nothing is ever locked
 * behind progress: this only powers ticks, "continue where you left off" and
 * the preferred notation.
 */
interface ProgressState {
  completedLessons: string[];
  /** Exercise ids answered correctly. */
  solvedExercises: string[];
  viewedMistakes: string[];
  lastLesson: string | null;
  notation: Notation;
  completeLesson: (id: string) => void;
  solveExercise: (id: string) => void;
  viewMistake: (id: string) => void;
  visitLesson: (id: string) => void;
  setNotation: (n: Notation) => void;
  reset: () => void;
}

const addUnique = (list: string[], id: string) => (list.includes(id) ? list : [...list, id]);

const initial = {
  completedLessons: [],
  solvedExercises: [],
  viewedMistakes: [],
  lastLesson: null,
  notation: "tf" as Notation,
};

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      ...initial,
      completeLesson: (id) => set((s) => ({ completedLessons: addUnique(s.completedLessons, id) })),
      solveExercise: (id) => set((s) => ({ solvedExercises: addUnique(s.solvedExercises, id) })),
      viewMistake: (id) => set((s) => ({ viewedMistakes: addUnique(s.viewedMistakes, id) })),
      visitLesson: (id) => set({ lastLesson: id }),
      setNotation: (notation) => set({ notation }),
      reset: () => set(initial),
    }),
    {
      name: "truthwise-progress",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Hydrated by <ProgressHydrator /> after mount, so server HTML and the
      // first client render match.
      skipHydration: true,
    },
  ),
);

const subscribeHydration = (onChange: () => void) => useProgress.persist.onFinishHydration(onChange);

/**
 * True once saved progress has been read from localStorage. Render
 * progress-dependent UI (ticks, counts) only after this, to avoid a flash of
 * "nothing done" or a hydration mismatch.
 */
export function useProgressReady(): boolean {
  return useSyncExternalStore(
    subscribeHydration,
    () => useProgress.persist.hasHydrated(),
    () => false,
  );
}
