import type { GateType } from "@/lib/logic";
import { GATE_HEIGHT, GATE_WIDTH } from "@/lib/logic";

/**
 * Distinctive-shape (ANSI/IEEE 91) gate symbols, the ones printed in every
 * electronics textbook. Drawn in a GATE_WIDTH × GATE_HEIGHT box whose left
 * edge is x = 0 and vertical centre is y = 0.
 */

const H = GATE_HEIGHT / 2;
const BODY_END = 40; // where the body's nose ends; the bubble or output stub fills the rest
const BUBBLE_R = 3.6;

const AND_BODY = `M 2 ${-H} H ${BODY_END - H} A ${H} ${H} 0 0 1 ${BODY_END - H} ${H} H 2 Z`;
const orBody = (dx: number) =>
  `M ${dx} ${-H} Q ${dx + 9} 0 ${dx} ${H} Q ${dx + 24} ${H} ${BODY_END} 0 Q ${dx + 24} ${-H} ${dx} ${-H} Z`;
const NOT_BODY = `M 4 ${-H + 3} L ${BODY_END - 2 * BUBBLE_R} 0 L 4 ${H - 3} Z`;

const HAS_BUBBLE: Record<GateType, boolean> = {
  AND: false,
  OR: false,
  XOR: false,
  NOT: true,
  NAND: true,
  NOR: true,
  XNOR: true,
};

/** How far into the box an input wire must reach to touch the body's back edge. */
export function inputReach(gate: GateType): number {
  if (gate === "OR" || gate === "NOR") return 4;
  if (gate === "XOR" || gate === "XNOR") return 9;
  return gate === "NOT" ? 4 : 2;
}

export function GateShape({
  gate,
  lit,
  className = "",
}: {
  gate: GateType;
  /** Output is true: the body tints with the accent colour. */
  lit: boolean;
  className?: string;
}) {
  const fill = lit ? "var(--accent-tint)" : "var(--color-sheet)";
  const stroke = "var(--color-ink)";
  const bubbleX = gate === "NOT" ? BODY_END - BUBBLE_R : BODY_END + BUBBLE_R;
  const outStart = HAS_BUBBLE[gate] ? bubbleX + BUBBLE_R : BODY_END;

  return (
    <g className={className}>
      {gate === "AND" || gate === "NAND" ? (
        <path d={AND_BODY} fill={fill} stroke={stroke} strokeWidth={1.5} className="transition-[fill] duration-300" />
      ) : gate === "NOT" ? (
        <path d={NOT_BODY} fill={fill} stroke={stroke} strokeWidth={1.5} className="transition-[fill] duration-300" />
      ) : (
        <>
          <path
            d={orBody(gate === "XOR" || gate === "XNOR" ? 6 : 1)}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
            className="transition-[fill] duration-300"
          />
          {(gate === "XOR" || gate === "XNOR") && (
            <path d={`M 0 ${-H} Q 9 0 0 ${H}`} fill="none" stroke={stroke} strokeWidth={1.5} />
          )}
        </>
      )}
      {HAS_BUBBLE[gate] && (
        <circle cx={bubbleX} cy={0} r={BUBBLE_R} fill="var(--color-sheet)" stroke={stroke} strokeWidth={1.5} />
      )}
      <line x1={outStart} y1={0} x2={GATE_WIDTH} y2={0} stroke={stroke} strokeWidth={1.5} />
    </g>
  );
}
