import type { Module } from "./types";

export const MODULE_4: Module = {
  id: "algebra",
  number: 4,
  title: "Boolean algebra & simplification",
  framing: "Electronics + Discrete Maths",
  color: "var(--color-gate)",
  lessons: [
    {
      slug: "laws-of-logic",
      title: "The laws, and De Morgan's",
      summary: "Identity, domination, complement and the most-used law of all.",
      minutes: 7,
      blocks: [
        {
          type: "text",
          text: `Boolean algebra is a set of rules for rewriting an expression without changing its truth table, much like \`x + 0 = x\` in ordinary algebra. Every law is an equivalence you can check with a table.

The basic ones are close to common sense: **Identity** \`A ∧ T = A\`. **Domination** \`A ∧ F = F\`. **Complement** \`A ∧ ¬A = F\` and \`A ∨ ¬A = T\`. **Idempotent** \`A ∧ A = A\`. **Double negation** \`¬¬A = A\`.`,
        },
        {
          type: "text",
          text: `**De Morgan's laws** say how to move a NOT inside brackets: negate each part **and flip the operator**.

\`¬(A ∧ B) = ¬A ∨ ¬B\`, and \`¬(A ∨ B) = ¬A ∧ ¬B\`

"It's not true that I'm both tired and hungry" means "I'm not tired, or I'm not hungry".`,
        },
        { type: "compare", left: "¬(A ∧ B)", right: "¬A ∨ ¬B", text: "The law, checked:" },
        {
          type: "compare",
          left: "¬(A ∧ B)",
          right: "¬A ∧ ¬B",
          text: "The classic mistake, forgetting to flip ∧ to ∨, is caught straight away:",
        },
        {
          type: "callout",
          text: `In electronics this is why a NAND gate equals an OR gate with bubbles on its inputs. The two symbols are interchangeable on a schematic.`,
        },
      ],
      exercises: [
        {
          kind: "write",
          id: "m4-de-morgan-or",
          prompt: "Rewrite ¬(A ∨ B) with no brackets.",
          target: "¬A ∧ ¬B",
          hint: "push the NOT inside",
          forbid: ["(", ")", "nor", "↓"],
        },
        {
          kind: "choose",
          id: "m4-de-morgan-pick",
          prompt: "Which is equivalent to ¬(P ∧ ¬Q)?",
          options: [{ expr: "¬P ∧ Q" }, { expr: "¬P ∨ Q" }, { expr: "P ∨ ¬Q" }, { expr: "¬P ∨ ¬Q" }],
          answer: 1,
          explain: "De Morgan gives ¬P ∨ ¬¬Q. Then double negation turns ¬¬Q into Q, leaving **¬P ∨ Q**.",
        },
      ],
    },
    {
      slug: "simplifying",
      title: "Simplifying expressions",
      summary: "Absorption and distribution, step by step, and why smaller means cheaper.",
      minutes: 8,
      blocks: [
        {
          type: "text",
          text: `Two more laws do most of the simplifying work:

**Absorption:** \`A ∨ (A ∧ B) = A\`. If A is true the whole thing is true, and if A is false, \`A ∧ B\` is false too. The B part never matters.

**Distributive:** \`(A ∧ B) ∨ (A ∧ C) = A ∧ (B ∨ C)\`. Pull out a shared term, like factoring in algebra. Unlike ordinary algebra, it also works the other way round: \`A ∨ (B ∧ C) = (A ∨ B) ∧ (A ∨ C)\`.`,
        },
        {
          type: "simplify",
          expr: "(A ∧ B) ∨ (A ∧ ¬B)",
          text: "Factor out A, notice B ∨ ¬B is always true, and drop it:",
        },
        { type: "simplify", expr: "¬(¬A ∧ ¬B)", text: "De Morgan, then two double negations:" },
        { type: "simplify", expr: "A ∧ (¬A ∨ B)" },
        {
          type: "text",
          text: `**Why bother?** Every operator is a gate in hardware and a check in code. A simpler expression means fewer gates (cheaper, faster, less power) and an \`if\` that's easier to read. Here's the first example before simplifying:`,
        },
        { type: "circuit", expr: "(A ∧ B) ∨ (A ∧ ¬B)", caption: "Four gates. After simplifying it's a plain wire from A, with no gates at all." },
        {
          type: "bridge",
          expr: "¬(¬A ∧ ¬B)",
          text: "This expression and A ∨ B have the same table in every notation. Try Code view: `!(!a && !b)` is just `a || b`.",
        },
      ],
      exercises: [
        {
          kind: "write",
          id: "m4-simplify-factor",
          prompt: "Simplify (A ∧ B) ∨ (A ∧ ¬B) as far as possible.",
          target: "A",
          hint: "the answer doesn't need B at all",
          forbid: ["B"],
        },
        {
          kind: "write",
          id: "m4-simplify-absorb",
          prompt: "Simplify P ∧ (P ∨ Q).",
          target: "P",
          forbid: ["Q"],
        },
      ],
    },
  ],
};

