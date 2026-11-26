import { structuralKey, variablesOf, type Expr } from "./ast";
import { evaluate, type Assignment } from "./evaluate";

/** Beyond this the table stops being something a human can read (and 2^n explodes). */
export const MAX_VARIABLES = 8;

/**
 * Row order differs by course, which is itself one of the "same thing,
 * different clothes" moments:
 *  - `zeros-first`: 000, 001, … 111. Counting in binary, the Digital
 *    Electronics convention.
 *  - `trues-first`: TTT, TTF, … FFF. The convention in most discrete maths
 *    and logic textbooks.
 * Both list the same rows; only the order changes.
 */
export type RowOrder = "zeros-first" | "trues-first";

export interface TruthRow {
  /** Position in binary counting order (0 = all false), stable across row orders. */
  readonly index: number;
  readonly assignment: Assignment;
  /** Input values in the same order as {@link TruthTable.variables}. */
  readonly inputs: readonly boolean[];
  readonly output: boolean;
}

export interface Column {
  readonly key: string;
  readonly expr: Expr;
  /** One value per row, aligned with {@link TruthTable.rows}. */
  readonly values: readonly boolean[];
}

export interface TruthTable {
  readonly expr: Expr;
  readonly variables: readonly string[];
  readonly rows: readonly TruthRow[];
  /**
   * Intermediate columns for building the table by hand, innermost first.
   * For `¬P ∨ (P ∧ Q)` these are `¬P`, `P ∧ Q`, then the whole expression.
   * Bare variables are not repeated here; they are the input columns.
   */
  readonly columns: readonly Column[];
}

export interface TableOptions {
  /** Force a variable list (e.g. to include variables that only appear in a sibling expression). */
  readonly variables?: readonly string[];
  readonly order?: RowOrder;
}

/** Every assignment of the variables, in the requested order. */
export function assignments(
  variables: readonly string[],
  order: RowOrder = "zeros-first",
): { index: number; assignment: Assignment; inputs: boolean[] }[] {
  if (variables.length > MAX_VARIABLES) {
    throw new Error(`Too many variables (${variables.length}). The limit is ${MAX_VARIABLES}.`);
  }
  const n = variables.length;
  const count = 2 ** n;
  const result = [];
  for (let r = 0; r < count; r++) {
    const index = order === "zeros-first" ? r : count - 1 - r;
    // The first variable is the most significant bit, so it changes slowest:
    // the A | B | C columns read 0000 1111 / 0011 0011 / 0101 0101.
    const inputs = variables.map((_, j) => ((index >> (n - 1 - j)) & 1) === 1);
    const assignment: Record<string, boolean> = {};
    variables.forEach((name, j) => (assignment[name] = inputs[j]));
    result.push({ index, assignment, inputs });
  }
  return result;
}

/** Non-variable subexpressions in post-order (children before parents), de-duplicated. */
export function subexpressions(e: Expr): Expr[] {
  const seen = new Set<string>();
  const out: Expr[] = [];
  const walk = (node: Expr): void => {
    if (node.kind === "not") walk(node.operand);
    if (node.kind === "binary") {
      walk(node.left);
      walk(node.right);
    }
    if (node.kind === "var") return;
    // A bare constant column ("T") would just be a column of T's: skip it
    // unless the whole expression is that constant.
    if (node.kind === "const" && node !== e) return;
    const key = structuralKey(node);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(node);
    }
  };
  walk(e);
  return out;
}

export function truthTable(expr: Expr, options: TableOptions = {}): TruthTable {
  const variables = options.variables ? [...options.variables] : variablesOf(expr);
  const rows = assignments(variables, options.order).map(({ index, assignment, inputs }) => ({
    index,
    assignment,
    inputs,
    output: evaluate(expr, assignment),
  }));
  const columns = subexpressions(expr).map((sub) => ({
    key: structuralKey(sub),
    expr: sub,
    values: rows.map((row) => evaluate(sub, row.assignment)),
  }));
  return { expr, variables, rows, columns };
}

export type Classification = "tautology" | "contradiction" | "contingency";

/**
 * Tautology: true in every row. Contradiction: false in every row.
 * Contingency: depends on the inputs (most expressions).
 */
export function classify(expr: Expr): Classification {
  const outputs = truthTable(expr).rows.map((r) => r.output);
  if (outputs.every(Boolean)) return "tautology";
  if (!outputs.some(Boolean)) return "contradiction";
  return "contingency";
}

/** Rows (by assignment) where two expressions disagree, over the union of their variables. */
export function differingRows(a: Expr, b: Expr): Assignment[] {
  const variables = variablesOf(a, b);
  return assignments(variables)
    .filter(({ assignment }) => evaluate(a, assignment) !== evaluate(b, assignment))
    .map(({ assignment }) => assignment);
}

/** Logically equivalent: same output in every row of the combined table. */
export function equivalent(a: Expr, b: Expr): boolean {
  return differingRows(a, b).length === 0;
}

/** Output column as a bit string in zeros-first order, e.g. AND → "0001". */
export function signature(expr: Expr, variables?: readonly string[]): string {
  return truthTable(expr, { variables })
    .rows.map((r) => (r.output ? "1" : "0"))
    .join("");
}
