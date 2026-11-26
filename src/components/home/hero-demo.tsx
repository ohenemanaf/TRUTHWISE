"use client";

import { useEffect, useRef, useState } from "react";
import { parseOrThrow } from "@/lib/logic";
import { NOTATIONS, type Notation } from "@/lib/notation";
import { TruthPanel } from "@/components/truth/truth-panel";

const DEMO = parseOrThrow("A AND B");
const STEP_MS = 2200;

/**
 * The home page's one orchestrated moment: the AND table tours all four
 * notations once, then stops and hands the toggle to the visitor. Any click
 * on the toggle ends the tour immediately.
 */
export function HeroDemo() {
  const [notation, setNotation] = useState<Notation>("binary");
  const touring = useRef(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const order = NOTATIONS.map((n) => n.id);
    let i = 0;
    const timer = window.setInterval(() => {
      i++;
      if (!touring.current || i >= order.length) {
        window.clearInterval(timer);
        return;
      }
      setNotation(order[i]);
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="graph-paper rounded-2xl border border-rule bg-sheet p-4 sm:p-5">
      <TruthPanel
        expr={DEMO}
        notation={notation}
        onNotationChange={(n) => {
          touring.current = false;
          setNotation(n);
        }}
        workingColumns={false}
        label="AND truth table demo"
      />
    </div>
  );
}