export const MODULE_5: Module = {
  id: "arguments",
  number: 5,
  title: "Arguments & validity",
  framing: "Critical Thinking",
  color: "var(--color-word)",
  lessons: [
    {
      slug: "what-is-validity",
      title: "What makes an argument valid",
      summary: "Premises, conclusions, and the one row that breaks an argument.",
      minutes: 6,
      blocks: [
        {
          type: "text",
          text: `An **argument** is a list of **premises** followed by a **conclusion**:

"If it's raining, the ground is wet. It's raining. **Therefore** the ground is wet."

An argument is **valid** when the conclusion _cannot_ be false while every premise is true. Validity is about the argument's _form_, not whether the premises are actually true.`,
        },
        {
          type: "callout",
          text: `**The whole trick.** Build one table with a column per premise and a column for the conclusion. Ignore every row where some premise is false. In the rows that remain, is the conclusion always true? If so, the argument is valid. A row with true premises and a false conclusion is a **counterexample**, and one is enough to make it invalid.`,
        },
        {
          type: "text",
          text: `Write P for "it's raining" and Q for "the ground is wet". The argument above is \`P → Q, P ∴ Q\`, known as **modus ponens**:`,
        },
        { type: "argument", argument: "P → Q, P ∴ Q", title: "Modus ponens" },
        {
          type: "text",
          text: `Only one row has both premises true, and its conclusion is true, so the argument is valid. **Modus tollens** runs the other way: if P leads to Q, and Q didn't happen, then P didn't either.`,
        },
        { type: "argument", argument: "P → Q, ¬Q ∴ ¬P", title: "Modus tollens" },
      ],
      exercises: [
        {
          kind: "validity",
          id: "m5-validity-mp",
          prompt: "“If the alarm goes off, everyone leaves. Everyone didn't leave. So the alarm didn't go off.” Valid or invalid?",
          argument: "A → L, ¬L ∴ ¬A",
        },
      ],
    },
    {
      slug: "valid-forms",
      title: "Chains and either-or",
      summary: "Hypothetical and disjunctive syllogism, proved with tables.",
      minutes: 5,
      blocks: [
        {
          type: "text",
          text: `**Hypothetical syllogism** chains conditionals: if P leads to Q and Q leads to R, then P leads to R. With three variables the table has 8 rows, but only the rows where both premises hold count:`,
        },
        { type: "argument", argument: "P → Q, Q → R ∴ P → R", title: "Hypothetical syllogism" },
        {
          type: "text",
          text: `**Disjunctive syllogism** is the process of elimination: it's P or Q, and it isn't P, so it must be Q.`,
        },
        { type: "argument", argument: "P ∨ Q, ¬P ∴ Q", title: "Disjunctive syllogism" },
      ],
      exercises: [
        {
          kind: "validity",
          id: "m5-validity-ds",
          prompt: "“The key is in my bag or my coat. It's not in my coat. So it's in my bag.” Valid or invalid?",
          argument: "B ∨ C, ¬C ∴ B",
        },
        {
          kind: "validity",
          id: "m5-validity-chain",
          prompt: "“If I study, I pass. If I pass, I graduate. So if I study, I graduate.” Valid or invalid?",
          argument: "S → P, P → G ∴ S → G",
        },
      ],
    },
    {
      slug: "fallacies",
      title: "Fallacies that feel valid",
      summary: "Affirming the consequent and denying the antecedent, caught red-handed.",
      minutes: 6,
      blocks: [
        {
          type: "text",
          text: `Some invalid arguments sound almost exactly like valid ones. **Affirming the consequent:**

"If it's raining, the ground is wet. The ground is wet. Therefore it's raining."

But a sprinkler could have wet the ground. The table finds that case:`,
        },
        { type: "argument", argument: "P → Q, Q ∴ P", title: "Affirming the consequent (invalid)" },
        {
          type: "text",
          text: `The red row (P false, Q true) is the sprinkler: not raining, ground wet. Both premises are true and the conclusion is false. **Denying the antecedent** fails on the same row:

"If it's raining, the ground is wet. It's not raining. Therefore the ground isn't wet."`,
        },
        { type: "argument", argument: "P → Q, ¬P ∴ ¬Q", title: "Denying the antecedent (invalid)" },
        {
          type: "text",
          text: `Here's how this connects to Module 3. An argument is valid exactly when "(all premises) → conclusion" is a **tautology**. Modus ponens is valid, so \`((P → Q) ∧ P) → Q\` is true in every row, in every notation:`,
        },
        { type: "bridge", expr: "((P → Q) ∧ P) → Q" },
      ],
      exercises: [
        {
          kind: "validity",
          id: "m5-validity-ac",
          prompt: "“If you're a chef, you can cook. You can cook. So you're a chef.” Valid or invalid?",
          argument: "C → K, K ∴ C",
        },
        {
          kind: "validity",
          id: "m5-validity-da",
          prompt: "“If it's a weekday, the shop is open. It's not a weekday. So the shop is closed.” Valid or invalid?",
          argument: "W → O, ¬W ∴ ¬O",
        },
      ],
    },
  ],
};

