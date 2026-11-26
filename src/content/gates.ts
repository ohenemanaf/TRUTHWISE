import type { GateType } from "@/lib/logic";

/** Reference data for each gate: the expression it computes and a one-line meaning. */
export interface GateInfo {
  readonly gate: GateType;
  readonly expr: string;
  readonly meaning: string;
}

export const GATES: Readonly<Record<GateType, GateInfo>> = {
  AND: { gate: "AND", expr: "A ∧ B", meaning: "1 only when both inputs are 1." },
  OR: { gate: "OR", expr: "A ∨ B", meaning: "1 when at least one input is 1 (including both)." },
  NOT: { gate: "NOT", expr: "¬A", meaning: "Flips its single input. Also called an inverter." },
  NAND: { gate: "NAND", expr: "A ↑ B", meaning: "NOT-AND: 0 only when both inputs are 1. Universal: it can build every other gate." },
  NOR: { gate: "NOR", expr: "A ↓ B", meaning: "NOT-OR: 1 only when both inputs are 0. Also universal." },
  XOR: { gate: "XOR", expr: "A ⊕ B", meaning: "Exclusive OR: 1 when the inputs differ." },
  XNOR: { gate: "XNOR", expr: "A ⊙ B", meaning: "1 when the inputs match. The same truth function as ↔." },
};
