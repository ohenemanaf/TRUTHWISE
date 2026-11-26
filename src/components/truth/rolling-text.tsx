"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Text that rolls vertically when it changes, like a split-flap display.
 * Used for every value and header in the truth table, so switching notation
 * visibly "re-labels" the same table instead of swapping it out.
 */
export function RollingText({
  text,
  delay = 0,
  className = "",
  wrap = false,
}: {
  text: string;
  /** Seconds. Lets a table ripple column by column. */
  delay?: number;
  className?: string;
  /** Allow line wrapping (for sentences rather than single values). */
  wrap?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <span className={`relative inline-flex overflow-hidden align-bottom ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={text}
          className={`inline-block ${wrap ? "whitespace-normal" : "whitespace-pre"}`}
          initial={reduce ? { opacity: 0 } : { y: "90%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: "-90%", opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.34, delay: reduce ? 0 : delay, ease: [0.32, 0.72, 0, 1] }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
