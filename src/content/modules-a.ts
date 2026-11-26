import type { Module } from "./types";

export const MODULE_1: Module = {
  id: "foundations",
  number: 1,
  title: "What is a truth table?",
  framing: "Every course",
  color: "var(--color-ink)",
  lessons: [
    {
      slug: "what-is-a-truth-table",
      title: "True, false and every combination",
      summary: "Boolean values, and why a table with 2ⁿ rows covers every possibility.",
      minutes: 4,
      blocks: [
        {
          type: "text",
          text: `A **boolean** value can only be one of two things. Electronics calls them 1 and 0 (voltage or no voltage), maths calls them T and F, and code calls them \`true\` and \`false\`. It's the same pair of values under three names.

A **truth table** lists every possible combination of inputs and the output for each. Because each input has only two values, you can list them all: 1 input gives 2 rows, 2 inputs give 4, 3 inputs give 8. Every new input doubles the rows, so **n inputs give 2ⁿ rows**.`,
        },
        {
          type: "text",
          text: `The simplest connective is **NOT**, which flips a value. It has one input, so its table has two rows. Step through it:`,
        },
        { type: "build", expr: "¬A", caption: "Truth table for NOT A" },
        {
          type: "callout",
          text: `**Listing rows without missing any:** count in binary. With A and B, the rows are 00, 01, 10, 11. The first column changes slowest and the last column changes every row. Every table in Truthwise is laid out this way.`,
        },
      ],
      exercises: [
        {
          kind: "choose",
          id: "m1-rows-3",
          prompt: "A truth table has three inputs: A, B and C. How many rows does it need?",
          options: [{ text: "3" }, { text: "6" }, { text: "8" }, { text: "9" }],
          answer: 2,
          explain: "Each input doubles the number of rows: 2 × 2 × 2 = 2³ = **8**.",
        },
        { kind: "fill", id: "m1-fill-not", prompt: "Fill in the table for NOT A.", expr: "¬A" },
      ],
    },
    {
      slug: "and-or-not",
      title: "AND, OR and NOT",
      summary: "The three basic connectives, and the OR that's different from everyday English.",
      minutes: 6,
      blocks: [
        {
          type: "text",
          text: `**AND** is true only when _both_ sides are true. "I'll go if it's sunny AND I've finished work" fails if either part fails.`,
        },
        { type: "build", expr: "A ∧ B" },
        {
          type: "text",
          text: `**OR** is true when _at least one_ side is true, **including when both are**. This is _inclusive_ or. Everyday English often means "one or the other but not both" ("soup or salad?"). Logic has a separate operator for that, XOR, which you'll meet in Module 2.`,
        },
        { type: "build", expr: "A ∨ B" },
        {
          type: "text",
          text: `Connectives combine. To work out \`A ∧ ¬B\` by hand, add a column for \`¬B\` first, then use it. That's what the extra "working" columns are for:`,
        },
        { type: "build", expr: "A ∧ ¬B" },
      ],
      exercises: [
        { kind: "fill", id: "m1-fill-or", prompt: "Fill in the table for A OR B.", expr: "A ∨ B" },
        { kind: "fill", id: "m1-fill-or-not", prompt: "Fill in the table for NOT A OR B.", expr: "¬A ∨ B" },
      ],
    },
    {
      slug: "same-table-four-classes",
      title: "Same table, four classes",
      summary: "AND written in Digital Electronics, Discrete Maths, Critical Thinking and code, all at once.",
      minutes: 4,
      blocks: [
        {
          type: "text",
          text: `Here's the idea behind Truthwise. The AND you just built shows up in at least four courses, and each writes it differently:

**Digital Electronics** writes \`A · B\` with values 1 and 0, and draws it as a gate. **Discrete Maths** writes \`P ∧ Q\` with T and F. **Critical Thinking** says "P and Q". **Programming** writes \`a && b\`, which evaluates to \`true\` or \`false\`.

Underneath, they're all the same four rows. Use the toggle to switch between them. The values and symbols change, but the pattern of which rows are true never does.`,
        },
        {
          type: "bridge",
          expr: "A ∧ B",
          text: "Toggle between notations. In Gates view, pick a row to light up the wires. In Code view, pick a row to run the `if`.",
        },
        {
          type: "callout",
          text: `From here on, every table you see has this toggle. Keep it on the notation your course uses, or switch it to check what something means elsewhere.`,
        },
      ],
      exercises: [
        {
          kind: "choose",
          id: "m1-odd-one-out",
          prompt: "Which of these is **not** the same as P ∧ Q?",
          options: [{ text: "a && b" }, { text: "A · B" }, { text: "A + B" }, { text: "P AND Q" }],
          answer: 2,
          explain: "In Boolean algebra, `+` means **OR**, not AND. `A + B` is the electronics way of writing A ∨ B. The others are all AND.",
        },
      ],
    },
  ],
};

