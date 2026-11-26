import type { Block } from "./types";

export interface Mistake {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  /** Where students usually meet it. */
  readonly course: string;
  readonly wrong: string;
  readonly why: string;
  /** Truth-table evidence: compare / argument / table blocks. */
  readonly evidence: readonly Block[];
  readonly right: string;
}

export const MISTAKES: readonly Mistake[] = [
  {
    slug: "everyday-and-means-or",
    title: "When “and” in English means OR",
    summary: "“Show me customers in Ghana and Nigeria” is an OR query.",
    course: "Computer Science",
    wrong: `A manager asks for "customers in Ghana **and** customers in Nigeria". You write the filter \`inGhana && inNigeria\`. It returns **nobody**.`,
    why: `A customer lives in one country, so no row has both G and N true. In everyday English, "Ghana and Nigeria" means _put both groups together_, which is a union, and a union is **OR**. The table shows that AND only keeps rows where both are true, and in real data that row never happens.`,
    evidence: [{ type: "compare", left: "G ∧ N", right: "G ∨ N" }],
    right: `Translate the _meaning_, not the word: the filter is \`inGhana || inNigeria\`. Before coding a condition, ask: "Should a row pass when just one part is true?" If yes, you want OR.`,
  },
  {
    slug: "de-morgan-without-the-flip",
    title: "De Morgan without the flip",
    summary: "¬(A ∧ B) is not ¬A ∧ ¬B.",
    course: "Discrete Maths",
    wrong: `"To negate \`A ∧ B\`, negate both parts: \`¬(A ∧ B) = ¬A ∧ ¬B\`." It looks like distributing a minus sign in algebra.`,
    why: `"It's not true that I'm both tired and hungry" is true when I'm only tired, but "I'm not tired and not hungry" is false then. The table finds the two rows where exactly one is true, and the two sides disagree there.`,
    evidence: [{ type: "compare", left: "¬(A ∧ B)", right: "¬A ∧ ¬B" }],
    right: `Negate each part **and** flip the operator: \`¬(A ∧ B) = ¬A ∨ ¬B\` and \`¬(A ∨ B) = ¬A ∧ ¬B\`. In code: \`!(a && b)\` becomes \`!a || !b\`.`,
  },
  {
    slug: "necessary-vs-sufficient",
    title: "Necessary vs sufficient (→ backwards)",
    summary: "“You need a ticket to board” doesn't mean a ticket gets you on.",
    course: "Critical Thinking",
    wrong: `The rule is "you need a boarding pass to board" (B → P: if you boarded, you had a pass). Someone concludes that having a pass guarantees you can board (P → B).`,
    why: `A boarding pass is **necessary** (you can't board without one) but not **sufficient** (you could still miss the flight). B → P and P → B are converses, and their tables differ in the row where you hold a pass but didn't board.`,
    evidence: [{ type: "compare", left: "B → P", right: "P → B" }],
    right: `In \`X → Y\`, X is _sufficient_ for Y and Y is _necessary_ for X. "Only if" points at the necessary part: "you board **only if** you have a pass" is B → P. Check the direction before you reason with it.`,
  },
  {
    slug: "invalid-forms-that-feel-valid",
    title: "Affirming the consequent & denying the antecedent",
    summary: "Two invalid argument forms that sound just like modus ponens.",
    course: "Critical Thinking",
    wrong: `"If the server is down, the site shows an error. The site shows an error. **So the server is down.**" Or: "If the server is down, the site errors. The server isn't down. **So the site won't error.**"`,
    why: `Both ignore the other ways Q can happen: a bad deploy can show an error with the server running fine. Each table has a red counterexample row (P false, Q true) where every premise is true and the conclusion is false.`,
    evidence: [
      { type: "argument", argument: "P → Q, Q ∴ P", title: "Affirming the consequent" },
      { type: "argument", argument: "P → Q, ¬P ∴ ¬Q", title: "Denying the antecedent" },
    ],
    right: `The valid look-alikes are **modus ponens** (P → Q, P ∴ Q) and **modus tollens** (P → Q, ¬Q ∴ ¬P). From "P → Q" you can only move forward from P, or backward from not-Q.`,
  },
  {
    slug: "missed-rows",
    title: "Missing a row in a 3-variable table",
    summary: "Listing combinations by hand and skipping one, which changes the verdict.",
    course: "Every course",
    wrong: `Building a table for \`A ∨ B ∨ C\` by listing combinations as they come to mind: 111, 110, 101, 011, 100, 010, 001. Every row comes out true, so "it's a tautology!"`,
    why: `Three variables need 2³ = **8** rows, and only 7 were listed. The missing row, 000, is the only one where the output is false. A single missing row turned a contingency into a fake tautology.`,
    evidence: [{ type: "table", expr: "A ∨ B ∨ C", working: false }],
    right: `Never list rows freehand. **Count in binary** from 000 to 111: the first column is four 0s then four 1s, the second alternates in pairs, and the last alternates every row. Then count the rows: there must be 2ⁿ.`,
  },
  {
    slug: "xor-vs-or",
    title: "Confusing XOR with OR",
    summary: "“Coffee or tea?” is exclusive. Logical OR isn't.",
    course: "Digital Electronics",
    wrong: `"OR means one or the other, so \`A ∨ B\` is false when both are true, just like 'coffee or tea' at a café."`,
    why: `Logical OR is **inclusive**: it's true when at least one side is, and that includes both. The exclusive "one but not both" is a different operator, **XOR**. The two tables differ in exactly one row: both inputs true.`,
    evidence: [{ type: "compare", left: "A ∨ B", right: "A ⊕ B" }],
    right: `Use ∨ / \`||\` / OR gate for "at least one" and ⊕ / \`!==\` / XOR gate for "exactly one". In circuits that one row matters: XOR is the sum bit in an adder and OR isn't.`,
  },
  {
    slug: "operator-precedence",
    title: "Operator precedence",
    summary: "NOT binds tightest, then AND, then OR, whatever the spacing suggests.",
    course: "Computer Science",
    wrong: `Reading \`!a && b\` as "not (a and b)", or \`a || b && c\` as "(a or b) and c", because that's the order the words appear in.`,
    why: `NOT applies only to the term right after it, and AND binds tighter than OR (like × before +). So \`!a && b\` means \`(!a) && b\`, and \`a || b && c\` means \`a || (b && c)\`. The tables show these are different functions.`,
    evidence: [
      { type: "compare", left: "¬A ∧ B", right: "¬(A ∧ B)" },
      { type: "compare", left: "A ∨ (B ∧ C)", right: "(A ∨ B) ∧ C" },
    ],
    right: `Precedence, from tightest: **NOT, then AND, then OR**, then → and ↔ in logic. When you mix operators, add brackets, even when they aren't needed. Truthwise always prints mixed operators with brackets for this reason.`,
  },
];

export const findMistake = (slug: string) => MISTAKES.find((m) => m.slug === slug) ?? null;
