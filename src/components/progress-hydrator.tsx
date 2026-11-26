"use client";

import { useEffect } from "react";
import { useProgress } from "@/lib/progress";

/** Loads saved progress once, after the first render, so SSR markup matches. */
export function ProgressHydrator() {
  useEffect(() => {
    void useProgress.persist.rehydrate();
  }, []);
  return null;
}
