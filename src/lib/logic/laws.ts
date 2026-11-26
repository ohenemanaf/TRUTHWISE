/**
 * The boolean-algebra laws taught in a discrete maths / digital electronics
 * course. Each law's `forms` are written as parseable expressions, and the
 * unit tests check every one is a genuine equivalence, so this table can't
 * quietly teach something false.
 */

export type LawId =
  | "identity"
  | "domination"
  | "idempotent"
  | "complement"
  | "double-negation"
  | "commutative"
  | "associative"
  | "distributive"
  | "de-morgan"
  | "absorption"
  | "redundancy"
  | "negation-of-constants"
  | "material-implication"
  | "contrapositive"
  | "negated-implication"
  | "biconditional"
  | "exclusive-or"
  | "nand-nor"
  | "conditional-identities"
  | "evaluate"
  | "minimal-form";

export interface LawForm {
  readonly left: string;
  readonly right: string;
}

export interface Law {
  readonly id: LawId;
  readonly name: string;
  readonly aka?: string;
  /** Each form is `left ≡ right`. Duals (swap ∧/∨ and T/F) are listed together. */
  readonly forms: readonly LawForm[];
  readonly explanation: string;
  /** Laws the step-by-step simplifier applies but which aren't classroom laws. */
  readonly internal?: boolean;
}

