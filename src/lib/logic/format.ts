import { ASSOCIATIVE, bin, not, or, type BinaryOp, type Expr } from "./ast";

/**
 * Text notations an expression can be printed in. The same AST prints as:
 *   symbolic     ¬P ∨ (P ∧ Q)         Discrete Maths
 *   electronics  A' + (A · B)         Digital Electronics (Boolean algebra)
 *   code         !a || (a && b)       Programming
 *   word         NOT P OR (P AND Q)   Plain-English / Critical Thinking
 */
export type TextNotation = "symbolic" | "electronics" | "code" | "word";

interface InfixSpec {
  readonly symbol: string;
  /** Higher binds tighter, *within this notation*. */
  readonly prec: number;
}

interface NotationSpec {
  readonly infix: Partial<Record<BinaryOp, InfixSpec>>;
  /**
   * Some notations have no symbol for an operator (code has no `implies`,
   * electronics has no NAND symbol). Those nodes are rewritten into
   * equivalent ones the notation *can* show before printing.
   */
  readonly desugar: Partial<Record<BinaryOp, (l: Expr, r: Expr) => Expr>>;
  readonly not: { readonly style: "prefix" | "postfix"; readonly symbol: string };
  readonly constants: readonly [trueText: string, falseText: string];
}

const LOGIC_PREC = { iff: 1, implies: 2, or: 3, xor: 4, and: 5 } as const;

const SPECS: Readonly<Record<TextNotation, NotationSpec>> = {
  symbolic: {
    infix: {
      iff: { symbol: "↔", prec: LOGIC_PREC.iff },
      implies: { symbol: "→", prec: LOGIC_PREC.implies },
      or: { symbol: "∨", prec: LOGIC_PREC.or },
      nor: { symbol: "↓", prec: LOGIC_PREC.or },
      xor: { symbol: "⊕", prec: LOGIC_PREC.xor },
      xnor: { symbol: "⊙", prec: LOGIC_PREC.xor },
      and: { symbol: "∧", prec: LOGIC_PREC.and },
      nand: { symbol: "↑", prec: LOGIC_PREC.and },
    },
    desugar: {},
    not: { style: "prefix", symbol: "¬" },
    constants: ["T", "F"],
  },
  word: {
    infix: {
      iff: { symbol: "IFF", prec: LOGIC_PREC.iff },
      implies: { symbol: "IMPLIES", prec: LOGIC_PREC.implies },
      or: { symbol: "OR", prec: LOGIC_PREC.or },
      nor: { symbol: "NOR", prec: LOGIC_PREC.or },
      xor: { symbol: "XOR", prec: LOGIC_PREC.xor },
      xnor: { symbol: "XNOR", prec: LOGIC_PREC.xor },
      and: { symbol: "AND", prec: LOGIC_PREC.and },
      nand: { symbol: "NAND", prec: LOGIC_PREC.and },
    },
    desugar: {},
    not: { style: "prefix", symbol: "NOT " },
    constants: ["TRUE", "FALSE"],
  },
  electronics: {
    infix: {
      or: { symbol: "+", prec: LOGIC_PREC.or },
      xor: { symbol: "⊕", prec: LOGIC_PREC.xor },
      xnor: { symbol: "⊙", prec: LOGIC_PREC.xor },
      and: { symbol: "·", prec: LOGIC_PREC.and },
    },
    desugar: {
      // Boolean algebra writes NAND/NOR as a complemented AND/OR: (A·B)'
      nand: (l, r) => not(bin("and", l, r)),
      nor: (l, r) => not(bin("or", l, r)),
      implies: (l, r) => or(not(l), r),
      iff: (l, r) => bin("xnor", l, r),
    },
    not: { style: "postfix", symbol: "'" },
    constants: ["1", "0"],
  },
  code: {
    // JavaScript/C precedence: === and !== bind tighter than &&, which binds
    // tighter than ||. Getting this right matters: printing `(a === b) && c`
    // as `a === (b && c)` would be a different program.
    infix: {
      or: { symbol: "||", prec: 3 },
      and: { symbol: "&&", prec: 5 },
      xor: { symbol: "!==", prec: 6 },
      iff: { symbol: "===", prec: 6 },
    },
    desugar: {
      nand: (l, r) => not(bin("and", l, r)),
      nor: (l, r) => not(bin("or", l, r)),
      xnor: (l, r) => bin("iff", l, r),
      // Code has no implication operator; `!p || q` is how it's written.
      implies: (l, r) => or(not(l), r),
    },
    not: { style: "prefix", symbol: "!" },
    constants: ["true", "false"],
  },
};

export interface FormatOptions {
  /**
   * When true (the default) mixed operators always get brackets:
   * `(A ∧ B) ∨ C` instead of the technically-equal `A ∧ B ∨ C`. Students
   * misread precedence constantly, so we only lean on it when asked.
   */
  readonly clarity?: boolean;
}

const ATOM = 100;
const NOT_PREC = 50;

interface Rendered {
  readonly text: string;
  readonly prec: number;
  readonly op?: BinaryOp;
}

export function format(expr: Expr, notation: TextNotation = "symbolic", options: FormatOptions = {}): string {
  const spec = SPECS[notation];
  const clarity = options.clarity ?? true;

  const render = (e: Expr): Rendered => {
    switch (e.kind) {
      case "var":
        return { text: e.name, prec: ATOM };
      case "const":
        return { text: e.value ? spec.constants[0] : spec.constants[1], prec: ATOM };
      case "not": {
        const inner = render(e.operand);
        if (spec.not.style === "postfix") {
          // A' and (A·B)': the prime applies to whatever is immediately before it.
          const base = inner.prec === ATOM ? inner.text : `(${inner.text})`;
          return { text: `${base}${spec.not.symbol}`, prec: ATOM };
        }
        const base = inner.prec >= NOT_PREC ? inner.text : `(${inner.text})`;
        return { text: `${spec.not.symbol}${base}`, prec: NOT_PREC };
      }
      case "binary": {
        const sugar = spec.desugar[e.op];
        if (sugar) return render(sugar(e.left, e.right));
        const infix = spec.infix[e.op];
        if (!infix) throw new Error(`Notation "${notation}" cannot print operator "${e.op}"`);

        const wrap = (child: Rendered): string => {
          if (child.op === undefined) return child.text; // atom or NOT
          if (child.prec < infix.prec) return `(${child.text})`;
          if (child.prec > infix.prec) return clarity ? `(${child.text})` : child.text;
          // Same level: only drop brackets for a chain of one associative
          // operator (A ∧ B ∧ C). Everything else, including → chains, keeps
          // them so nobody has to remember associativity rules.
          return child.op === e.op && ASSOCIATIVE.has(e.op) ? child.text : `(${child.text})`;
        };

        const left = wrap(render(e.left));
        const right = wrap(render(e.right));
        return { text: `${left} ${infix.symbol} ${right}`, prec: infix.prec, op: e.op };
      }
    }
  };

  return render(expr).text;
}

/** The expression as an `if` condition in JavaScript/TypeScript/C-family code. */
export function toIfStatement(expr: Expr): string {
  return `if (${format(expr, "code")}) {\n  // runs only when the condition is true\n}`;
}