export const MODULE_6: Module = {
  id: "code",
  number: 6,
  title: "Boolean logic in code",
  framing: "Computer Science",
  color: "var(--color-code)",
  lessons: [
    {
      slug: "operators-in-code",
      title: "&&, || and !",
      summary: "The same connectives in JavaScript, Python, Java and C, and how they bind.",
      minutes: 5,
      blocks: [
        {
          type: "text",
          text: `Every \`if\` statement is a truth table. In C-family languages (JavaScript, Java, C, C#), AND is \`&&\`, OR is \`||\` and NOT is \`!\`. Python spells them \`and\`, \`or\`, \`not\`. On booleans, \`===\` behaves as ↔ and \`!==\` as XOR.`,
        },
        {
          type: "code",
          code: `const canPost = isMember && !isBanned;

if (isAdmin || isOwner) {
  showDeleteButton();
}`,
        },
        { type: "bridge", expr: "isMember && !isBanned", text: "Switch to Code view, then pick rows to run the condition with different values." },
        {
          type: "text",
          text: `**Precedence:** \`!\` binds tightest, then \`&&\`, then \`||\`. So \`a || b && c\` means \`a || (b && c)\`, not \`(a || b) && c\`. When you mix && and ||, add brackets anyway. Your reviewer will thank you.`,
        },
        { type: "compare", left: "a || b && c", right: "(a || b) && c", text: "Brackets change the meaning:" },
      ],
      exercises: [
        {
          kind: "choose",
          id: "m6-precedence",
          prompt: "In JavaScript, what does `!a && b` mean?",
          options: [{ text: "!(a && b)" }, { text: "(!a) && b" }, { text: "!(a) && !(b)" }],
          answer: 1,
          explain: "`!` binds tighter than `&&`, so it applies only to **a**. To negate the whole thing you need brackets: `!(a && b)`.",
        },
        {
          kind: "fill",
          id: "m6-fill-code",
          prompt: "Fill in the result of isMember && !isBanned for every row.",
          expr: "isMember && !isBanned",
        },
      ],
    },
    {
      slug: "short-circuit-and-truthiness",
      title: "Short-circuiting and truthy values",
      summary: "Why && can skip its right side, and values that act like true or false.",
      minutes: 6,
      blocks: [
        {
          type: "text",
          text: `Look at the AND table again. If the left side is false, the result is false _whatever_ the right side is. So languages don't evaluate the right side at all. This is **short-circuit evaluation**. \`||\` does the same when the left side is true.

Programmers rely on it every day to guard against errors:`,
        },
        { type: "table", expr: "a && b", working: false },
        {
          type: "code",
          code: `// Safe: if user is null, user.name is never evaluated.
if (user && user.name === "Ada") { … }

// Default values: the right side runs only when the left is falsy.
const title = input || "Untitled";`,
          caption: "Swap the order (user.name && user) and it crashes when user is null.",
        },
        {
          type: "text",
          text: `**Truthy and falsy.** In JavaScript, \`&&\` and \`||\` accept any value, not just booleans. These are **falsy** (treated as false): \`false\`, \`0\`, \`""\`, \`null\`, \`undefined\`, \`NaN\`. _Everything else is truthy_, including \`"0"\`, \`"false"\`, \`[]\` and \`{}\`.

Python differs: an empty list \`[]\` is falsy there. When the language is ambiguous, compare explicitly (\`items.length > 0\`) and the truth table is the one you expect.`,
        },
        {
          type: "code",
          code: `if ([]) console.log("runs!");        // JS: [] is truthy
if ("0") console.log("runs too!");   // a non-empty string is truthy
if (0) console.log("never runs");    // 0 is falsy`,
        },
      ],
      exercises: [
        {
          kind: "choose",
          id: "m6-truthy",
          prompt: "In JavaScript, which value makes `if (x)` run its block?",
          options: [{ text: "0" }, { text: '""' }, { text: "[]" }, { text: "null" }],
          answer: 2,
          explain: "An empty array is an object, and every object is **truthy** in JavaScript. The others are all falsy.",
        },
        {
          kind: "choose",
          id: "m6-short-circuit",
          prompt: "`isReady() || loadConfig()`: when does `loadConfig()` run?",
          options: [{ text: "Always" }, { text: "Only when isReady() is true" }, { text: "Only when isReady() is false" }],
          answer: 2,
          explain: "OR is already true if its left side is true, so the right side only runs when the left is **false**.",
        },
      ],
    },
    {
      slug: "de-morgan-in-code",
      title: "Cleaning up conditions with De Morgan",
      summary: "Turn tangled negations into an if statement you can read.",
      minutes: 5,
      blocks: [
        {
          type: "text",
          text: `Conditions full of \`!\` are hard to read, and every extra negation is a chance to slip. De Morgan's laws from Module 4 untangle them:

\`!(a && b)\` → \`!a || !b\`, and \`!(a || b)\` → \`!a && !b\``,
        },
        {
          type: "code",
          code: `// Before: what does this even mean?
if (!(!isWeekend || !isSunny)) goToBeach();

// After De Morgan + double negation:
if (isWeekend && isSunny) goToBeach();`,
        },
        { type: "simplify", expr: "!(!isWeekend || !isSunny)" },
        {
          type: "text",
          text: `Refactoring a condition is only safe if the truth table stays the same. That's exactly what Truthwise checks. Paste any tangled condition into Experiment and it shows you the simplest equivalent.`,
        },
        {
          type: "bridge",
          expr: "!(!isWeekend || !isSunny)",
          text: "The final bridge: a real `if` condition, in all four notations, from code back to a circuit.",
        },
      ],
      exercises: [
        {
          kind: "write",
          id: "m6-simplify-code",
          prompt: "Rewrite !(!a || b) without negating a bracket.",
          target: "a && !b",
          hint: "e.g. a && …",
          forbid: ["!(", "¬(", "not (", "not(", "~("],
        },
        {
          kind: "choose",
          id: "m6-refactor",
          prompt: "Which refactor of `!(isAdmin || isOwner)` is correct?",
          options: [
            { text: "!isAdmin || !isOwner" },
            { text: "!isAdmin && !isOwner" },
            { text: "isAdmin && isOwner" },
          ],
          answer: 1,
          explain: "Negate both parts **and** flip || to &&. Option A forgets the flip, which is the most common De Morgan bug in real code.",
        },
      ],
    },
  ],
};
