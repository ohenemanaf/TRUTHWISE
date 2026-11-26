/**
 * The single internal representation every notation is normalised into.
 *
 * Whether a student types `A AND B`, `a && b`, `A·B` or `P ∧ Q`, the parser
 * produces the same tree, so everything downstream (truth tables, circuits,
 * simplification, validity) only ever has to understand this one shape.
 */

export type BinaryOp =
  | "and"
  | "or"
  | "xor"
  | "nand"
  | "nor"
  | "xnor"
  | "implies"
  | "iff";

export type Expr =
  | { readonly kind: "var"; readonly name: string }
  | { readonly kind: "const"; readonly value: boolean }
  | { readonly kind: "not"; readonly operand: Expr }
  | {
      readonly kind: "binary";
      readonly op: BinaryOp;
      readonly left: Expr;
      readonly right: Expr;
    };

export const BINARY_OPS: readonly BinaryOp[] = [
  "and",
  "or",
  "xor",
  "nand",
  "nor",
  "xnor",
  "implies",
  "iff",
];

/** Operators where `a op b` always equals `b op a`. */
export const COMMUTATIVE: ReadonlySet<BinaryOp> = new Set<BinaryOp>([
  "and",
  "or",
  "xor",
  "nand",
  "nor",
  "xnor",
  "iff",
]);

/** Operators where `(a op b) op c` always equals `a op (b op c)`. */
export const ASSOCIATIVE: ReadonlySet<BinaryOp> = new Set<BinaryOp>([
  "and",
  "or",
  "xor",
  "xnor",
  "iff",
]);

// ---------------------------------------------------------------------------
// Constructors: small helpers keep test fixtures and rewrite rules readable.
// ---------------------------------------------------------------------------

export const v = (name: string): Expr => ({ kind: "var", name });
export const c = (value: boolean): Expr => ({ kind: "const", value });
export const TRUE: Expr = c(true);
export const FALSE: Expr = c(false);
export const not = (operand: Expr): Expr => ({ kind: "not", operand });
export const bin = (op: BinaryOp, left: Expr, right: Expr): Expr => ({
  kind: "binary",
  op,
  left,
  right,
});
export const and = (l: Expr, r: Expr) => bin("and", l, r);
export const or = (l: Expr, r: Expr) => bin("or", l, r);
export const xor = (l: Expr, r: Expr) => bin("xor", l, r);
export const nand = (l: Expr, r: Expr) => bin("nand", l, r);
export const nor = (l: Expr, r: Expr) => bin("nor", l, r);
export const xnor = (l: Expr, r: Expr) => bin("xnor", l, r);
export const implies = (l: Expr, r: Expr) => bin("implies", l, r);
export const iff = (l: Expr, r: Expr) => bin("iff", l, r);

// ---------------------------------------------------------------------------
// Structural helpers
// ---------------------------------------------------------------------------

/**
 * Exact structural key: two expressions share a key only if they are written
 * the same way (same operand order). Used to de-duplicate truth table columns.
 */
export function structuralKey(e: Expr): string {
  switch (e.kind) {
    case "var":
      return `v:${e.name}`;
    case "const":
      return e.value ? "1" : "0";
    case "not":
      return `!(${structuralKey(e.operand)})`;
    case "binary":
      return `${e.op}(${structuralKey(e.left)},${structuralKey(e.right)})`;
  }
}

/**
 * Key that ignores operand order and grouping for commutative/associative
 * operators, so `A ∧ (B ∧ A)` and `(A ∧ A) ∧ B` share a key.
 * The simplifier uses it to spot "the same term" written in different orders.
 */
export function canonicalKey(e: Expr): string {
  switch (e.kind) {
    case "var":
    case "const":
      return structuralKey(e);
    case "not":
      return `!(${canonicalKey(e.operand)})`;
    case "binary": {
      if (ASSOCIATIVE.has(e.op)) {
        const parts = flatten(e.op, e).map(canonicalKey).sort();
        return `${e.op}(${parts.join(",")})`;
      }
      if (COMMUTATIVE.has(e.op)) {
        const parts = [canonicalKey(e.left), canonicalKey(e.right)].sort();
        return `${e.op}(${parts.join(",")})`;
      }
      return `${e.op}(${canonicalKey(e.left)},${canonicalKey(e.right)})`;
    }
  }
}

export const sameExpr = (a: Expr, b: Expr): boolean =>
  canonicalKey(a) === canonicalKey(b);

/**
 * Collapse a chain of the same associative operator into its operand list:
 * `(A ∧ B) ∧ (C ∧ D)` → `[A, B, C, D]`. Anything else is a one-item list.
 */
export function flatten(op: BinaryOp, e: Expr): Expr[] {
  if (e.kind === "binary" && e.op === op) {
    return [...flatten(op, e.left), ...flatten(op, e.right)];
  }
  return [e];
}

/** Inverse of {@link flatten}: rebuild a left-leaning chain. */
export function chain(op: BinaryOp, items: readonly Expr[]): Expr {
  if (items.length === 0) {
    throw new Error("chain() needs at least one operand");
  }
  return items.slice(1).reduce((acc, item) => bin(op, acc, item), items[0]);
}

/** Number of nodes in the tree: the simplifier's measure of "smaller". */
export function size(e: Expr): number {
  switch (e.kind) {
    case "var":
    case "const":
      return 1;
    case "not":
      return 1 + size(e.operand);
    case "binary":
      return 1 + size(e.left) + size(e.right);
  }
}

/**
 * Variables in the order a textbook would list them: alphabetical, with
 * natural number ordering so `x2` comes before `x10`.
 */
export function variablesOf(...exprs: Expr[]): string[] {
  const found = new Set<string>();
  const walk = (e: Expr): void => {
    if (e.kind === "var") found.add(e.name);
    else if (e.kind === "not") walk(e.operand);
    else if (e.kind === "binary") {
      walk(e.left);
      walk(e.right);
    }
  };
  exprs.forEach(walk);
  return [...found].sort((a, b) =>
    a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }) ||
    (a < b ? -1 : a > b ? 1 : 0),
  );
}
