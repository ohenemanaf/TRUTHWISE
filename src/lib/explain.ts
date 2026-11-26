import { evaluate, format, type Assignment, type Expr } from "./logic";
import { NOTATION, valueLabel, type Notation } from "./notation";

/**
 * One-sentence narration of how a row's result is reached, used by the
 * row-by-row builder: "A is 1 and B is 0. AND needs both, so A · B is 0."
 */
export function explainRow(expr: Expr, assignment: Assignment, notation: Notation): string {
  const text = NOTATION[notation].text;
  const show = (e: Expr) => format(e, text);
  const val = (e: Expr) => valueLabel(evaluate(e, assignment), notation);
  const result = `${show(expr)} is ${val(expr)}`;

  switch (expr.kind) {
    case "var":
      return `${expr.name} is ${val(expr)}, so the output is ${val(expr)}.`;
    case "const":
      return `A constant: always ${val(expr)}.`;
    case "not":
      return `${show(expr.operand)} is ${val(expr.operand)}. NOT flips it, so ${result}.`;
    case "binary": {
      const l = expr.left;
      const r = expr.right;
      const given = `${show(l)} is ${val(l)} and ${show(r)} is ${val(r)}.`;
      const rule: Record<typeof expr.op, string> = {
        and: "AND needs both to be true",
        or: "OR needs at least one to be true",
        xor: "XOR is true only when they differ",
        nand: "NAND is the opposite of AND",
        nor: "NOR is the opposite of OR",
        xnor: "XNOR is true when they match",
        iff: "↔ is true when both sides match",
        implies: "→ is false only when the left is true and the right is false",
      };
      return `${given} ${rule[expr.op]}, so ${result}.`;
    }
  }
}
