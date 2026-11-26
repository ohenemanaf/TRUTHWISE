import {
  FALSE,
  TRUE,
  and,
  bin,
  c,
  canonicalKey,
  chain,
  flatten,
  not,
  or,
  size,
  xor,
  iff,
  type BinaryOp,
  type Expr,
} from "./ast";
import { applyOp } from "./evaluate";
import type { LawId } from "./laws";
import { minimalSumOfProducts } from "./minimize";

/**
 * Step-by-step simplification using the named laws of boolean algebra.
 *
 * Each step applies one law to one sub-expression and records it, so the UI can
 * show a worked derivation like a textbook:
 *
 *   ¬(¬A ∧ ¬B)
 *   = ¬¬A ∨ ¬¬B     De Morgan
 *   = A ∨ ¬¬B       Double negation
 *   = A ∨ B         Double negation
 *
 * Strategy:
 *  1. Repeatedly apply the first law that fits, scanning the tree top-down.
 *     Every law here either shrinks the expression or pushes a negation inward
 *     without growing it, so the loop always terminates.
 *  2. When nothing fits, try expanding one derived operator (→, ↔, ⊕, ↑, ↓)
 *     into its definition, but keep the expansion only if simplifying the
 *     result ends up strictly smaller. That's how (P → Q) ∧ P becomes P ∧ Q.
 *  3. Compare with the true minimum sum-of-products from the truth table. If
 *     the laws got stuck above the minimum, add one final, clearly labelled
 *     step rather than pretend the laws found it.
 */

export interface SimplifyStep {
  readonly law: LawId;
  /** Whole expression before and after this step. */
  readonly before: Expr;
  readonly after: Expr;
  /** The sub-expression that was rewritten, and what replaced it. */
  readonly focus: Expr;
  readonly replacement: Expr;
}

export interface Simplification {
  readonly input: Expr;
  readonly result: Expr;
  readonly steps: readonly SimplifyStep[];
  /** True if the result is no larger than the minimal sum-of-products. */
  readonly isMinimal: boolean;
}

interface Rewrite {
  readonly law: LawId;
  readonly out: Expr;
}

type Rule = (e: Expr) => Rewrite | null;

const MAX_STEPS = 120;

const isConst = (e: Expr, value?: boolean): e is { kind: "const"; value: boolean } =>
  e.kind === "const" && (value === undefined || e.value === value);

/** Key of ¬x, collapsing double negation: complementKey(¬A) = key(A). */
const complementKey = (e: Expr): string =>
  e.kind === "not" ? canonicalKey(e.operand) : canonicalKey(not(e));

/** The "other" operator for a chain: AND ↔ OR, used by dual laws. */
const dual = (op: "and" | "or"): "and" | "or" => (op === "and" ? "or" : "and");

// ---------------------------------------------------------------------------
// Rules. Each inspects a single node and returns a rewrite, or null.
// Chain rules flatten AND/OR chains so `A ∧ B ∧ ¬A` is caught however it is
// bracketed.
// ---------------------------------------------------------------------------

const negationOfConstants: Rule = (e) =>
  e.kind === "not" && isConst(e.operand) ? { law: "negation-of-constants", out: c(!e.operand.value) } : null;

const doubleNegation: Rule = (e) =>
  e.kind === "not" && e.operand.kind === "not" ? { law: "double-negation", out: e.operand.operand } : null;

const evaluateConstants: Rule = (e) =>
  e.kind === "binary" && isConst(e.left) && isConst(e.right)
    ? { law: "evaluate", out: c(applyOp(e.op, e.left.value, e.right.value)) }
    : null;

/** Identity (A ∧ T = A) and domination (A ∧ F = F) over a whole chain. */
const chainConstants: Rule = (e) => {
  if (e.kind !== "binary" || (e.op !== "and" && e.op !== "or")) return null;
  const items = flatten(e.op, e);
  // For AND, F dominates and T is the identity; for OR it's the reverse.
  const dominator = e.op === "or";
  if (items.some((x) => isConst(x, dominator))) return { law: "domination", out: c(dominator) };
  const kept = items.filter((x) => !isConst(x, !dominator));
  if (kept.length < items.length) {
    return { law: "identity", out: kept.length ? chain(e.op, kept) : c(!dominator) };
  }
  return null;
};

