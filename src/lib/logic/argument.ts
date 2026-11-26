import { variablesOf, type Expr } from "./ast";
import { evaluate, type Assignment } from "./evaluate";
import { parse, type ParseError } from "./parser";
import { assignments } from "./truth-table";

/**
 * An argument is valid when its conclusion can never be false while all of its
 * premises are true. That's the whole idea, and a truth table checks it
 * mechanically: list every row, look only at the rows where every premise is
 * true ("critical rows"), and see whether the conclusion holds in all of them.
 * One critical row with a false conclusion is a counterexample, and the
 * argument is invalid, however convincing it sounds.
 */

export interface Argument {
  readonly premises: readonly Expr[];
  readonly conclusion: Expr;
}

export interface ArgumentRow {
  readonly index: number;
  readonly assignment: Assignment;
  readonly inputs: readonly boolean[];
  readonly premises: readonly boolean[];
  readonly conclusion: boolean;
  /** Every premise is true in this row, so it is the only kind of row that matters for validity. */
  readonly critical: boolean;
  /** Critical row where the conclusion is false: proof of invalidity. */
  readonly counterexample: boolean;
}

export interface ValidityReport {
  readonly argument: Argument;
  readonly variables: readonly string[];
  readonly rows: readonly ArgumentRow[];
  readonly valid: boolean;
  readonly counterexamples: readonly ArgumentRow[];
  /** True when no row makes every premise true. Such an argument is valid, but only vacuously. */
  readonly inconsistentPremises: boolean;
}

export function checkArgument(argument: Argument): ValidityReport {
  const variables = variablesOf(...argument.premises, argument.conclusion);
  const rows: ArgumentRow[] = assignments(variables).map(({ index, assignment, inputs }) => {
    const premises = argument.premises.map((p) => evaluate(p, assignment));
    const conclusion = evaluate(argument.conclusion, assignment);
    const critical = premises.every(Boolean);
    return { index, assignment, inputs, premises, conclusion, critical, counterexample: critical && !conclusion };
  });
  const counterexamples = rows.filter((r) => r.counterexample);
  return {
    argument,
    variables,
    rows,
    valid: counterexamples.length === 0,
    counterexamples,
    inconsistentPremises: !rows.some((r) => r.critical),
  };
}

export type ArgumentParseResult =
  | { readonly ok: true; readonly argument: Argument }
  | { readonly ok: false; readonly error: ParseError & { readonly part: string } };

/** Words and symbols that introduce the conclusion. */
const THEREFORE = /\s*(?:∴|⊢|\|-|\btherefore\b|\bthus\b|\bso\b)\s*/i;

/**
 * Parse an argument written on one line, e.g. "P → Q, P ∴ Q" or
 * "P -> Q; P therefore Q". Premises are separated by commas, semicolons or
 * new lines.
 */
export function parseArgument(text: string): ArgumentParseResult {
  const parts = text.split(THEREFORE);
  if (parts.length !== 2) {
    return {
      ok: false,
      error: { message: 'Separate premises from the conclusion with "∴" or "therefore"', position: 0, part: text },
    };
  }
  const [premiseText, conclusionText] = parts;
  const premiseParts = premiseText
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (premiseParts.length === 0) {
    return { ok: false, error: { message: "An argument needs at least one premise", position: 0, part: premiseText } };
  }

  const premises: Expr[] = [];
  for (const part of premiseParts) {
    const r = parse(part);
    if (!r.ok) return { ok: false, error: { ...r.error, part } };
    premises.push(r.expr);
  }
  const concl = parse(conclusionText.trim());
  if (!concl.ok) return { ok: false, error: { ...concl.error, part: conclusionText.trim() } };
  return { ok: true, argument: { premises, conclusion: concl.expr } };
}
