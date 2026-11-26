import { not as notExpr, variablesOf, type Expr } from "./ast";
import { evaluate, type Assignment } from "./evaluate";

/**
 * Turns an expression into a logic-gate circuit with a layout, ready to draw
 * as SVG. The geometry lives here rather than in a React component so it can
 * be unit-tested and so every renderer agrees on where the wires go.
 *
 * Layout style: each input variable gets a vertical "rail" on the left (the
 * way circuits are drawn on a breadboard or in a textbook). A dot on a rail
 * marks a tap where a wire leaves to feed a gate. That handles a variable used
 * several times (fan-out) without tangling.
 */

export type GateType = "AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR" | "XNOR";

export const GATE_TYPES: readonly GateType[] = ["AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR"];

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface GateNode {
  readonly id: string;
  readonly gate: GateType;
  /** The sub-expression this gate's output computes. */
  readonly expr: Expr;
  /** Ids of the nodes feeding each input pin, top pin first. */
  readonly inputs: readonly string[];
  /** Left edge x and vertical centre y. */
  readonly x: number;
  readonly y: number;
  readonly column: number;
}

export interface Rail {
  readonly id: string;
  readonly name: string;
  readonly x: number;
  readonly top: number;
  readonly bottom: number;
}

export interface ConstSource {
  readonly id: string;
  readonly value: boolean;
  readonly x: number;
  readonly y: number;
}

export interface Wire {
  readonly id: string;
  /** Node whose value this wire carries (a rail, constant or gate id). */
  readonly from: string;
  /** Gate this wire feeds, or undefined for the final output wire. */
  readonly to?: string;
  readonly points: readonly Point[];
  /** Where it leaves a rail; drawn as a junction dot. */
  readonly tap?: Point;
}

export interface Circuit {
  readonly expr: Expr;
  readonly rails: readonly Rail[];
  readonly constants: readonly ConstSource[];
  readonly gates: readonly GateNode[];
  readonly wires: readonly Wire[];
  /** Id of the node driving the final output. */
  readonly output: string;
  readonly outputPoint: Point;
  readonly width: number;
  readonly height: number;
  /** Explanations of any translation (e.g. "→ has no gate; built as ¬P ∨ Q"). */
  readonly notes: readonly string[];
}

export const GATE_WIDTH = 48;
export const GATE_HEIGHT = 34;
/** Vertical offset of each input pin of a two-input gate from its centre. */
export const PIN_OFFSET = 9;

const RAIL_GAP = 22;
/** Approximate advance width of one character of an 11px monospace rail label. */
export const LABEL_CHAR_WIDTH = 6.8;
const RAIL_LEFT = 14;
const TOP = 30;
const SLOT = 40;
const COLUMN = 92;
const OUTPUT_TAIL = 44;

/** The largest expression we'll attempt to draw; beyond this it's spaghetti. */
export const MAX_GATES = 20;

// ---------------------------------------------------------------------------
// Step 1: expression → gate tree (no geometry yet)
// ---------------------------------------------------------------------------

type Tree =
  | { kind: "var"; name: string }
  | { kind: "const"; value: boolean }
  | { kind: "gate"; gate: GateType; expr: Expr; children: Tree[] };

function toTree(e: Expr, notes: Set<string>): Tree {
  switch (e.kind) {
    case "var":
      return { kind: "var", name: e.name };
    case "const":
      return { kind: "const", value: e.value };
    case "not": {
      // A NOT straight after AND/OR/XOR is a single gate with a bubble:
      // ¬(A ∧ B) is drawn as one NAND, which is how real circuits are built.
      const inner = e.operand;
      if (inner.kind === "binary" && (inner.op === "and" || inner.op === "or" || inner.op === "xor")) {
        const fused: GateType = inner.op === "and" ? "NAND" : inner.op === "or" ? "NOR" : "XNOR";
        return {
          kind: "gate",
          gate: fused,
          expr: e,
          children: [toTree(inner.left, notes), toTree(inner.right, notes)],
        };
      }
      return { kind: "gate", gate: "NOT", expr: e, children: [toTree(inner, notes)] };
    }
    case "binary": {
      const { op, left, right } = e;
      if (op === "implies") {
        // There is no "implication gate" in standard logic families, so
        // P → Q is built from its equivalent ¬P ∨ Q.
        notes.add("→ has no gate of its own, so P → Q is built as ¬P ∨ Q (same truth table).");
        return {
          kind: "gate",
          gate: "OR",
          expr: e,
          children: [toTree(notExpr(left), notes), toTree(right, notes)],
        };
      }
      const gate: GateType =
        op === "and" ? "AND"
        : op === "or" ? "OR"
        : op === "xor" ? "XOR"
        : op === "nand" ? "NAND"
        : op === "nor" ? "NOR"
        : "XNOR"; // xnor and iff: same truth function, drawn as XNOR
      if (op === "iff") notes.add("↔ is drawn as an XNOR gate: both are true exactly when the inputs match.");
      return { kind: "gate", gate, expr: e, children: [toTree(left, notes), toTree(right, notes)] };
    }
  }
}

function countGates(t: Tree): number {
  return t.kind === "gate" ? 1 + t.children.reduce((n, ch) => n + countGates(ch), 0) : 0;
}

/** How many gates drawing this expression needs (after NAND/NOR fusion). */
export function gateCount(expr: Expr): number {
  return countGates(toTree(expr, new Set()));
}

/**
 * If the whole expression is a single gate over two distinct variables
 * (or NOT over one), name it. Used by "which gate matches this table?".
 */
