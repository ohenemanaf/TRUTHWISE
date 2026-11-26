# Truthwise

**One truth table, four classes.** Truthwise is a free, interactive way to learn Boolean logic and truth tables. It shows that the logic taught in four different courses is the same thing written four different ways.

| Course | Writes AND as | Values |
|---|---|---|
| Digital Electronics | `A · B`, an AND gate | 1 / 0 |
| Discrete Maths | `P ∧ Q` | T / F |
| Critical Thinking | "P and Q" | true / false |
| Computer Science | `a && b` | `true` / `false` |

## Why I built it

Truth tables come up in Digital Electronics, Discrete Maths, Critical Thinking and "Logic in Computer Science", and each course teaches them as if they were new. Nobody points out that the 1/0 gate table, the T/F propositional table and the `if (a && b)` condition have exactly the same rows. Every table in Truthwise has a **notation toggle** that re-labels the same table between those courses with an animated transition, so you can see the connection directly.

It's the second tool in a learning series. The first, **BranchWise**, teaches Git & GitHub in the same four-mode format.

## The four modes

- **Teach:** six modules (truth tables, logic gates, propositional logic, Boolean algebra, arguments & validity, logic in code), 17 lessons. Tables are built row by row with a narrated explanation, each module ends with a notation bridge, and each lesson has exercises: filling in tables, matching gates, writing expressions and judging validity.
- **Experiment:** type any expression in any notation. You get a live truth table, a gate circuit with wires that light up per row, the `if` statement version, and a step-by-step simplification naming each law it uses.
- **Learn from mistakes:** seven common errors (De Morgan without the flip, affirming the consequent, XOR vs OR, precedence and more), each disproved by its own truth table.
- **Cheat codes:** a searchable reference covering every gate, every law, valid and invalid argument forms, and a notation Rosetta Stone.

Progress is saved in `localStorage`. Nothing is locked.

## The logic engine (`src/lib/logic`)

A standalone, UI-free TypeScript module, unit-tested on its own:

- **Parser:** symbolic (`¬ ∧ ∨ ⊕ → ↔ ↑ ↓`), code (`! && || != ==`), word (`NOT AND OR XOR IMPLIES IFF NAND NOR`) and electronics (`· + A'`) notation, freely mixed, all parsed into one AST. Precedence follows the token's home notation: `==` binds tighter than `&&`, as in JavaScript. Errors report the position of the problem.
- **Truth tables:** every row in binary order, intermediate columns for working by hand, and classification as tautology, contradiction or contingency.
- **Notation printers:** precedence-aware output for each notation. Operators a notation lacks are rewritten, so `→` in code becomes `!a || b`.
- **Circuits:** expression → gate graph with NAND/NOR/XNOR fusion and a rail-style layout, rendered as SVG.
- **Simplifier:** applies named laws one at a time (identity, domination, idempotent, complement, double negation, De Morgan, absorption, redundancy, distributive, and the implication/XOR identities). It falls back to a Quine–McCluskey minimal sum of products, labelled as such, when the laws stop short.
- **Validity checker:** builds the combined truth table for an argument, marks the rows where every premise is true, and finds counterexamples.

There are 449 tests. They prove every law in the catalogue by truth table, check that every simplification step preserves the table, round-trip every notation, and check every lesson's answer key against the engine.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Motion (Framer Motion) · Zustand · Vitest. There is no backend: everything runs client-side.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # engine + content tests
npm run build      # production build
```

## Deploy

Import the repository into Vercel. No environment variables are needed.
