"use client";

import type { RowOrder } from "@/lib/logic";
import { valueLabel, type Notation } from "@/lib/notation";
import { useProgress } from "@/lib/progress";

/**
 * Electronics counts rows up from 00; most logic textbooks start from TT.
 * Same rows either way. This switch flips the order and the rows slide
 * into their new places.
 */
export function RowOrderToggle({ notation }: { notation: Notation }) {
  const order = useProgress((s) => s.rowOrder);
  const setOrder = useProgress((s) => s.setRowOrder);
  const f = valueLabel(false, notation);
  const t = valueLabel(true, notation);
  const sep = notation === "code" ? ", " : "";
  const options: { id: RowOrder; label: string; title: string }[] = [
    { id: "zeros-first", label: `${f}${sep}${f} first`, title: "Count up from all-false (Digital Electronics)" },
    { id: "trues-first", label: `${t}${sep}${t} first`, title: "Start from all-true (most logic textbooks)" },
  ];

  return (
    <div role="radiogroup" aria-label="Row order" className="inline-flex rounded-lg border border-rule bg-wash p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={order === o.id}
          title={o.title}
          onClick={() => setOrder(o.id)}
          className={`expr rounded-md px-2 py-1 text-[11.5px] whitespace-nowrap transition-colors ${
            order === o.id ? "bg-sheet font-semibold text-ink shadow-[0_0_0_1px_var(--color-rule-strong)]" : "text-graphite hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