/** Constant on one side of →, ↔, ⊕, ↑, ↓, ⊙. */
const operatorConstants: Rule = (e) => {
  if (e.kind !== "binary") return null;
  const { op, left: l, right: r } = e;
  const law: LawId = "conditional-identities";
  const constSide = isConst(l) ? l : isConst(r) ? r : null;
  if (!constSide) return null;
  const other = constSide === l ? r : l;
  const k = constSide.value;
  switch (op) {
    case "implies":
      if (isConst(l)) return { law, out: l.value ? r : TRUE }; // T→A = A, F→A = T
      return { law, out: k ? TRUE : not(l) }; // A→T = T, A→F = ¬A
    case "xor":
      return { law, out: k ? not(other) : other };
    case "xnor":
    case "iff":
      return { law, out: k ? other : not(other) };
    case "nand":
      return { law: "nand-nor", out: k ? not(other) : TRUE };
    case "nor":
      return { law: "nand-nor", out: k ? FALSE : not(other) };
    default:
      return null; // and/or handled by chainConstants
  }
};

/** Same operand on both sides of a non-chain operator: A ⊕ A, A → A, A ↑ A … */
const sameOperands: Rule = (e) => {
  if (e.kind !== "binary" || e.op === "and" || e.op === "or") return null;
  const lk = canonicalKey(e.left);
  const rk = canonicalKey(e.right);
  if (lk === rk) {
    const out: Record<Exclude<BinaryOp, "and" | "or">, Expr> = {
      xor: FALSE,
      xnor: TRUE,
      iff: TRUE,
      implies: TRUE,
      nand: not(e.left),
      nor: not(e.left),
    };
    return { law: e.op === "nand" || e.op === "nor" ? "nand-nor" : "conditional-identities", out: out[e.op] };
  }
  // Complementary operands: A ⊕ ¬A = T, A ↔ ¬A = F, A → ¬A = ¬A, ¬A → A = A
  if (complementKey(e.left) === rk) {
    switch (e.op) {
      case "xor":
        return { law: "conditional-identities", out: TRUE };
      case "xnor":
      case "iff":
        return { law: "conditional-identities", out: FALSE };
      case "implies":
        return { law: "conditional-identities", out: e.right };
      default:
        return null;
    }
  }
  return null;
};

