import { format, type Expr, type TextNotation } from "@/lib/logic";

const ROWS: readonly { notation: TextNotation; course: string; color: string }[] = [
  { notation: "electronics", course: "Digital Electronics", color: "var(--color-binary)" },
  { notation: "symbolic", course: "Discrete Maths", color: "var(--color-tf)" },
  { notation: "code", course: "Computer Science", color: "var(--color-code)" },
  { notation: "word", course: "Critical Thinking", color: "var(--color-word)" },
];

/** One expression written the way each course writes it. */
export function RosettaList({ expr, current }: { expr: Expr; current?: TextNotation }) {
  return (
    <dl className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-sheet">
      {ROWS.map((row) => (
        <div
          key={row.notation}
          className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3.5 py-2.5 ${
            current === row.notation ? "bg-wash/70" : ""
          }`}
        >
          <dt className="flex shrink-0 items-center gap-2 text-[12px] text-graphite">
            <span className="size-2 rounded-full" style={{ background: row.color }} aria-hidden="true" />
            {row.course}
          </dt>
          <dd className="expr ml-auto min-w-0 text-right text-[13px] break-words text-ink">{format(expr, row.notation)}</dd>
        </div>
      ))}
    </dl>
  );
}