export const MODULE_2: Module = {
  id: "gates",
  number: 2,
  title: "Logic gates",
  framing: "Digital Electronics",
  color: "var(--color-binary)",
  lessons: [
    {
      slug: "basic-gates",
      title: "AND, OR and NOT gates",
      summary: "The physical circuits that compute truth tables, and their symbols.",
      minutes: 5,
      blocks: [
        {
          type: "text",
          text: `A **logic gate** is a tiny circuit that computes a truth table. A 1 is a high voltage on a wire and a 0 is a low one. The gate reads its input wires and drives its output wire.

Each connective has a standard symbol. AND has a flat back and a round front. OR has a curved back and a pointed front. NOT is a triangle with a small circle, the **bubble**. The bubble always means "invert here".`,
        },
        { type: "gates", gates: ["AND", "OR", "NOT"] },
        {
          type: "text",
          text: `Flip the inputs and watch the signal travel. Lit wires carry a 1:`,
        },
        { type: "circuit", expr: "A ∧ B", caption: "The output only lights when both inputs do." },
        { type: "circuit", expr: "A ∨ B", caption: "Either input alone is enough." },
      ],
      exercises: [
        {
          kind: "choose",
          id: "m2-match-or",
          prompt: "Which gate produces this output column?",
          table: "A ∨ B",
          options: [{ circuit: "A ∧ B" }, { circuit: "A ∨ B" }, { circuit: "A ⊕ B" }, { circuit: "¬(A ∨ B)" }],
          answer: 1,
          explain: "Output 0, 1, 1, 1 is **OR**: it's 1 whenever at least one input is 1.",
        },
      ],
    },
    {
      slug: "more-gates",
      title: "NAND, NOR, XOR and XNOR",
      summary: "Inverted gates, exclusive or, and why NAND can build anything.",
      minutes: 6,
      blocks: [
        {
          type: "text",
          text: `Add a bubble to the output of AND and you get **NAND** (NOT-AND). Do the same to OR and you get **NOR**. Their tables are the exact opposite of AND and OR.

**XOR** (exclusive or) is the "one or the other, but not both" that everyday English often means. It outputs 1 when the inputs _differ_. **XNOR** is its opposite: 1 when the inputs _match_.`,
        },
        { type: "gates", gates: ["NAND", "NOR", "XOR", "XNOR"] },
        {
          type: "text",
          text: `NAND is called a **universal gate**: every other gate can be built from NANDs alone, which is why chip factories love it. The simplest example is tying both inputs together. \`A NAND A\` is 0 only when A is 1, so it acts as a NOT gate:`,
        },
        { type: "circuit", expr: "A ↑ A", caption: "Both NAND inputs come from the same rail, so the gate behaves as NOT." },
      ],
      exercises: [
        {
          kind: "choose",
          id: "m2-match-xor",
          prompt: "Which gate matches this table?",
          table: "A ⊕ B",
          options: [{ circuit: "A ∨ B" }, { circuit: "¬(A ∧ B)" }, { circuit: "A ⊕ B" }, { circuit: "A ⊙ B" }],
          answer: 2,
          explain: "0, 1, 1, 0: the output is 1 exactly when the inputs differ. That's **XOR**.",
        },
        {
          kind: "write",
          id: "m2-nand-not",
          prompt: "Write an expression equal to NOT A using only NAND (no NOT symbols).",
          target: "¬A",
          hint: "e.g. something NAND something",
          forbid: ["¬", "!", "~", "not ", "'"],
        },
      ],
    },
    {
      slug: "combining-gates",
      title: "Combining gates into circuits",
      summary: "Wire gates together, trace signals through them, and build a half adder.",
      minutes: 6,
      blocks: [
        {
          type: "text",
          text: `Real circuits feed the outputs of some gates into the inputs of others. \`(A · B) + C\` is an AND gate whose output feeds an OR gate. To fill in its table, work out the inner gate first, in its own column, then the outer one.`,
        },
        { type: "build", expr: "(A ∧ B) ∨ C" },
        { type: "circuit", expr: "(A ∧ B) ∨ C" },
        {
          type: "text",
          text: `A famous two-gate circuit is the **half adder**, which adds two one-bit numbers. The **sum** bit is \`A ⊕ B\` (1 + 1 = 10 in binary, so the sum bit is 0) and the **carry** bit is \`A · B\`. Every calculator and CPU is built from circuits like this.`,
        },
        { type: "circuit", expr: "A ⊕ B", caption: "Half adder sum bit" },
        { type: "circuit", expr: "A ∧ B", caption: "Half adder carry bit" },
        {
          type: "bridge",
          expr: "(A ∧ B) ∨ ¬C",
          text: "To end the module, here's one circuit in all four notations. Switch to Gates and pick rows to trace it.",
        },
      ],
      exercises: [
        { kind: "fill", id: "m2-fill-circuit", prompt: "Fill in the output for (A · B) + C.", expr: "(A ∧ B) ∨ C" },
        {
          kind: "choose",
          id: "m2-match-nand",
          prompt: "Which circuit matches this table?",
          table: "¬(A ∧ B)",
          options: [{ circuit: "¬A ∧ ¬B" }, { circuit: "¬(A ∧ B)" }, { circuit: "¬(A ∨ B)" }, { circuit: "A ∧ ¬B" }],
          answer: 1,
          explain: "1, 1, 1, 0 is the opposite of AND: a **NAND** gate. Note that `¬A ∧ ¬B` (option A) is a different circuit with a different table. See De Morgan's laws in Module 4.",
        },
      ],
    },
  ],
};

