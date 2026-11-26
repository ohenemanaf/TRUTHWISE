"use client";

import { useId } from "react";
import type { ParseError } from "@/lib/logic";

/** Characters that are awkward to type, offered as insert buttons. */
const SYMBOLS = ["¬", "∧", "∨", "⊕", "→", "↔", "(", ")"] as const;

export function ExpressionInput({
  value,
  onChange,
  error,
  label = "Expression",
  placeholder = "e.g. A AND NOT B, a && !b, P → Q",
  autoFocus,
}: {
  value: string;
  onChange: (next: string) => void;
  error?: ParseError | null;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const id = useId();
  const errorId = `${id}-error`;

  const insert = (symbol: string) => {
    const input = document.getElementById(id) as HTMLInputElement | null;
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? value.length;
    const spaced = symbol === "(" || symbol === ")" || symbol === "¬" ? symbol : ` ${symbol} `;
    const next = value.slice(0, start) + spaced + value.slice(end);
    onChange(next.replace(/ {2,}/g, " "));
    requestAnimationFrame(() => {
      input?.focus();
      const caret = start + spaced.length;
      input?.setSelectionRange(caret, caret);
    });
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12.5px] font-medium text-graphite">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`expr h-11 w-full rounded-xl border bg-sheet px-3.5 text-[16px] outline-none transition-colors placeholder:text-faint focus:border-[var(--accent)] ${
          error ? "border-bad" : "border-rule-strong"
        }`}
      />
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {SYMBOLS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => insert(s)}
            className="expr h-7 min-w-7 rounded-md border border-rule bg-sheet px-1.5 text-[13px] text-graphite hover:border-rule-strong hover:text-ink"
            aria-label={`Insert ${s}`}
          >
            {s}
          </button>
        ))}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-[12.5px] text-bad">
          <span className="expr mr-1 whitespace-pre text-ink">
            {value.slice(0, error.position)}
            <span className="rounded-sm bg-bad-tint px-0.5 text-bad">{value[error.position] ?? "␣"}</span>
          </span>
          <span className="block sm:inline">{error.message}</span>
        </p>
      )}
    </div>
  );
}
