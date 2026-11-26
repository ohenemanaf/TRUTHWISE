import { bin, c, not, v, type BinaryOp, type Expr } from "./ast";

/**
 * Parser for boolean expressions written in any of the notations students meet:
 *
 * | Meaning | Symbolic   | Code          | Words     | Electronics |
 * |---------|------------|---------------|-----------|-------------|
 * | not     | ¬ ~        | !             | NOT       | A' (postfix)|
 * | and     | ∧          | && &          | AND       | · *         |
 * | or      | ∨          | \|\| \|       | OR        | +           |
 * | xor     | ⊕          | != !== ^      | XOR       | ⊕           |
 * | nand    | ↑          |               | NAND      |             |
 * | nor     | ↓          |               | NOR       |             |
 * | xnor    | ⊙          |               | XNOR      | ⊙           |
 * | implies | → ⇒        | -> =>         | IMPLIES   |             |
 * | iff     | ↔ ⇔ ≡      | == === <-> <=>| IFF       |             |
 * | true    | T ⊤        | true          | TRUE      | 1           |
 * | false   | F ⊥        | false         | FALSE     | 0           |
 *
 * Notations can be mixed freely (`!A AND (B ∨ C)` is fine).
 *
 * Precedence, tightest first:
 *   postfix '  >  prefix NOT  >  == != (code equality)  >  AND NAND
 *   >  XOR XNOR  >  OR NOR  >  →  >  ↔
 *
 * Two deliberate choices worth calling out:
 *  - `==` / `!=` bind tighter than `&&`, exactly as they do in JavaScript/C,
 *    so `a == b && c` means `(a == b) && c`. The word/symbol forms of ↔ keep
 *    the discrete-maths convention of binding loosest. Precedence follows the
 *    *token* the student typed, so each notation reads the way its home
 *    course teaches it.
 *  - `T` and `F` (capital, standing alone) are the constants true/false,
 *    because that is how discrete maths writes them. Every other identifier
 *    (A, p, x1, isAdmin) is a variable. There is no implicit AND by
 *    juxtaposition: `AB` is one variable named "AB", not A·B.
 *
 * `→` is right-associative (`P → Q → R` = `P → (Q → R)`); every other binary
 * operator is left-associative.
 */

export interface ParseError {
  readonly message: string;
  /** Character offset in the input where the problem was detected. */
  readonly position: number;
}

export type ParseResult =
  | { readonly ok: true; readonly expr: Expr }
  | { readonly ok: false; readonly error: ParseError };

type Token =
  | { type: "var"; name: string; pos: number }
  | { type: "const"; value: boolean; pos: number }
  | { type: "not"; pos: number; text: string }
  | { type: "prime"; pos: number }
  | { type: "op"; op: BinaryOp; prec: number; rightAssoc: boolean; pos: number; text: string }
  | { type: "lparen"; pos: number; close: string }
  | { type: "rparen"; pos: number; text: string }
  | { type: "eof"; pos: number };

interface OpInfo {
  op: BinaryOp;
  prec: number;
  rightAssoc?: boolean;
}

/** Precedence levels: higher binds tighter. */
const PREC = {
  iff: 1,
  implies: 2,
  or: 3,
  xor: 4,
  and: 5,
  codeEquality: 6,
} as const;

