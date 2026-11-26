"use client";

import { format, type Expr } from "@/lib/logic";
import { NOTATION, valueLabel, type Notation } from "@/lib/notation";
import { RollingText } from "./rolling-text";

export interface GridColumn {
  readonly key: string;
  /** An expression (printed in the active notation) or fixed text. */
  readonly label: Expr | string;
  /** `null` = not filled in yet (step-through) or left blank for the student. */
  readonly values: readonly (boolean | null)[];
  /** Visually separate the result column(s) from the working. */
  readonly emphasis?: boolean;
  /** Small caption above the header, e.g. "premise 1". */
  readonly caption?: string;
}

export type RowTone = "critical" | "counterexample" | "wrong" | "right" | undefined;

export interface TableGridProps {
  readonly variables: readonly string[];
  /** Input values per row, aligned with `variables`. */
  readonly rows: readonly (readonly boolean[])[];
  readonly columns: readonly GridColumn[];
  readonly notation: Notation;
  readonly selectedRow?: number | null;
  readonly onSelectRow?: (row: number) => void;
  /** Row currently being filled in a step-through. */
  readonly activeRow?: number | null;
  readonly rowTone?: (row: number) => RowTone;
  /** Turns blank cells of a column into toggle buttons (for exercises). */
  readonly editable?: { column: string; onToggle: (row: number) => void };
  readonly caption?: string;
}

const TONE_CLASS: Record<Exclude<RowTone, undefined>, string> = {
  critical: "bg-[var(--accent-tint)]/45",
  counterexample: "bg-bad-tint",
  wrong: "bg-bad-tint",
  right: "bg-good-tint/60",
};

export function headerText(label: Expr | string, notation: Notation): string {
  return typeof label === "string" ? label : format(label, NOTATION[notation].text);
}

export function TableGrid({
  variables,
  rows,
  columns,
  notation,
  selectedRow,
  onSelectRow,
  activeRow,
  rowTone,
  editable,
  caption,
}: TableGridProps) {
  // Ripple: each column starts its roll a beat after the one to its left.
  const delayFor = (col: number, row: number) => col * 0.035 + row * 0.012;
  const hasCaptions = columns.some((c) => c.caption);

  return (
    <div className="overflow-x-auto rounded-xl border border-rule bg-sheet" data-notation={notation}>
      <table className="expr w-full border-collapse text-[13.5px] tabular-nums">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-rule bg-wash/60 text-left">
            {variables.map((name) => (
              <th key={name} scope="col" className="px-3 py-2 align-bottom font-semibold text-graphite">
                {hasCaptions && <span className="block font-sans text-[10.5px] font-normal text-faint">input</span>}
                {name}
              </th>
            ))}
            {columns.map((col, i) => (
              <th
                key={col.key}
                scope="col"
                className={`whitespace-nowrap px-3 py-2 align-bottom font-semibold ${
                  i === 0 ? "border-l border-rule-strong" : ""
                } ${col.emphasis ? "text-[var(--accent)] transition-colors duration-300" : "text-ink"}`}
              >
                {hasCaptions && (
                  <span className="block font-sans text-[10.5px] font-normal text-faint">{col.caption ?? " "}</span>
                )}
                <RollingText text={headerText(col.label, notation)} delay={(variables.length + i) * 0.035} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((inputs, r) => {
            const tone = rowTone?.(r);
            const selected = selectedRow === r;
            const interactive = Boolean(onSelectRow);
            return (
              <tr
                key={r}
                onClick={interactive ? () => onSelectRow?.(r) : undefined}
                onKeyDown={
                  interactive
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectRow?.(r);
                        }
                      }
                    : undefined
                }
                tabIndex={interactive ? 0 : undefined}
                aria-selected={interactive ? selected : undefined}
                className={`border-b border-rule last:border-b-0 transition-colors duration-200 ${
                  tone ? TONE_CLASS[tone] : ""
                } ${interactive ? "cursor-pointer hover:bg-wash/70" : ""} ${
                  selected ? "outline-2 -outline-offset-2 outline-[var(--accent)]" : ""
                } ${activeRow === r ? "bg-[var(--accent-tint)]/40" : ""}`}
              >
                {inputs.map((value, c) => (
                  <td key={c} className="px-3 py-1.5 text-graphite">
                    <RollingText text={valueLabel(value, notation)} delay={delayFor(c, r)} />
                  </td>
                ))}
                {columns.map((col, c) => {
                  const value = col.values[r];
                  const isEditable = editable?.column === col.key;
                  return (
                    <td
                      key={col.key}
                      className={`px-3 py-1.5 ${c === 0 ? "border-l border-rule-strong" : ""} ${
                        col.emphasis ? "font-semibold" : ""
                      }`}
                    >
                      {isEditable ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            editable.onToggle(r);
                          }}
                          aria-label={`Row ${r + 1} output: ${value === null ? "blank" : valueLabel(value, notation)}. Click to change.`}
                          className={`h-7 min-w-11 rounded-md border px-2 text-[13px] font-semibold transition-colors ${
                            value === null
                              ? "border-dashed border-rule-strong text-faint"
                              : value
                                ? "border-transparent bg-[var(--accent-tint)] text-[var(--accent)]"
                                : "border-rule bg-sheet text-graphite"
                          }`}
                        >
                          {value === null ? "?" : valueLabel(value, notation)}
                        </button>
                      ) : value === null ? (
                        <span className="text-rule-strong">·</span>
                      ) : (
                        <span
                          className={`inline-block rounded-md px-1.5 transition-colors duration-300 ${
                            value ? "bg-[var(--accent-tint)] text-[var(--accent)]" : "text-graphite"
                          }`}
                        >
                          <RollingText text={valueLabel(value, notation)} delay={delayFor(variables.length + c, r)} />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
