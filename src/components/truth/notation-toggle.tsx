"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { NOTATIONS, type Notation } from "@/lib/notation";

/**
 * The signature control: one table, four courses. A sliding pill tinted with
 * the course colour shows which notation you're reading in.
 */
export function NotationToggle({
  value,
  onChange,
  showCourse = true,
  className = "",
}: {
  value: Notation;
  onChange: (n: Notation) => void;
  showCourse?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      aria-label="Notation"
      className={`inline-grid grid-cols-4 rounded-xl border border-rule bg-wash p-0.5 ${className}`}
      onKeyDown={(e) => {
        // Arrow keys move between options, as a native radio group does.
        const i = NOTATIONS.findIndex((n) => n.id === value);
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          onChange(NOTATIONS[(i + 1) % NOTATIONS.length].id);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          onChange(NOTATIONS[(i + NOTATIONS.length - 1) % NOTATIONS.length].id);
        }
      }}
    >
      {NOTATIONS.map((n) => {
        const active = n.id === value;
        return (
          <button
            key={n.id}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            data-notation={n.id}
            onClick={() => onChange(n.id)}
            className="relative min-w-0 rounded-[10px] px-2.5 py-1.5 text-left sm:px-3"
          >
            {active && (
              <motion.span
                layoutId={`notation-pill-${id}`}
                className="absolute inset-0 rounded-[10px] bg-sheet shadow-[0_1px_2px_rgb(23_32_54/0.08),0_0_0_1px_var(--accent)]"
                transition={{ type: "spring", stiffness: 520, damping: 40 }}
              />
            )}
            <span
              className={`relative block text-[13px] font-semibold transition-colors duration-300 ${
                active ? "text-[var(--accent)]" : "text-graphite"
              }`}
            >
              {n.label}
            </span>
            {showCourse && (
              <span className="relative hidden truncate text-[11px] text-faint sm:block">{n.course}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
