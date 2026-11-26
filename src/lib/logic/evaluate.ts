import type { BinaryOp, Expr } from "./ast";

export type Assignment = Readonly<Record<string, boolean>>;

/** The defining truth function of every binary connective. */
export function applyOp(op: BinaryOp, a: boolean, b: boolean): boolean {
  switch (op) {
    case "and":
      return a && b;
    case "or":
      return a || b;
    case "xor":
      return a !== b;
    case "nand":
      return !(a && b);
    case "nor":
      return !(a || b);
    case "xnor":
    case "iff":
      // XNOR (electronics) and ↔ (logic) are the same truth function under
      // two names. We keep both in the AST so each renders in its home notation.
      return a === b;
    case "implies":
      // Material implication: only false when a true premise leads to a false
      // conclusion. "If it rains, the ground is wet" isn't broken by a dry,
      // sunny day.
      return !a || b;
  }
}

export function evaluate(e: Expr, assignment: Assignment): boolean {
  switch (e.kind) {
    case "const":
      return e.value;
    case "var": {
      const value = assignment[e.name];
      if (value === undefined) {
        throw new Error(`No value given for variable "${e.name}"`);
      }
      return value;
    }
    case "not":
      return !evaluate(e.operand, assignment);
    case "binary":
      return applyOp(e.op, evaluate(e.left, assignment), evaluate(e.right, assignment));
  }
}
