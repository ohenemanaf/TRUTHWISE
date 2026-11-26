"use client";

import { AnimatePresence, motion } from "motion/react";
import { LAW_BY_ID, format, type Simplification, type TextNotation } from "@/lib/logic";

/** A worked derivation: one law per line, like a textbook proof. */
export function SimplifySteps({
  simplification,
  notation = "symbolic",
}: {
  simplification: Simplification;
  notation?: TextNotation;
}) {
  const { input, steps, result } = simplification;

  if (steps.length === 0) {
    return (
      <p className="text-[13px] text-graphite">
        <span className="expr text-ink">{format(input, notation)}</span> is already as simple as the laws allow.
      </p>
    );
  }

  return (
    <ol className="space-y-0.5">
      <li className="expr py-1 text-[13.5px] text-ink">{format(input, notation)}</li>
      <AnimatePresence initial={false}>
        {steps.map((step, i) => {
          const law = LAW_BY_ID[step.law];
          return (
            <motion.li
              key={`${i}-${format(step.after)}`}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2 border-t border-rule py-1.5 sm:grid-cols-[1.25rem_minmax(0,1fr)_auto]"
            >
              <span className="expr pt-px text-[13px] text-faint">=</span>
              <span className="expr text-[13.5px] break-words text-ink">{format(step.after, notation)}</span>
              <span
                className={`col-start-2 text-[12px] sm:col-start-3 sm:text-right ${law.internal ? "text-faint" : "text-graphite"}`}
                title={law.explanation}
              >
                {law.name}
                {step.law !== "minimal-form" && (
                  <span className="expr ml-1.5 hidden text-faint lg:inline">
                    {format(step.focus, notation)} ⇒ {format(step.replacement, notation)}
                  </span>
                )}
              </span>
            </motion.li>
          );
        })}
      </AnimatePresence>
      <li className="flex items-center justify-between gap-3 border-t border-rule-strong pt-2 text-[12.5px]">
        <span className="text-graphite">Simplest form</span>
        <span className="expr rounded-md bg-[var(--accent-tint)] px-2 py-0.5 text-[13.5px] font-semibold text-[var(--accent)]">
          {format(result, notation)}
        </span>
      </li>
    </ol>
  );
}