const idempotent: Rule = (e) => {
  if (e.kind !== "binary" || (e.op !== "and" && e.op !== "or")) return null;
  const items = flatten(e.op, e);
  const seen = new Set<string>();
  const kept = items.filter((x) => {
    const k = canonicalKey(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return kept.length < items.length ? { law: "idempotent", out: chain(e.op, kept) } : null;
};

const complement: Rule = (e) => {
  if (e.kind !== "binary" || (e.op !== "and" && e.op !== "or")) return null;
  const keys = new Set(flatten(e.op, e).map(canonicalKey));
  const clash = flatten(e.op, e).some((x) => keys.has(complementKey(x)));
  // A ∧ ¬A = F, A ∨ ¬A = T
  return clash ? { law: "complement", out: c(e.op === "or") } : null;
};

/**
 * Absorption: in A ∨ (A ∧ B), the term (A ∧ B) is redundant because whenever
 * it's true, A is already true. Generalised to chains: drop any term whose
 * parts are a strict superset of another term's parts.
 */
const absorption: Rule = (e) => {
  if (e.kind !== "binary" || (e.op !== "and" && e.op !== "or")) return null;
  const inner = dual(e.op);
  const items = flatten(e.op, e);
  const parts = items.map((x) => new Set(flatten(inner, x).map(canonicalKey)));
  const absorbed = items.findIndex((_, i) =>
    parts.some((small, j) => j !== i && small.size < parts[i].size && [...small].every((k) => parts[i].has(k))),
  );
  if (absorbed < 0) return null;
  return { law: "absorption", out: chain(e.op, items.filter((_, i) => i !== absorbed)) };
};

/** Redundancy: A ∨ (¬A ∧ B) = A ∨ B, and dually A ∧ (¬A ∨ B) = A ∧ B. */
const redundancy: Rule = (e) => {
  if (e.kind !== "binary" || (e.op !== "and" && e.op !== "or")) return null;
  const inner = dual(e.op);
  const items = flatten(e.op, e);
  for (let i = 0; i < items.length; i++) {
    const negKey = complementKey(items[i]);
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const sub = flatten(inner, items[j]);
      if (sub.length < 2) continue;
      const idx = sub.findIndex((x) => canonicalKey(x) === negKey);
      if (idx < 0) continue;
      const trimmed = chain(inner, sub.filter((_, k) => k !== idx));
      return { law: "redundancy", out: chain(e.op, items.map((x, k) => (k === j ? trimmed : x))) };
    }
  }
  return null;
};

/**
 * Distributive law used right-to-left (factoring), which is the direction
 * that simplifies: (A ∧ B) ∨ (A ∧ C) = A ∧ (B ∨ C).
 */
const factor: Rule = (e) => {
  if (e.kind !== "binary" || (e.op !== "and" && e.op !== "or")) return null;
  const inner = dual(e.op);
  const items = flatten(e.op, e);
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = flatten(inner, items[i]);
      const b = flatten(inner, items[j]);
      if (a.length < 2 || b.length < 2) continue;
      const bKeys = new Set(b.map(canonicalKey));
      const common = a.filter((x) => bKeys.has(canonicalKey(x)));
      if (common.length === 0) continue;
      const commonKeys = new Set(common.map(canonicalKey));
      const restA = a.filter((x) => !commonKeys.has(canonicalKey(x)));
      const restB = b.filter((x) => !commonKeys.has(canonicalKey(x)));
      if (restA.length === 0 || restB.length === 0) continue; // absorption's job
      const factored = bin(inner, chain(inner, common), bin(e.op, chain(inner, restA), chain(inner, restB)));
      const others = items.filter((_, k) => k !== i && k !== j);
      return { law: "distributive", out: others.length ? chain(e.op, [factored, ...others]) : factored };
    }
  }
  return null;
};

/** Drop a NOT by one level, cancelling double negation: neg(¬A) = A, neg(A) = ¬A. */
const neg = (e: Expr): Expr => (e.kind === "not" ? e.operand : not(e));

/**
 * De Morgan. Applied only when pushing the NOT inward doesn't grow the
 * expression once double negations cancel, e.g. ¬(¬A ∧ B) → A ∨ ¬B.
 * ¬(A ∧ B) is left alone: it is already as small as it gets.
 */
const deMorgan: Rule = (e) => {
  if (e.kind !== "not" || e.operand.kind !== "binary") return null;
  const { op, left, right } = e.operand;
  if (op !== "and" && op !== "or") return null;
  const flipped = dual(op);
  const cleaned = bin(flipped, neg(left), neg(right));
  if (size(cleaned) >= size(e)) return null;
  // Show the law exactly as stated (¬A ∨ ¬B); the double negations cancel in the next steps.
  return { law: "de-morgan", out: bin(flipped, not(left), not(right)) };
};

/** NOT over a derived operator: ¬(A → B) = A ∧ ¬B, ¬(A ↔ B) = A ⊕ B, ¬(A ↑ B) = A ∧ B … */
const negatedOperators: Rule = (e) => {
  if (e.kind !== "not" || e.operand.kind !== "binary") return null;
  const { op, left: l, right: r } = e.operand;
  switch (op) {
    case "implies":
      return { law: "negated-implication", out: and(l, not(r)) };
    case "iff":
    case "xnor":
      return { law: "exclusive-or", out: xor(l, r) };
    case "xor":
      return { law: "exclusive-or", out: iff(l, r) };
    case "nand":
      return { law: "nand-nor", out: and(l, r) };
    case "nor":
      return { law: "nand-nor", out: or(l, r) };
    default:
      return null;
  }
};

/** Order matters: cheap, obviously-shrinking laws first so derivations read naturally. */
const RULES: readonly Rule[] = [
  negationOfConstants,
  evaluateConstants,
  chainConstants,
  operatorConstants,
  doubleNegation,
  idempotent,
  complement,
  sameOperands,
  absorption,
  redundancy,
  factor,
  deMorgan,
  negatedOperators,
];

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

