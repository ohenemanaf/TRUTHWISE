import { FALSE, TRUE, chain, not, v, type Expr } from "./ast";
import { truthTable } from "./truth-table";

/**
 * Quine–McCluskey minimisation: the algorithmic version of a Karnaugh map.
 * Finds the smallest sum-of-products (OR of ANDs) with the same truth table.
 *
 * The step-by-step simplifier uses this as a safety net: if the classroom laws
 * leave something bigger than the true minimum, we can still show the
 * minimum and say honestly where it came from.
 */

/** A product term: bits where `mask` is 1 are "don't care" (the variable is absent). */
interface Implicant {
  readonly value: number;
  readonly mask: number;
  readonly covers: ReadonlySet<number>;
}

const MAX_MINIMIZE_VARIABLES = 6;

function popcount(n: number): number {
  let count = 0;
  for (let x = n; x; x &= x - 1) count++;
  return count;
}

function primeImplicants(minterms: number[]): Implicant[] {
  let current: Implicant[] = minterms.map((m) => ({ value: m, mask: 0, covers: new Set([m]) }));
  const primes: Implicant[] = [];

  while (current.length > 0) {
    const used = new Set<number>();
    const next = new Map<string, Implicant>();
    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        const a = current[i];
        const b = current[j];
        if (a.mask !== b.mask) continue;
        const diff = a.value ^ b.value;
        // Two terms merge when they differ in exactly one (cared-about) bit:
        // A·B·C + A·B·C' = A·B
        if (popcount(diff) !== 1) continue;
        used.add(i);
        used.add(j);
        const merged: Implicant = {
          value: a.value & ~diff,
          mask: a.mask | diff,
          covers: new Set([...a.covers, ...b.covers]),
        };
        next.set(`${merged.value}/${merged.mask}`, merged);
      }
    }
    current.forEach((imp, i) => {
      if (!used.has(i)) primes.push(imp);
    });
    current = [...next.values()];
  }
  return primes;
}

function implicantToExpr(imp: Implicant, variables: readonly string[]): Expr {
  const n = variables.length;
  const literals: Expr[] = [];
  variables.forEach((name, j) => {
    const bit = 1 << (n - 1 - j);
    if (imp.mask & bit) return;
    literals.push(imp.value & bit ? v(name) : not(v(name)));
  });
  return literals.length === 0 ? TRUE : chain("and", literals);
}

function literalCount(imp: Implicant, n: number): number {
  return n - popcount(imp.mask);
}

/** Choose a minimum-cost set of primes covering every minterm. */
function cover(primes: Implicant[], minterms: number[], n: number): Implicant[] {
  const chosen: Implicant[] = [];
  let remaining = new Set(minterms);

  // Essential primes: the only prime covering some minterm must be used.
  for (const m of minterms) {
    const coveringPrimes = primes.filter((p) => p.covers.has(m));
    if (coveringPrimes.length === 1 && !chosen.includes(coveringPrimes[0])) {
      chosen.push(coveringPrimes[0]);
    }
  }
  chosen.forEach((p) => p.covers.forEach((m) => remaining.delete(m)));
  if (remaining.size === 0) return chosen;

  const candidates = primes.filter((p) => !chosen.includes(p) && [...p.covers].some((m) => remaining.has(m)));

  // Exact search when small (cheap for ≤ 6 variables), otherwise greedy.
  if (candidates.length <= 14) {
    let best: Implicant[] | null = null;
    let bestCost = Infinity;
    for (let subset = 1; subset < 1 << candidates.length; subset++) {
      const pick = candidates.filter((_, i) => subset & (1 << i));
      const covered = new Set(pick.flatMap((p) => [...p.covers]));
      if (![...remaining].every((m) => covered.has(m))) continue;
      // Fewer terms first, then fewer literals.
      const cost = pick.length * 100 + pick.reduce((s, p) => s + literalCount(p, n), 0);
      if (cost < bestCost) {
        bestCost = cost;
        best = pick;
      }
    }
    return [...chosen, ...(best ?? [])];
  }

  while (remaining.size > 0) {
    const pick = candidates.reduce((bestP, p) => {
      const gain = [...p.covers].filter((m) => remaining.has(m)).length;
      const bestGain = [...bestP.covers].filter((m) => remaining.has(m)).length;
      return gain > bestGain ? p : bestP;
    });
    chosen.push(pick);
    remaining = new Set([...remaining].filter((m) => !pick.covers.has(m)));
  }
  return chosen;
}

/**
 * Minimal sum-of-products for `expr`, or null if it has too many variables to
 * minimise instantly. Constant functions come back as T / F.
 */
export function minimalSumOfProducts(expr: Expr): Expr | null {
  const table = truthTable(expr);
  const n = table.variables.length;
  if (n > MAX_MINIMIZE_VARIABLES) return null;

  const minterms = table.rows.filter((r) => r.output).map((r) => r.index);
  if (minterms.length === 0) return FALSE;
  if (minterms.length === table.rows.length) return TRUE;

  const terms = cover(primeImplicants(minterms), minterms, n)
    .sort((a, b) => b.value - a.value || a.mask - b.mask)
    .map((imp) => implicantToExpr(imp, table.variables));
  return chain("or", terms);
}
