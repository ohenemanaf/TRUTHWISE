import { describe, expect, it } from "vitest";
import { format } from "./format";
import { parseOrThrow as p } from "./parser";
import { assignments, classify, differingRows, equivalent, signature, truthTable } from "./truth-table";

describe("truth table generation", () => {
  it("lists 2^n rows in binary counting order, first variable most significant", () => {
    const rows = assignments(["A", "B", "C"]);
    expect(rows).toHaveLength(8);
    expect(rows.map((r) => r.inputs.map((b) => (b ? 1 : 0)).join(""))).toEqual([
      "000", "001", "010", "011", "100", "101", "110", "111",
    ]);
  });

  it("trues-first order is the same rows reversed, keeping each row's index", () => {
    const rows = assignments(["P", "Q"], "trues-first");
    expect(rows.map((r) => r.inputs.map((b) => (b ? "T" : "F")).join(""))).toEqual(["TT", "TF", "FT", "FF"]);
    expect(rows.map((r) => r.index)).toEqual([3, 2, 1, 0]);
  });

  it.each([
    ["A ∧ B", "0001"],
    ["A ∨ B", "0111"],
    ["A ⊕ B", "0110"],
    ["A ↑ B", "1110"],
    ["A ↓ B", "1000"],
    ["A ⊙ B", "1001"],
    ["A ↔ B", "1001"],
    // Material implication: false only for A = 1, B = 0 (row index 2).
    ["A → B", "1101"],
    ["¬A", "10"],
  ])("%s has output column %s", (expr, sig) => expect(signature(p(expr))).toBe(sig));

  it("evaluates 3-variable expressions correctly", () => {
    // (A ∧ B) ∨ C: true when C, or when both A and B.
    expect(signature(p("(A ∧ B) ∨ C"))).toBe("01010111");
    expect(signature(p("A ⊕ B ⊕ C"))).toBe("01101001"); // odd parity
  });

  it("builds intermediate columns innermost-first, without duplicates", () => {
    const table = truthTable(p("¬P ∨ (P ∧ ¬P)"));
    expect(table.columns.map((col) => format(col.expr))).toEqual(["¬P", "P ∧ ¬P", "¬P ∨ (P ∧ ¬P)"]);
    expect(table.columns.at(-1)!.values).toEqual(table.rows.map((r) => r.output));
  });

  it("handles constant-only expressions", () => {
    const table = truthTable(p("T ∧ F"));
    expect(table.variables).toEqual([]);
    expect(table.rows).toHaveLength(1);
    expect(table.rows[0].output).toBe(false);
  });

  it("can include extra variables that don't appear in the expression", () => {
    expect(signature(p("A"), ["A", "B"])).toBe("0011");
  });

  it("orders variables naturally", () => {
    expect(truthTable(p("x10 ∧ x2 ∧ b ∧ A")).variables).toEqual(["A", "b", "x2", "x10"]);
  });

  it("refuses absurdly large tables", () => {
    expect(() => truthTable(p("a∧b∧c∧d∧e∧f∧g∧h∧i"))).toThrow(/Too many variables/);
  });
});

describe("classification", () => {
  it.each([
    ["P ∨ ¬P", "tautology"],
    ["P → P", "tautology"],
    ["(P → Q) ∨ (Q → P)", "tautology"],
    ["((P → Q) ∧ P) → Q", "tautology"],
    ["P ∧ ¬P", "contradiction"],
    ["(P ∨ Q) ∧ ¬P ∧ ¬Q", "contradiction"],
    ["P → Q", "contingency"],
    ["P", "contingency"],
  ] as const)("%s is a %s", (expr, kind) => expect(classify(p(expr))).toBe(kind));
});

describe("equivalence", () => {
  it.each([
    ["¬(A ∧ B)", "¬A ∨ ¬B"],
    ["¬(A ∨ B)", "¬A ∧ ¬B"],
    ["A → B", "¬B → ¬A"],
    ["A → B", "¬A ∨ B"],
    ["A ↔ B", "(A → B) ∧ (B → A)"],
    ["A ⊕ B", "(A ∨ B) ∧ ¬(A ∧ B)"],
    ["a !== b", "A XOR B".replace(/A/g, "a").replace(/B/g, "b")],
  ])("%s ≡ %s", (a, b) => expect(equivalent(p(a), p(b))).toBe(true));

  it("common wrong equivalences are rejected, with the rows that differ", () => {
    // The De Morgan mistake: forgetting to flip the operator.
    expect(equivalent(p("¬(A ∧ B)"), p("¬A ∧ ¬B"))).toBe(false);
    expect(differingRows(p("¬(A ∧ B)"), p("¬A ∧ ¬B"))).toEqual([
      { A: false, B: true },
      { A: true, B: false },
    ]);
    // The converse is not the same as the original conditional.
    expect(equivalent(p("A → B"), p("B → A"))).toBe(false);
    // Inclusive vs exclusive or differ exactly when both are true.
    expect(differingRows(p("A ∨ B"), p("A ⊕ B"))).toEqual([{ A: true, B: true }]);
  });

  it("compares over the union of variables", () => {
    expect(equivalent(p("A ∨ (B ∧ ¬B)"), p("A"))).toBe(true);
    expect(equivalent(p("A"), p("A ∧ B"))).toBe(false);
  });
});