interface Located {
  readonly law: LawId;
  readonly focus: Expr;
  readonly replacement: Expr;
  readonly whole: Expr;
}

/** Find the first rule that applies anywhere in the tree (pre-order) and apply it. */
function rewriteOnce(e: Expr): Located | null {
  for (const rule of RULES) {
    const hit = rule(e);
    if (hit) return { law: hit.law, focus: e, replacement: hit.out, whole: hit.out };
  }
  if (e.kind === "not") {
    const inner = rewriteOnce(e.operand);
    return inner && { ...inner, whole: not(inner.whole) };
  }
  if (e.kind === "binary") {
    const left = rewriteOnce(e.left);
    if (left) return { ...left, whole: bin(e.op, left.whole, e.right) };
    const right = rewriteOnce(e.right);
    if (right) return { ...right, whole: bin(e.op, e.left, right.whole) };
  }
  return null;
}

function applyLaws(input: Expr, budget: number): SimplifyStep[] {
  const steps: SimplifyStep[] = [];
  let current = input;
  while (steps.length < budget) {
    const hit = rewriteOnce(current);
    if (!hit) break;
    steps.push({ law: hit.law, before: current, after: hit.whole, focus: hit.focus, replacement: hit.replacement });
    current = hit.whole;
  }
  return steps;
}

/** How a derived operator is defined in terms of ∧ ∨ ¬, for the lookahead stage. */
function expandDefinition(e: Expr): Rewrite | null {
  if (e.kind !== "binary") return null;
  const { left: l, right: r } = e;
  switch (e.op) {
    case "implies":
      return { law: "material-implication", out: or(not(l), r) };
    case "iff":
    case "xnor":
      return { law: "biconditional", out: or(and(l, r), and(not(l), not(r))) };
    case "xor":
      return { law: "exclusive-or", out: or(and(l, not(r)), and(not(l), r)) };
    case "nand":
      return { law: "nand-nor", out: not(and(l, r)) };
    case "nor":
      return { law: "nand-nor", out: not(or(l, r)) };
    default:
      return null;
  }
}

/** Every way of expanding exactly one derived-operator node, in pre-order. */
function* expansions(e: Expr): Generator<{ focus: Expr; replacement: Expr; whole: Expr; law: LawId }> {
  const own = expandDefinition(e);
  if (own) yield { focus: e, replacement: own.out, whole: own.out, law: own.law };
  if (e.kind === "not") {
    for (const x of expansions(e.operand)) yield { ...x, whole: not(x.whole) };
  } else if (e.kind === "binary") {
    for (const x of expansions(e.left)) yield { ...x, whole: bin(e.op, x.whole, e.right) };
    for (const x of expansions(e.right)) yield { ...x, whole: bin(e.op, e.left, x.whole) };
  }
}

export function simplify(input: Expr): Simplification {
  const steps: SimplifyStep[] = [...applyLaws(input, MAX_STEPS)];
  let current = steps.length ? steps[steps.length - 1].after : input;

  // Lookahead: keep an expansion only if it pays for itself.
  let improved = true;
  while (improved && steps.length < MAX_STEPS) {
    improved = false;
    for (const x of expansions(current)) {
      const follow = applyLaws(x.whole, MAX_STEPS - steps.length - 1);
      const end = follow.length ? follow[follow.length - 1].after : x.whole;
      if (size(end) < size(current)) {
        steps.push({ law: x.law, before: current, after: x.whole, focus: x.focus, replacement: x.replacement });
        steps.push(...follow);
        current = end;
        improved = true;
        break;
      }
    }
  }

  const minimal = minimalSumOfProducts(input);
  let isMinimal = minimal === null || size(current) <= size(minimal);
  if (minimal && size(minimal) < size(current)) {
    steps.push({ law: "minimal-form", before: current, after: minimal, focus: current, replacement: minimal });
    current = minimal;
    isMinimal = true;
  }

  return { input, result: current, steps, isMinimal };
}