export const MODULE_3: Module = {
  id: "propositional",
  number: 3,
  title: "Propositional logic",
  framing: "Discrete Maths",
  color: "var(--color-tf)",
  lessons: [
    {
      slug: "the-conditional",
      title: "The conditional: if P then Q",
      summary: "Why P → Q is true whenever P is false, and how it differs from its converse.",
      minutes: 7,
      blocks: [
        {
          type: "text",
          text: `In discrete maths, letters like P and Q stand for **propositions**: statements that are either true or false, like "it is raining". The connectives ∧, ∨ and ¬ work just as before.

The **conditional** \`P → Q\` ("if P then Q") is the one that surprises people. Think of it as a promise: "If you pass the exam, I'll buy you lunch." The only way to _break_ the promise is for you to pass while I don't buy lunch. If you don't pass, I haven't broken anything, whatever I do.`,
        },
        { type: "build", expr: "P → Q" },
        {
          type: "callout",
          text: `**False implies anything.** When P is false, \`P → Q\` is true. This is called _vacuous truth_. It feels strange, but it's what makes the conditional consistent: a rule is only broken by a case it actually covers.`,
        },
        {
          type: "text",
          text: `Order matters. The **converse** \`Q → P\` is a different statement. "If it's a dog, it's a mammal" is true, but "if it's a mammal, it's a dog" isn't. The **contrapositive** \`¬Q → ¬P\` ("if it's not a mammal, it's not a dog") always means the same as the original. Check both with a table:`,
        },
        { type: "compare", left: "P → Q", right: "Q → P", text: "A conditional against its converse:" },
        { type: "compare", left: "P → Q", right: "¬Q → ¬P", text: "A conditional against its contrapositive:" },
      ],
      exercises: [
        { kind: "fill", id: "m3-fill-conditional", prompt: "Fill in the table for P → Q.", expr: "P → Q" },
        {
          kind: "choose",
          id: "m3-contrapositive",
          prompt: "Which statement is equivalent to “If it rains, the match is cancelled”?",
          options: [
            { text: "If the match is cancelled, it rained." },
            { text: "If it doesn't rain, the match isn't cancelled." },
            { text: "If the match isn't cancelled, it didn't rain." },
            { text: "It rains and the match is cancelled." },
          ],
          answer: 2,
          explain: "That's the **contrapositive** (¬Q → ¬P), which always has the same truth table. The first option is the converse and the second is the inverse. Neither is equivalent.",
        },
      ],
    },
    {
      slug: "biconditional",
      title: "The biconditional: P if and only if Q",
      summary: "↔ as two conditionals at once, and as the XNOR gate.",
      minutes: 4,
      blocks: [
        {
          type: "text",
          text: `\`P ↔ Q\` ("P if and only if Q", often written _iff_) is true when P and Q **match**: both true or both false. It means the conditional holds in _both_ directions: \`(P → Q) ∧ (Q → P)\`.`,
        },
        { type: "build", expr: "P ↔ Q" },
        { type: "compare", left: "P ↔ Q", right: "(P → Q) ∧ (Q → P)" },
        {
          type: "text",
          text: `Look at the output column: 1, 0, 0, 1. That's the **XNOR** gate from Module 2. Discrete maths calls it the biconditional and electronics calls it XNOR, but it's the same truth table. In code it's \`a === b\` on booleans.`,
        },
      ],
      exercises: [
        {
          kind: "choose",
          id: "m3-iff-equivalent",
          prompt: "Which expression is equivalent to P ↔ Q?",
          options: [{ expr: "P → Q" }, { expr: "P ∧ Q" }, { expr: "(P ∧ Q) ∨ (¬P ∧ ¬Q)" }, { expr: "P ∨ Q" }],
          answer: 2,
          explain: "Either both are true **or** both are false. That's exactly when P and Q match.",
        },
      ],
    },
    {
      slug: "tautologies",
      title: "Tautologies, contradictions and equivalence",
      summary: "Expressions that are always true, never true, or depend on the inputs.",
      minutes: 6,
      blocks: [
        {
          type: "text",
          text: `Look at an expression's final column:

A **tautology** is true in _every_ row, like \`P ∨ ¬P\` ("it's raining or it isn't"). A **contradiction** is false in every row, like \`P ∧ ¬P\`. A **contingency** is true in some rows and false in others. Most expressions are contingencies.`,
        },
        { type: "table", expr: "P ∨ ¬P" },
        { type: "table", expr: "P ∧ ¬P" },
        {
          type: "text",
          text: `Two expressions are **logically equivalent** (written ≡) when their final columns match in every row. Equivalently, \`X ↔ Y\` is a tautology. That's how you _prove_ a law of logic: build both columns and compare them.`,
        },
        { type: "compare", left: "¬(P ∧ Q)", right: "¬P ∨ ¬Q" },
        {
          type: "bridge",
          expr: "(P → Q) ∨ (Q → P)",
          text: "One last check before Module 4: this is a tautology. Every row is true in every notation.",
        },
      ],
      exercises: [
        {
          kind: "choose",
          id: "m3-classify",
          prompt: "Is (P ∧ Q) → P a tautology, a contradiction or a contingency?",
          options: [{ text: "Tautology" }, { text: "Contradiction" }, { text: "Contingency" }],
          answer: 0,
          explain: "If P ∧ Q is true then P certainly is, so the conditional can never be broken. It's true in all four rows, so it's a **tautology**.",
        },
        {
          kind: "write",
          id: "m3-write-contradiction",
          prompt: "Write any contradiction that uses the variable P.",
          target: "P ∧ ¬P",
          hint: "something that can never be true",
        },
      ],
    },
  ],
};