/** Symbol operators. Order matters: longer symbols must be tried first. */
const SYMBOL_OPS: ReadonlyArray<readonly [string, OpInfo]> = [
  ["<->", { op: "iff", prec: PREC.iff }],
  ["<=>", { op: "iff", prec: PREC.iff }],
  ["===", { op: "iff", prec: PREC.codeEquality }],
  ["!==", { op: "xor", prec: PREC.codeEquality }],
  ["==", { op: "iff", prec: PREC.codeEquality }],
  ["!=", { op: "xor", prec: PREC.codeEquality }],
  ["->", { op: "implies", prec: PREC.implies, rightAssoc: true }],
  ["=>", { op: "implies", prec: PREC.implies, rightAssoc: true }],
  ["&&", { op: "and", prec: PREC.and }],
  ["||", { op: "or", prec: PREC.or }],
  ["∧", { op: "and", prec: PREC.and }],
  ["&", { op: "and", prec: PREC.and }],
  ["·", { op: "and", prec: PREC.and }],
  ["⋅", { op: "and", prec: PREC.and }],
  ["*", { op: "and", prec: PREC.and }],
  ["∨", { op: "or", prec: PREC.or }],
  ["|", { op: "or", prec: PREC.or }],
  ["+", { op: "or", prec: PREC.or }],
  ["⊕", { op: "xor", prec: PREC.xor }],
  ["^", { op: "xor", prec: PREC.xor }],
  ["⊙", { op: "xnor", prec: PREC.xor }],
  ["↑", { op: "nand", prec: PREC.and }],
  ["↓", { op: "nor", prec: PREC.or }],
  ["→", { op: "implies", prec: PREC.implies, rightAssoc: true }],
  ["⇒", { op: "implies", prec: PREC.implies, rightAssoc: true }],
  ["⊃", { op: "implies", prec: PREC.implies, rightAssoc: true }],
  ["↔", { op: "iff", prec: PREC.iff }],
  ["⇔", { op: "iff", prec: PREC.iff }],
  ["≡", { op: "iff", prec: PREC.iff }],
];

const WORD_OPS: Readonly<Record<string, OpInfo>> = {
  and: { op: "and", prec: PREC.and },
  or: { op: "or", prec: PREC.or },
  xor: { op: "xor", prec: PREC.xor },
  nand: { op: "nand", prec: PREC.and },
  nor: { op: "nor", prec: PREC.or },
  xnor: { op: "xnor", prec: PREC.xor },
  implies: { op: "implies", prec: PREC.implies, rightAssoc: true },
  iff: { op: "iff", prec: PREC.iff },
};

const NOT_SYMBOLS = ["¬", "~", "∼", "!"];
const OPEN: Readonly<Record<string, string>> = { "(": ")", "[": "]" };
const CLOSE = new Set([")", "]"]);

class LexError extends Error {
  constructor(
    message: string,
    readonly position: number,
  ) {
    super(message);
  }
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  outer: while (i < input.length) {
    const ch = input[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Multi-character and symbolic binary operators. `!=` must win over `!`.
    for (const [sym, info] of SYMBOL_OPS) {
      if (input.startsWith(sym, i)) {
        tokens.push({
          type: "op",
          op: info.op,
          prec: info.prec,
          rightAssoc: info.rightAssoc ?? false,
          pos: i,
          text: sym,
        });
        i += sym.length;
        continue outer;
      }
    }

    if (NOT_SYMBOLS.includes(ch)) {
      tokens.push({ type: "not", pos: i, text: ch });
      i++;
      continue;
    }
    if (ch === "'" || ch === "’" || ch === "′") {
      tokens.push({ type: "prime", pos: i });
      i++;
      continue;
    }
    if (ch in OPEN) {
      tokens.push({ type: "lparen", pos: i, close: OPEN[ch] });
      i++;
      continue;
    }
    if (CLOSE.has(ch)) {
      tokens.push({ type: "rparen", pos: i, text: ch });
      i++;
      continue;
    }
    if (ch === "⊤" || ch === "⊥") {
      tokens.push({ type: "const", value: ch === "⊤", pos: i });
      i++;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      const match = /^[0-9]+/.exec(input.slice(i))![0];
      if (match !== "0" && match !== "1") {
        throw new LexError(`Only 0 and 1 are valid numbers, found "${match}"`, i);
      }
      tokens.push({ type: "const", value: match === "1", pos: i });
      i += match.length;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      const word = /^[A-Za-z_][A-Za-z0-9_]*/.exec(input.slice(i))![0];
      const lower = word.toLowerCase();
      if (lower in WORD_OPS) {
        const info = WORD_OPS[lower];
        tokens.push({
          type: "op",
          op: info.op,
          prec: info.prec,
          rightAssoc: info.rightAssoc ?? false,
          pos: i,
          text: word,
        });
      } else if (lower === "not") {
        tokens.push({ type: "not", pos: i, text: word });
      } else if (lower === "true" || word === "T") {
        tokens.push({ type: "const", value: true, pos: i });
      } else if (lower === "false" || word === "F") {
        tokens.push({ type: "const", value: false, pos: i });
      } else {
        tokens.push({ type: "var", name: word, pos: i });
      }
      i += word.length;
      continue;
    }

    if (ch === "=") {
      throw new LexError(`A single "=" is assignment, not comparison. Use "==" or "↔"`, i);
    }
    throw new LexError(`Unknown symbol "${ch}"`, i);
  }

  tokens.push({ type: "eof", pos: input.length });
  return tokens;
}

class ParseFailure extends Error {
  constructor(
    message: string,
    readonly position: number,
  ) {
    super(message);
  }
}

/** Recursive-descent parser using precedence climbing for binary operators. */
class Parser {
  private index = 0;
  constructor(private readonly tokens: Token[]) {}

