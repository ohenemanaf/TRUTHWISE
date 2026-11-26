import { describe, expect, it } from "vitest";
import { sameExpr, size, variablesOf } from "./ast";
import { format } from "./format";
import { LAWS } from "./laws";
import { minimalSumOfProducts } from "./minimize";
import { parseOrThrow as p } from "./parser";
import { simplify } from "./simplify";
import { equivalent } from "./truth-table";

const simplified = (s: string) => format(simplify(p(s)).result);
const lawsUsed = (s: string) => simplify(p(s)).steps.map((step) => step.law);

describe("the law catalogue", () => {
  it.each(LAWS.flatMap((law) => law.forms.map((f) => [law.name, f.left, f.right] as const)))(
    "%s: %s ≡ %s is a genuine equivalence",
    (_, left, right) => expect(equivalent(p(left), p(right))).toBe(true),
  );
});

describe("simplify: classroom laws", () => {
  it.each([
    // [input, expected result, a law that must appear]
    ["A ∧ T", "A", "identity"],
    ["A ∨ F", "A", "identity"],
    ["A ∧ F", "F", "domination"],
    ["A ∨ T", "T", "domination"],
    ["A ∧ A", "A", "idempotent"],
    ["A ∨ B ∨ A", "A ∨ B", "idempotent"],
    ["A ∧ ¬A", "F", "complement"],
    ["B ∨ A ∨ ¬A", "T", "complement"],
    ["¬¬A", "A", "double-negation"],
    ["A ∨ (A ∧ B)", "A", "absorption"],
    ["A ∧ (A ∨ B)", "A", "absorption"],
    ["(B ∧ A) ∨ A", "A", "absorption"],
    ["A ∨ (¬A ∧ B)", "A ∨ B", "redundancy"],
    ["A ∧ (¬A ∨ B)", "A ∧ B", "redundancy"],
    ["(A ∧ B) ∨ (A ∧ C)", "A ∧ (B ∨ C)", "distributive"],
    ["(A ∨ B) ∧ (A ∨ C)", "A ∨ (B ∧ C)", "distributive"],
    ["¬(¬A ∧ ¬B)", "A ∨ B", "de-morgan"],
    ["¬(¬A ∨ B)", "A ∧ ¬B", "de-morgan"],
    ["¬(P → Q)", "P ∧ ¬Q", "negated-implication"],
    ["¬T", "F", "negation-of-constants"],
  ] as const)("%s simplifies to %s using %s", (input, expected, law) => {
    expect(simplified(input)).toBe(expected);
    expect(lawsUsed(input)).toContain(law);
  });

  it("the textbook example: (A ∧ B) ∨ (A ∧ ¬B) = A, via distributive → complement → identity", () => {
    const result = simplify(p("(A ∧ B) ∨ (A ∧ ¬B)"));
    expect(format(result.result)).toBe("A");
    expect(result.steps.map((s) => s.law)).toEqual(["distributive", "complement", "identity"]);
  });

  it("De Morgan is shown as the law states it, then double negations cancel", () => {
    const steps = simplify(p("¬(¬A ∧ ¬B)")).steps;
    expect(steps.map((s) => format(s.after))).toEqual(["¬¬A ∨ ¬¬B", "A ∨ ¬¬B", "A ∨ B"]);
  });

  it("leaves already-simple expressions alone", () => {
    for (const s of ["A", "¬A", "A ∧ B", "¬(A ∧ B)", "A ⊕ B", "A → B", "A ↔ B", "A ↑ B"]) {
      expect(simplify(p(s)).steps, s).toHaveLength(0);
    }
  });

  it("code-style: !(!a || !b) becomes a && b", () => {
    expect(format(simplify(p("!(!a || !b)")).result, "code")).toBe("a && b");
  });

  it("expands a definition only when it pays off: (P → Q) ∧ P = P ∧ Q", () => {
    const result = simplify(p("(P → Q) ∧ P"));
    expect(sameExpr(result.result, p("P ∧ Q"))).toBe(true);
    expect(result.steps[0].law).toBe("material-implication");
  });

  it("operator identities", () => {
    expect(simplified("P → P")).toBe("T");
    expect(simplified("A ⊕ A")).toBe("F");
    expect(simplified("A ↔ ¬A")).toBe("F");
    expect(simplified("A ↑ A")).toBe("¬A");
    expect(simplified("T → Q")).toBe("Q");
    expect(simplified("P → F")).toBe("¬P");
  });

  it("falls back to the minimal sum of products when the laws get stuck, and says so", () => {
    // Consensus theorem: not one of the laws we apply step by step.
    const result = simplify(p("(A ∧ B) ∨ (¬A ∧ C) ∨ (B ∧ C)"));
    expect(result.steps.at(-1)?.law).toBe("minimal-form");
    expect(size(result.result)).toBeLessThan(size(p("(A ∧ B) ∨ (¬A ∧ C) ∨ (B ∧ C)")));
    expect(result.isMinimal).toBe(true);
  });
});

describe("simplify: soundness", () => {
  // A spread of awkward inputs. Every single step must preserve the truth table.
  const inputs = [
    "¬(A ∧ ¬(B ∨ ¬C))",
    "(A ∨ B) ∧ (A ∨ ¬B) ∧ (¬A ∨ C)",
    "¬(P ↔ Q) ∨ (P ∧ Q)",
    "(P → Q) ∧ (Q → R) → (P → R)",
    "(A ↑ B) ↑ (A ↑ B)",
    "¬(A ↓ ¬B) ∧ C",
    "A ⊕ B ⊕ A",
    "((A ∧ T) ∨ (B ∧ F)) ⊙ ¬¬A",
    "(x && y) || (x && !y) || (!x && y)",
    "¬(¬(¬(A ∨ B)))",
    "(A ∧ B ∧ C) ∨ (A ∧ B ∧ ¬C) ∨ (A ∧ ¬B)",
    "(P ∨ Q) ∧ ¬P → Q",
  ];

  it.each(inputs)("%s: every step is an equivalence and the result is no bigger", (s) => {
    const input = p(s);
    const { steps, result } = simplify(input);
    let previous = input;
    for (const step of steps) {
      expect(format(step.before)).toBe(format(previous));
      expect(equivalent(step.before, step.after), `${format(step.before)} ⇒ ${format(step.after)} (${step.law})`).toBe(true);
      expect(equivalent(step.focus, step.replacement), step.law).toBe(true);
      previous = step.after;
    }
    expect(equivalent(input, result)).toBe(true);
    expect(size(result)).toBeLessThanOrEqual(size(input));
  });

  it("finds the minimum on every 2-variable function", () => {
    // All 16 truth functions of A, B written as clumsy sums of minterms.
    const minterms = ["(¬A ∧ ¬B)", "(¬A ∧ B)", "(A ∧ ¬B)", "(A ∧ B)"];
    for (let f = 0; f < 16; f++) {
      const chosen = minterms.filter((_, i) => f & (1 << (3 - i)));
      const text = chosen.length ? chosen.join(" ∨ ") : "A ∧ ¬A";
      const input = p(text);
      const { result } = simplify(input);
      expect(equivalent(input, result), text).toBe(true);
      const minimal = minimalSumOfProducts(input)!;
      expect(size(result), `${text} → ${format(result)}`).toBeLessThanOrEqual(size(minimal));
    }
  });

  it("variables that cancel out disappear", () => {
    const { result } = simplify(p("(A ∧ B) ∨ (A ∧ ¬B)"));
    expect(variablesOf(result)).toEqual(["A"]);
  });
});
