import type { GateType } from "@/lib/logic";

/** One row of the notation Rosetta Stone. `expr` is printed in every notation by the engine. */
export interface RosettaRow {
  readonly concept: string;
  readonly expr: string;
  readonly gate: GateType | null;
  readonly everyday: string;
}

export const ROSETTA: readonly RosettaRow[] = [
  { concept: "Not", expr: "¬A", gate: "NOT", everyday: "it is not the case that A" },
  { concept: "And", expr: "A ∧ B", gate: "AND", everyday: "both A and B" },
  { concept: "Or (inclusive)", expr: "A ∨ B", gate: "OR", everyday: "A or B, or both" },
  { concept: "Exclusive or", expr: "A ⊕ B", gate: "XOR", everyday: "A or B, but not both" },
  { concept: "Not-and", expr: "A ↑ B", gate: "NAND", everyday: "not both A and B" },
  { concept: "Not-or", expr: "A ↓ B", gate: "NOR", everyday: "neither A nor B" },
  { concept: "Equivalence", expr: "A ↔ B", gate: "XNOR", everyday: "A if and only if B" },
  { concept: "Conditional", expr: "A → B", gate: null, everyday: "if A then B; A only if B" },
];

export interface ArgumentForm {
  readonly name: string;
  readonly argument: string;
  /** Plain-English instance. */
  readonly example: string;
  /** What the form is expected to be; tests check the engine agrees. */
  readonly expected: "valid" | "invalid";
  readonly looksLike?: string;
}

export const ARGUMENT_FORMS: readonly ArgumentForm[] = [
  {
    name: "Modus ponens",
    argument: "P → Q, P ∴ Q",
    example: "If it rains, the ground gets wet. It rains. So the ground is wet.",
    expected: "valid",
  },
  {
    name: "Modus tollens",
    argument: "P → Q, ¬Q ∴ ¬P",
    example: "If it rains, the ground gets wet. The ground is dry. So it didn't rain.",
    expected: "valid",
  },
  {
    name: "Hypothetical syllogism",
    argument: "P → Q, Q → R ∴ P → R",
    example: "If I study, I pass. If I pass, I graduate. So if I study, I graduate.",
    expected: "valid",
  },
  {
    name: "Disjunctive syllogism",
    argument: "P ∨ Q, ¬P ∴ Q",
    example: "It's in my bag or my coat. Not my bag. So it's in my coat.",
    expected: "valid",
  },
  {
    name: "Constructive dilemma",
    argument: "P → Q, R → S, P ∨ R ∴ Q ∨ S",
    example: "If I take the bus I'll read; if I walk I'll think. I'll bus or walk. So I'll read or think.",
    expected: "valid",
  },
  {
    name: "Conjunction",
    argument: "P, Q ∴ P ∧ Q",
    example: "It's sunny. It's warm. So it's sunny and warm.",
    expected: "valid",
  },
  {
    name: "Simplification",
    argument: "P ∧ Q ∴ P",
    example: "It's sunny and warm. So it's sunny.",
    expected: "valid",
  },
  {
    name: "Addition",
    argument: "P ∴ P ∨ Q",
    example: "It's sunny. So it's sunny or snowing.",
    expected: "valid",
  },
  {
    name: "Affirming the consequent",
    argument: "P → Q, Q ∴ P",
    example: "If it rains, the ground is wet. The ground is wet. So it rained. (A sprinkler?)",
    expected: "invalid",
    looksLike: "Modus ponens",
  },
  {
    name: "Denying the antecedent",
    argument: "P → Q, ¬P ∴ ¬Q",
    example: "If it rains, the ground is wet. It didn't rain. So the ground is dry. (A sprinkler?)",
    expected: "invalid",
    looksLike: "Modus tollens",
  },
  {
    name: "Affirming a disjunct",
    argument: "P ∨ Q, P ∴ ¬Q",
    example: "It's a holiday or a weekend. It's a holiday. So it's not a weekend. (It can be both.)",
    expected: "invalid",
    looksLike: "Disjunctive syllogism",
  },
];
