import { GATE_HEIGHT, GATE_WIDTH, type GateType } from "@/lib/logic";
import { GateShape } from "@/components/truth/gate-shape";

/** A gate symbol on its own, with stub input wires, for reference tables. */
export function MiniGate({ gate, width = 56 }: { gate: GateType; width?: number }) {
  const pad = 8;
  const w = GATE_WIDTH + pad * 2;
  const h = GATE_HEIGHT + 6;
  const inputs = gate === "NOT" ? [0] : [-9, 9];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={width} height={(width * h) / w} role="img" aria-label={`${gate} gate symbol`}>
      <g transform={`translate(${pad} ${h / 2})`}>
        {inputs.map((y) => (
          <line key={y} x1={-pad} y1={y} x2={6} y2={y} stroke="var(--color-ink)" strokeWidth={1.5} />
        ))}
        <GateShape gate={gate} lit={false} />
        <line x1={GATE_WIDTH} y1={0} x2={GATE_WIDTH + pad} y2={0} stroke="var(--color-ink)" strokeWidth={1.5} />
      </g>
    </svg>
  );
}