export const LAWS: readonly Law[] = [
  {
    id: "identity",
    name: "Identity",
    forms: [
      { left: "A ∧ T", right: "A" },
      { left: "A ∨ F", right: "A" },
    ],
    explanation: "ANDing with true or ORing with false leaves a value unchanged, like adding 0 or multiplying by 1.",
  },
  {
    id: "domination",
    name: "Domination",
    aka: "Annulment, null law",
    forms: [
      { left: "A ∧ F", right: "F" },
      { left: "A ∨ T", right: "T" },
    ],
    explanation: "One false input forces AND to false, and one true input forces OR to true, whatever A is.",
  },
  {
    id: "idempotent",
    name: "Idempotent",
    forms: [
      { left: "A ∧ A", right: "A" },
      { left: "A ∨ A", right: "A" },
    ],
    explanation: "Saying the same thing twice adds nothing: duplicate terms can be dropped.",
  },
  {
    id: "complement",
    name: "Complement",
    aka: "Negation law, excluded middle / non-contradiction",
    forms: [
      { left: "A ∧ ¬A", right: "F" },
      { left: "A ∨ ¬A", right: "T" },
    ],
    explanation: "Something can't be both true and false (contradiction), and it must be one or the other (tautology).",
  },
  {
    id: "double-negation",
    name: "Double negation",
    aka: "Involution",
    forms: [{ left: "¬¬A", right: "A" }],
    explanation: "Two NOTs cancel. \"It's not untrue\" means \"it's true\".",
  },
  {
    id: "commutative",
    name: "Commutative",
    forms: [
      { left: "A ∧ B", right: "B ∧ A" },
      { left: "A ∨ B", right: "B ∨ A" },
    ],
    explanation: "Order doesn't matter for AND or OR. (It does for →!)",
  },
  {
    id: "associative",
    name: "Associative",
    forms: [
      { left: "(A ∧ B) ∧ C", right: "A ∧ (B ∧ C)" },
      { left: "(A ∨ B) ∨ C", right: "A ∨ (B ∨ C)" },
    ],
    explanation: "Grouping doesn't matter in a chain of the same operator, so brackets can be dropped.",
  },
  {
    id: "distributive",
    name: "Distributive",
    forms: [
      { left: "A ∧ (B ∨ C)", right: "(A ∧ B) ∨ (A ∧ C)" },
      { left: "A ∨ (B ∧ C)", right: "(A ∨ B) ∧ (A ∨ C)" },
    ],
    explanation:
      "Like factoring in algebra, a shared term can be pulled out. Unlike ordinary algebra, OR also distributes over AND.",
  },
  {
    id: "de-morgan",
    name: "De Morgan's laws",
    forms: [
      { left: "¬(A ∧ B)", right: "¬A ∨ ¬B" },
      { left: "¬(A ∨ B)", right: "¬A ∧ ¬B" },
    ],
    explanation: "To push a NOT inside brackets, negate each part AND flip the operator (∧ ↔ ∨). Forgetting the flip is the classic mistake.",
  },
  {
    id: "absorption",
    name: "Absorption",
    forms: [
      { left: "A ∨ (A ∧ B)", right: "A" },
      { left: "A ∧ (A ∨ B)", right: "A" },
    ],
    explanation: "If A alone already decides the result, the longer term containing A adds nothing.",
  },
  {
    id: "redundancy",
    name: "Redundancy",
    aka: "Absorption of the complement",
    forms: [
      { left: "A ∨ (¬A ∧ B)", right: "A ∨ B" },
      { left: "A ∧ (¬A ∨ B)", right: "A ∧ B" },
    ],
    explanation: "Once A is ORed in, the only rows left to cover have A false, so the ¬A condition is automatic and can go.",
  },
  {
    id: "negation-of-constants",
    name: "Negation of constants",
    forms: [
      { left: "¬T", right: "F" },
      { left: "¬F", right: "T" },
    ],
    explanation: "NOT true is false and NOT false is true.",
  },
  {
    id: "material-implication",
    name: "Material implication",
    aka: "Conditional as disjunction",
    forms: [{ left: "A → B", right: "¬A ∨ B" }],
    explanation: "\"If A then B\" fails only when A is true and B is false, which is exactly when ¬A ∨ B is false.",
  },
  {
    id: "contrapositive",
    name: "Contrapositive",
    forms: [{ left: "A → B", right: "¬B → ¬A" }],
    explanation: "\"If it's a dog, it's a mammal\" means the same as \"if it's not a mammal, it's not a dog\". (The converse B → A does NOT.)",
  },
  {
    id: "negated-implication",
    name: "Negation of a conditional",
    forms: [{ left: "¬(A → B)", right: "A ∧ ¬B" }],
    explanation: "The only way \"if A then B\" is false: A happened and B didn't.",
  },
  {
    id: "biconditional",
    name: "Biconditional",
    forms: [
      { left: "A ↔ B", right: "(A → B) ∧ (B → A)" },
      { left: "A ↔ B", right: "(A ∧ B) ∨ (¬A ∧ ¬B)" },
    ],
    explanation: "\"A if and only if B\" means the two always match: both true or both false. In electronics this is XNOR.",
  },
  {
    id: "exclusive-or",
    name: "Exclusive or",
    forms: [
      { left: "A ⊕ B", right: "(A ∧ ¬B) ∨ (¬A ∧ B)" },
      { left: "A ⊕ B", right: "¬(A ↔ B)" },
    ],
    explanation: "XOR is true when exactly one input is true, i.e. when the inputs differ.",
  },
  {
    id: "nand-nor",
    name: "NAND / NOR definitions",
    forms: [
      { left: "A ↑ B", right: "¬(A ∧ B)" },
      { left: "A ↓ B", right: "¬(A ∨ B)" },
      { left: "A ↑ A", right: "¬A" },
    ],
    explanation: "NAND is AND followed by NOT; NOR is OR followed by NOT. Wiring both inputs together turns either into a NOT gate.",
  },
  {
    id: "conditional-identities",
    name: "Conditional & XOR identities",
    forms: [
      { left: "A → A", right: "T" },
      { left: "T → A", right: "A" },
      { left: "A → F", right: "¬A" },
      { left: "A ⊕ A", right: "F" },
      { left: "A ⊕ T", right: "¬A" },
      { left: "A ↔ A", right: "T" },
    ],
    explanation: "Shortcuts for →, ⊕ and ↔ when both sides match or one side is a constant.",
    internal: true,
  },
  {
    id: "evaluate",
    name: "Evaluate",
    forms: [{ left: "T ∧ F", right: "F" }],
    explanation: "An operator applied to two constants is just looked up in its truth table.",
    internal: true,
  },
  {
    id: "minimal-form",
    name: "Minimal sum of products",
    aka: "Karnaugh map / Quine–McCluskey",
    forms: [{ left: "(A ∧ B) ∨ (¬A ∧ C) ∨ (B ∧ C)", right: "(A ∧ B) ∨ (¬A ∧ C)" }],
    explanation:
      "Read straight off the truth table: the smallest OR-of-ANDs that produces the same output column. Used when the step-by-step laws get stuck.",
    internal: true,
  },
];

export const LAW_BY_ID: Readonly<Record<LawId, Law>> = Object.fromEntries(
  LAWS.map((law) => [law.id, law]),
) as Record<LawId, Law>;
