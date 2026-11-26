import type { TextNotation } from "./logic";

/**
 * The four views of a truth table. Each one is how a different course writes
 * the same thing, and the toggle between them is the heart of the app.
 */
export type Notation = "binary" | "tf" | "gate" | "code";

export interface NotationInfo {
  readonly id: Notation;
  /** Short label on the toggle. */
  readonly label: string;
  /** The course this notation comes from. */
  readonly course: string;
  /** How the expression itself is written in this view. */
  readonly text: TextNotation;
  readonly values: readonly [trueLabel: string, falseLabel: string];
}

export const NOTATIONS: readonly NotationInfo[] = [
  { id: "binary", label: "1 / 0", course: "Digital Electronics", text: "electronics", values: ["1", "0"] },
  { id: "tf", label: "T / F", course: "Discrete Maths", text: "symbolic", values: ["T", "F"] },
  { id: "gate", label: "Gates", course: "Circuits", text: "electronics", values: ["1", "0"] },
  { id: "code", label: "Code", course: "Computer Science", text: "code", values: ["true", "false"] },
];

export const NOTATION: Readonly<Record<Notation, NotationInfo>> = Object.fromEntries(
  NOTATIONS.map((n) => [n.id, n]),
) as Record<Notation, NotationInfo>;

export const valueLabel = (value: boolean, notation: Notation): string =>
  NOTATION[notation].values[value ? 0 : 1];