export function singleGate(expr: Expr): GateType | null {
  const tree = toTree(expr, new Set());
  if (tree.kind !== "gate") return null;
  return tree.children.every((ch) => ch.kind === "var") ? tree.gate : null;
}

// ---------------------------------------------------------------------------
// Step 2: layout
// ---------------------------------------------------------------------------

export function buildCircuit(expr: Expr): Circuit {
  const notes = new Set<string>();
  const tree = toTree(expr, notes);
  const variables = variablesOf(expr);

  // Rail labels sit centred above each rail, so long names (isAdmin, hasToken)
  // need wider spacing or neighbouring labels print on top of each other.
  const labelWidth = Math.max(0, ...variables.map((n) => n.length)) * LABEL_CHAR_WIDTH;
  const railGap = Math.max(RAIL_GAP, Math.ceil(labelWidth) + 8);
  const railLeft = Math.max(RAIL_LEFT, Math.ceil(labelWidth / 2) + 2);
  const railX = (name: string) => railLeft + variables.indexOf(name) * railGap;
  const railsRight = variables.length > 0 ? railX(variables[variables.length - 1]) : railLeft;
  const firstColumnX = railsRight + 46;
  const columnX = (col: number) => firstColumnX + (col - 1) * COLUMN;

  const gates: GateNode[] = [];
  const wires: Wire[] = [];
  const constants: ConstSource[] = [];
  const railExtent = new Map<string, number>(); // lowest tap y per rail
  let slot = 0;
  let idCounter = 0;

  /** Column = longest path from the inputs, so every gate sits right of its inputs. */
  const depth = (t: Tree): number =>
    t.kind === "gate" ? 1 + Math.max(...t.children.map(depth)) : 0;

  interface Placed {
    id: string;
    /** Where this node's output signal starts. */
    out: Point;
    /** For leaves: the row they were given. */
    leaf?: { kind: "var"; name: string } | { kind: "const"; value: boolean };
  }

  // Leaves get consecutive rows in reading order; each gate is centred on its
  // inputs. That keeps the diagram's shape matching the expression's shape.
  const place = (t: Tree): Placed => {
    if (t.kind === "var") {
      const y = TOP + slot++ * SLOT;
      railExtent.set(t.name, Math.max(railExtent.get(t.name) ?? 0, y));
      return { id: `rail-${t.name}`, out: { x: railX(t.name), y }, leaf: t };
    }
    if (t.kind === "const") {
      const y = TOP + slot++ * SLOT;
      const id = `const-${idCounter++}`;
      const x = railsRight + 18;
      constants.push({ id, value: t.value, x, y });
      return { id, out: { x: x + 8, y }, leaf: t };
    }

    const children = t.children.map(place);
    const col = depth(t);
    const id = `gate-${idCounter++}`;
    const y = children.reduce((sum, ch) => sum + ch.out.y, 0) / children.length;
    const x = columnX(col);
    gates.push({ id, gate: t.gate, expr: t.expr, inputs: children.map((ch) => ch.id), x, y, column: col });

    children.forEach((child, pin) => {
      const pinY = children.length === 1 ? y : y + (pin === 0 ? -PIN_OFFSET : PIN_OFFSET);
      // Two input wires turn at slightly different x so their vertical runs never overlap.
      const turnX = x - (children.length === 1 ? 14 : pin === 0 ? 20 : 12);
      const from = child.out;
      const points: Point[] =
        Math.abs(from.y - pinY) < 0.5
          ? [from, { x, y: pinY }]
          : [from, { x: turnX, y: from.y }, { x: turnX, y: pinY }, { x, y: pinY }];
      wires.push({
        id: `w-${id}-${pin}`,
        from: child.id,
        to: id,
        points,
        tap: child.leaf?.kind === "var" ? from : undefined,
      });
    });

    return { id, out: { x: x + GATE_WIDTH, y } };
  };

  const root = place(tree);
  const maxColumn = gates.reduce((m, g) => Math.max(m, g.column), 0);
  const rightEdge = maxColumn > 0 ? columnX(maxColumn) + GATE_WIDTH : railsRight + 40;
  const outputPoint = { x: rightEdge + OUTPUT_TAIL, y: root.out.y };
  wires.push({
    id: "w-output",
    from: root.id,
    points: [root.out, { x: outputPoint.x, y: root.out.y }],
    tap: root.leaf?.kind === "var" ? root.out : undefined,
  });

  const rails: Rail[] = variables.map((name) => ({
    id: `rail-${name}`,
    name,
    x: railX(name),
    top: TOP - 16,
    bottom: (railExtent.get(name) ?? TOP) + 6,
  }));

  return {
    expr,
    rails,
    constants,
    gates,
    wires,
    output: root.id,
    outputPoint,
    width: outputPoint.x + 34,
    height: TOP + Math.max(slot, 1) * SLOT - SLOT / 2 + 14,
    notes: [...notes],
  };
}

/**
 * The value on every node of the circuit for one row of the truth table.
 * Keyed by node id (rail, constant or gate), which is also each wire's `from`.
 */
export function circuitValues(circuit: Circuit, assignment: Assignment): Map<string, boolean> {
  const values = new Map<string, boolean>();
  circuit.rails.forEach((r) => values.set(r.id, assignment[r.name] ?? false));
  circuit.constants.forEach((k) => values.set(k.id, k.value));
  circuit.gates.forEach((g) => values.set(g.id, evaluate(g.expr, assignment)));
  return values;
}
