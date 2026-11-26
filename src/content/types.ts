import type { GateType } from "@/lib/logic";

/** Expressions and arguments are stored as text and parsed at render time; tests check they all parse. */

export type Block =
  | { readonly type: "text"; readonly text: string }
  /** Animated, row-by-row construction of a truth table. */
  | { readonly type: "build"; readonly expr: string; readonly caption?: string }
  /** The notation bridge: one table, toggled across courses. */
  | { readonly type: "bridge"; readonly expr: string; readonly text?: string }
  | { readonly type: "table"; readonly expr: string; readonly working?: boolean }
  | { readonly type: "circuit"; readonly expr: string; readonly caption?: string }
  | { readonly type: "gates"; readonly gates: readonly GateType[] }
  | { readonly type: "simplify"; readonly expr: string; readonly text?: string }
  | { readonly type: "argument"; readonly argument: string; readonly title?: string }
  /** Two expressions side by side with a verdict on whether they're equivalent. */
  | { readonly type: "compare"; readonly left: string; readonly right: string; readonly text?: string }
  | { readonly type: "code"; readonly code: string; readonly caption?: string }
  | { readonly type: "callout"; readonly text: string };

export interface ChoiceOption {
  /** Plain text option. */
  readonly text?: string;
  /** An expression, printed in the active notation. */
  readonly expr?: string;
  /** An expression drawn as a gate circuit. */
  readonly circuit?: string;
}

export type Exercise =
  | { readonly kind: "fill"; readonly id: string; readonly prompt: string; readonly expr: string }
  | {
      readonly kind: "choose";
      readonly id: string;
      readonly prompt: string;
      /** Show this expression's output column as the thing to match. */
      readonly table?: string;
      readonly options: readonly ChoiceOption[];
      readonly answer: number;
      readonly explain: string;
    }
  | {
      readonly kind: "write";
      readonly id: string;
      readonly prompt: string;
      /** Any equivalent answer is accepted. */
      readonly target: string;
      readonly hint?: string;
      /** Reject answers that just retype the target with this operator (e.g. "write XOR without ⊕"). */
      readonly forbid?: readonly string[];
    }
  | {
      readonly kind: "validity";
      readonly id: string;
      readonly prompt: string;
      readonly argument: string;
    };

export interface Lesson {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly minutes: number;
  readonly blocks: readonly Block[];
  readonly exercises: readonly Exercise[];
}

export interface Module {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  /** Which course this module speaks the language of. */
  readonly framing: string;
  readonly color: string;
  readonly lessons: readonly Lesson[];
}
