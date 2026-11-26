import { describe, expect, it } from "vitest";
import { and, c, iff, implies, nand, nor, not, or, structuralKey, v, xnor, xor, type Expr } from "./ast";
import { parse, parseOrThrow } from "./parser";

const A = v("A");
const B = v("B");
const C = v("C");

const same = (input: string, expected: Expr) =>
  expect(structuralKey(parseOrThrow(input)), input).toBe(structuralKey(expected));

describe("parser: every notation produces the same tree", () => {
  it.each([
    "A ∧ B",
    "A && B",
    "A & B",
    "A AND B",
    "A and B",
    "A · B",
    "A * B",
  ])("AND: %s", (s) => same(s, and(A, B)));

  it.each(["A ∨ B", "A || B", "A | B", "A OR B", "A or B", "A + B"])("OR: %s", (s) => same(s, or(A, B)));

  it.each(["¬A", "~A", "!A", "NOT A", "not A", "A'"])("NOT: %s", (s) => same(s, not(A)));

  it.each(["A ⊕ B", "A ^ B", "A XOR B", "A != B", "A !== B"])("XOR: %s", (s) => same(s, xor(A, B)));

  it.each(["A → B", "A -> B", "A => B", "A ⇒ B", "A IMPLIES B"])("IMPLIES: %s", (s) => same(s, implies(A, B)));

  it.each(["A ↔ B", "A <-> B", "A <=> B", "A ⇔ B", "A ≡ B", "A IFF B", "A == B", "A === B"])(
    "IFF: %s",
    (s) => same(s, iff(A, B)),
  );

  it("NAND / NOR / XNOR", () => {
    same("A NAND B", nand(A, B));
    same("A ↑ B", nand(A, B));
    same("A NOR B", nor(A, B));
    same("A ↓ B", nor(A, B));
    same("A XNOR B", xnor(A, B));
    same("A ⊙ B", xnor(A, B));
  });

  it("constants", () => {
    for (const t of ["T", "1", "true", "TRUE", "⊤"]) same(t, c(true));
    for (const f of ["F", "0", "false", "FALSE", "⊥"]) same(f, c(false));
  });

  it("identifiers can be long names, as in code", () => {
    same("isAdmin && hasToken", and(v("isAdmin"), v("hasToken")));
    same("x1 || x_2", or(v("x1"), v("x_2")));
  });

  it("mixed notations in one expression", () => {
    same("!A AND (B ∨ C)", and(not(A), or(B, C)));
  });

  it("square brackets group too", () => same("[A ∨ B] ∧ C", and(or(A, B), C)));
});

describe("parser: precedence and associativity", () => {
  it("NOT binds tighter than AND", () => same("NOT A AND B", and(not(A), B)));
  it("AND binds tighter than OR", () => same("A ∨ B ∧ C", or(A, and(B, C))));
  it("XOR sits between AND and OR", () => {
    same("A ∨ B ⊕ C", or(A, xor(B, C)));
    same("A ⊕ B ∧ C", xor(A, and(B, C)));
  });
  it("OR binds tighter than →, which binds tighter than ↔", () => {
    same("A ∨ B → C", implies(or(A, B), C));
    same("A → B ↔ C", iff(implies(A, B), C));
  });
  it("→ is right-associative", () => same("A → B → C", implies(A, implies(B, C))));
  it("AND chains are left-associative", () => same("A ∧ B ∧ C", and(and(A, B), C)));
  it("code equality binds tighter than && (as in JavaScript)", () => {
    same("a == b && c", and(iff(v("a"), v("b")), v("c")));
    same("a != b || c", or(xor(v("a"), v("b")), v("c")));
  });
  it("but the logic biconditional binds loosest", () => same("A ↔ B ∧ C", iff(A, and(B, C))));
  it("postfix prime binds tightest", () => {
    same("A · B'", and(A, not(B)));
    same("(A + B)'", not(or(A, B)));
    same("A''", not(not(A)));
  });
  it("double prefix negation", () => same("¬¬A", not(not(A))));
});

describe("parser: helpful errors", () => {
  const error = (s: string) => {
    const r = parse(s);
    if (r.ok) throw new Error(`expected "${s}" to fail`);
    return r.error;
  };

  it("empty input", () => expect(error("  ").message).toMatch(/Type an expression/));
  it("missing operand", () => expect(error("A ∧").message).toMatch(/ends too early/));
  it("missing left operand", () => expect(error("∧ B").message).toMatch(/needs something on its left/));
  it("unbalanced brackets", () => {
    expect(error("(A ∧ B").message).toMatch(/Missing closing/);
    expect(error("A ∧ B)").message).toMatch(/no matching opening/);
  });
  it("juxtaposition is not implicit AND", () => {
    const e = error("A B");
    expect(e.message).toMatch(/no operator between them/);
    expect(e.position).toBe(2);
  });
  it("single = is called out", () => expect(error("A = B").message).toMatch(/single "="/));
  it("unknown symbol with position", () => {
    const e = error("A $ B");
    expect(e.message).toMatch(/Unknown symbol "\$"/);
    expect(e.position).toBe(2);
  });
  it("only 0 and 1 are numbers", () => expect(error("A ∧ 2").message).toMatch(/Only 0 and 1/));
  it("empty brackets", () => expect(error("()").message).toMatch(/Empty brackets/));
});
