import { describe, expect, it } from "vitest";
import { canonicalKey } from "./ast";
import { format, toIfStatement, type TextNotation } from "./format";
import { parseOrThrow as p } from "./parser";
import { equivalent } from "./truth-table";

const NOTATIONS: TextNotation[] = ["symbolic", "electronics", "code", "word"];

describe("format: each notation", () => {
  it("prints the same expression four ways", () => {
    const e = p("¬P ∨ (P ∧ Q)");
    expect(format(e, "symbolic")).toBe("¬P ∨ (P ∧ Q)");
    expect(format(e, "electronics")).toBe("P' + (P · Q)");
    expect(format(e, "code")).toBe("!P || (P && Q)");
    expect(format(e, "word")).toBe("NOT P OR (P AND Q)");
  });

  it("negating a group brackets it", () => {
    expect(format(p("¬(A ∧ B)"))).toBe("¬(A ∧ B)");
    expect(format(p("¬(A ∧ B)"), "electronics")).toBe("(A · B)'");
    expect(format(p("¬(A ∧ B)"), "code")).toBe("!(A && B)");
    expect(format(p("¬(A ∧ B)"), "word")).toBe("NOT (A AND B)");
  });

  it("operators a notation lacks are written with ones it has", () => {
    expect(format(p("A → B"), "code")).toBe("!A || B");
    expect(format(p("A → B"), "electronics")).toBe("A' + B");
    expect(format(p("A ↑ B"), "code")).toBe("!(A && B)");
    expect(format(p("A ↓ B"), "electronics")).toBe("(A + B)'");
    expect(format(p("A ⊕ B"), "code")).toBe("A !== B");
    expect(format(p("A ↔ B"), "code")).toBe("A === B");
    expect(format(p("A ↔ B"), "electronics")).toBe("A ⊙ B");
  });

  it("constants", () => {
    expect(format(p("A ∧ T"), "symbolic")).toBe("A ∧ T");
    expect(format(p("A ∧ T"), "electronics")).toBe("A · 1");
    expect(format(p("A ∧ T"), "code")).toBe("A && true");
    expect(format(p("A ∧ T"), "word")).toBe("A AND TRUE");
  });

  it("clarity mode brackets mixed operators; minimal mode leans on precedence", () => {
    const e = p("A ∧ B ∨ C");
    expect(format(e)).toBe("(A ∧ B) ∨ C");
    expect(format(e, "symbolic", { clarity: false })).toBe("A ∧ B ∨ C");
  });

  it("keeps → chains explicit and same-operator chains flat", () => {
    expect(format(p("A → B → C"))).toBe("A → (B → C)");
    expect(format(p("(A → B) → C"))).toBe("(A → B) → C");
    expect(format(p("A ∧ B ∧ C"))).toBe("A ∧ B ∧ C");
    expect(format(p("A ∧ (B ∧ C)"))).toBe("A ∧ B ∧ C");
  });

  it("brackets code equality inside && so the meaning is unchanged", () => {
    // (a ↔ b) ∧ c in code. JS precedence already gives the same reading, but the brackets make it obvious.
    expect(format(p("(a ↔ b) ∧ c"), "code")).toBe("(a === b) && c");
    // a ↔ (b ∧ c): without brackets JS would read a === b && c as (a === b) && c.
    expect(format(p("a ↔ (b ∧ c)"), "code")).toBe("a === (b && c)");
    expect(format(p("a ↔ (b ∧ c)"), "code", { clarity: false })).toBe("a === (b && c)");
  });

  it("if statement", () => {
    expect(toIfStatement(p("A AND NOT B"))).toContain("if (A && !B) {");
  });
});

describe("format: round trips", () => {
  const samples = [
    "A",
    "¬A",
    "¬¬A",
    "A ∧ B",
    "A ∨ B ∧ C",
    "(A ∨ B) ∧ C",
    "¬(A ∨ B) ∧ ¬C",
    "A ⊕ B ⊕ C",
    "A → B → C",
    "(A → B) → C",
    "A ↔ B ↔ C",
    "A ↑ B",
    "(A ↑ B) ↑ C",
    "A ↓ (B ↓ C)",
    "A ⊙ B",
    "¬(A → B) ∨ (C ↔ ¬A)",
    "(A ∧ T) ∨ F",
    "a == b && c",
    "a == (b && c)",
  ];

  for (const notation of NOTATIONS) {
    for (const clarity of [true, false]) {
      it.each(samples)(`${notation}${clarity ? "" : " (minimal)"}: %s re-parses to an equivalent expression`, (s) => {
        const original = p(s);
        const printed = format(original, notation, { clarity });
        const reparsed = p(printed);
        expect(equivalent(original, reparsed), `${s} → ${printed}`).toBe(true);
      });
    }
  }

  it("symbolic printing preserves the exact structure (not just the meaning)", () => {
    for (const s of samples) {
      const original = p(s);
      expect(canonicalKey(p(format(original, "symbolic", { clarity: false }))), s).toBe(canonicalKey(original));
    }
  });
});