  parse(): Expr {
    const expr = this.parseBinary(1);
    const next = this.peek();
    if (next.type === "rparen") {
      throw new ParseFailure(`Unexpected "${next.text}" with no matching opening bracket`, next.pos);
    }
    if (next.type !== "eof") {
      throw new ParseFailure(
        "Two terms are next to each other with no operator between them (add AND, OR, …)",
        next.pos,
      );
    }
    return expr;
  }

  private peek(): Token {
    return this.tokens[this.index];
  }

  private advance(): Token {
    return this.tokens[this.index++];
  }

  private parseBinary(minPrec: number): Expr {
    let left = this.parseUnary();
    for (;;) {
      const tok = this.peek();
      if (tok.type !== "op" || tok.prec < minPrec) return left;
      this.advance();
      // Left-assoc ops require the right side to bind strictly tighter;
      // right-assoc ops (→) allow the same level to recurse to the right.
      const nextMin = tok.rightAssoc ? tok.prec : tok.prec + 1;
      const right = this.parseBinary(nextMin);
      left = bin(tok.op, left, right);
    }
  }

  private parseUnary(): Expr {
    const tok = this.peek();
    if (tok.type === "not") {
      this.advance();
      return not(this.parseUnary());
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Expr {
    let expr = this.parsePrimary();
    while (this.peek().type === "prime") {
      this.advance();
      expr = not(expr);
    }
    return expr;
  }

  private parsePrimary(): Expr {
    const tok = this.advance();
    switch (tok.type) {
      case "var":
        return v(tok.name);
      case "const":
        return c(tok.value);
      case "lparen": {
        if (this.peek().type === "rparen") {
          throw new ParseFailure("Empty brackets: put an expression inside", this.peek().pos);
        }
        const inner = this.parseBinary(1);
        const close = this.advance();
        if (close.type !== "rparen") {
          throw new ParseFailure(`Missing closing "${tok.close}"`, close.pos);
        }
        return inner;
      }
      case "eof":
        throw new ParseFailure("Expression ends too early: expected a variable or value", tok.pos);
      case "op":
        throw new ParseFailure(`"${tok.text}" needs something on its left`, tok.pos);
      case "rparen":
        throw new ParseFailure(`Unexpected "${tok.text}"`, tok.pos);
      case "prime":
        throw new ParseFailure(`"'" (NOT) must follow a variable or bracket`, tok.pos);
      case "not":
        // Unreachable: parseUnary consumes NOT tokens before we get here.
        throw new ParseFailure("Unexpected NOT", tok.pos);
    }
  }
}

/** Parse an expression in any supported notation. Never throws. */
export function parse(input: string): ParseResult {
  if (input.trim() === "") {
    return { ok: false, error: { message: "Type an expression, e.g. A AND B", position: 0 } };
  }
  try {
    const expr = new Parser(tokenize(input)).parse();
    return { ok: true, expr };
  } catch (err) {
    if (err instanceof LexError || err instanceof ParseFailure) {
      return { ok: false, error: { message: err.message, position: err.position } };
    }
    throw err;
  }
}

/** Parse or throw. Handy for content files and tests where input is trusted. */
export function parseOrThrow(input: string): Expr {
  const result = parse(input);
  if (!result.ok) {
    throw new Error(`Cannot parse "${input}": ${result.error.message} (at ${result.error.position})`);
  }
  return result.expr;
}
