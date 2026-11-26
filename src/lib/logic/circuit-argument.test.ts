import { describe, expect, it } from "vitest";
import { checkArgument, parseArgument } from "./argument";
import { buildCircuit, circuitValues, gateCount, singleGate } from "./circuit";
import { evaluate } from "./evaluate";
import { format } from "./format";
import { minimalSumOfProducts } from "./minimize";
import { parseOrThrow as p } from "./parser";
import { assignments, equivalent } from "./truth-table";

describe("circuit", () => {
  it.each([
    ["A ∧ B", "AND"],
    ["A ∨ B", "OR"],
    ["¬A", "NOT"],
    ["A ⊕ B", "XOR"],
    ["A ↑ B", "NAND"],
    ["¬(A ∧ B)", "NAND"],
    ["A ↓ B", "NOR"],
    ["¬(A ∨ B)", "NOR"],
    ["A ⊙ B", "XNOR"],
    ["A ↔ B", "XNOR"],
    ["¬(A ⊕ B)", "XNOR"],
  ] as const)("%s is a single %s gate", (expr, gate) => expect(singleGate(p(expr))).toBe(gate));

  it("compound expressions are not a single gate", () => {
    expect(singleGate(p("(A ∧ B) ∨ C"))).toBeNull();
    expect(singleGate(p("A"))).toBeNull();
  });

  it("builds → from NOT + OR and explains why", () => {
    const circuit = buildCircuit(p("P → Q"));
    expect(circuit.gates.map((g) => g.gate).sort()).toEqual(["NOT", "OR"]);
    expect(circuit.notes.join(" ")).toMatch(/no gate of its own/);
  });

  it("every gate sits to the right of the nodes feeding it", () => {
    const circuit = buildCircuit(p("¬(A ∧ B) ∨ (C ⊕ ¬A)"));
    const x = new Map(circuit.gates.map((g) => [g.id, g.x]));
    for (const g of circuit.gates) {
      for (const input of g.inputs) {
        if (x.has(input)) expect(x.get(input)!).toBeLessThan(g.x);
      }
    }
    expect(gateCount(p("¬(A ∧ B) ∨ (C ⊕ ¬A)"))).toBe(4); // NAND, NOT, XOR, OR
  });

  it("each variable has one rail, tapped once per use", () => {
    const circuit = buildCircuit(p("(A ∧ B) ∨ (A ∧ C)"));
    expect(circuit.rails.map((r) => r.name)).toEqual(["A", "B", "C"]);
    expect(circuit.wires.filter((w) => w.from === "rail-A")).toHaveLength(2);
  });

  it("wire values match the truth table on every row", () => {
    const expr = p("(A ↑ B) ⊕ (¬C ∨ A)");
    const circuit = buildCircuit(expr);
    for (const { assignment } of assignments(["A", "B", "C"])) {
      const values = circuitValues(circuit, assignment);
      expect(values.get(circuit.output)).toBe(evaluate(expr, assignment));
    }
  });

  it("a bare variable is just a wire", () => {
    const circuit = buildCircuit(p("A"));
    expect(circuit.gates).toHaveLength(0);
    expect(circuit.output).toBe("rail-A");
  });

  it("wires are made of horizontal and vertical segments only", () => {
    const circuit = buildCircuit(p("(A ∧ (B ∨ C)) ⊕ ¬(A ∨ C)"));
    for (const wire of circuit.wires) {
      for (let i = 1; i < wire.points.length; i++) {
        const [a, b] = [wire.points[i - 1], wire.points[i]];
        expect(a.x === b.x || a.y === b.y).toBe(true);
      }
    }
  });
});

describe("argument validity", () => {
  const verdict = (text: string) => {
    const parsed = parseArgument(text);
    if (!parsed.ok) throw new Error(parsed.error.message);
    return checkArgument(parsed.argument);
  };

  it.each([
    ["modus ponens", "P → Q, P ∴ Q"],
    ["modus tollens", "P → Q, ¬Q ∴ ¬P"],
    ["hypothetical syllogism", "P → Q, Q → R ∴ P → R"],
    ["disjunctive syllogism", "P ∨ Q, ¬P ∴ Q"],
    ["constructive dilemma", "(P → Q) ∧ (R → S), P ∨ R ∴ Q ∨ S"],
    ["simplification", "P ∧ Q ∴ P"],
    ["addition", "P ∴ P ∨ Q"],
  ])("%s is valid", (_, text) => {
    const report = verdict(text);
    expect(report.valid).toBe(true);
    expect(report.counterexamples).toHaveLength(0);
  });

  it("affirming the consequent is invalid, and the counterexample is P false, Q true", () => {
    const report = verdict("P → Q, Q ∴ P");
    expect(report.valid).toBe(false);
    expect(report.counterexamples.map((r) => r.assignment)).toEqual([{ P: false, Q: true }]);
  });

  it("denying the antecedent is invalid, with the same counterexample", () => {
    const report = verdict("P → Q, ¬P ∴ ¬Q");
    expect(report.valid).toBe(false);
    expect(report.counterexamples.map((r) => r.assignment)).toEqual([{ P: false, Q: true }]);
  });

  it("affirming a disjunct is invalid (inclusive or)", () => {
    const report = verdict("P ∨ Q, P ∴ ¬Q");
    expect(report.valid).toBe(false);
    expect(report.counterexamples.map((r) => r.assignment)).toEqual([{ P: true, Q: true }]);
  });

  it("marks critical rows: modus ponens has exactly one", () => {
    const report = verdict("P → Q, P ∴ Q");
    expect(report.rows.filter((r) => r.critical).map((r) => r.assignment)).toEqual([{ P: true, Q: true }]);
  });

  it("inconsistent premises make an argument vacuously valid, and we flag it", () => {
    const report = verdict("P, ¬P ∴ Q");
    expect(report.valid).toBe(true);
    expect(report.inconsistentPremises).toBe(true);
  });

  it("parses several separators", () => {
    const a = parseArgument("P -> Q; Q -> R therefore P -> R");
    const b = parseArgument("P → Q\nQ → R ⊢ P → R");
    expect(a.ok && b.ok).toBe(true);
    if (a.ok) expect(a.argument.premises).toHaveLength(2);
  });

  it("reports which part failed to parse", () => {
    const r = parseArgument("P → Q, P ∧ ∴ Q");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.part).toBe("P ∧");
    expect(parseArgument("P → Q, P").ok).toBe(false);
  });
});

describe("minimal sum of products", () => {
  it.each([
    ["(A ∧ B) ∨ (A ∧ ¬B)", "A"],
    ["A ∨ ¬A", "T"],
    ["A ∧ ¬A", "F"],
    ["(A ∧ B) ∨ (¬A ∧ C) ∨ (B ∧ C)", "(A ∧ B) ∨ (¬A ∧ C)"],
  ])("%s → %s", (input, expected) => {
    const result = minimalSumOfProducts(p(input))!;
    expect(format(result)).toBe(expected);
    expect(equivalent(result, p(input))).toBe(true);
  });

  it("is always equivalent to its input", () => {
    for (const s of ["A ⊕ B ⊕ C", "(A → B) ↔ C", "¬(A ∧ B ∧ C) ∨ (D ∧ ¬A)", "A ↑ (B ↓ C)"]) {
      expect(equivalent(minimalSumOfProducts(p(s))!, p(s)), s).toBe(true);
    }
  });
});
