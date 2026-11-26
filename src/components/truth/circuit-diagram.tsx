"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import {
  GATE_HEIGHT,
  MAX_GATES,
  PIN_OFFSET,
  buildCircuit,
  circuitValues,
  gateCount,
  type Assignment,
  type Expr,
} from "@/lib/logic";
import { GateShape, inputReach } from "./gate-shape";

/**
 * SVG logic circuit for an expression. With an `assignment` (a row of the
 * truth table) every wire carrying a 1 lights up, so you can watch the signal
 * flow through the gates.
 */
export function CircuitDiagram({
  expr,
  assignment,
  showGateNames = true,
  className = "",
  title,
}: {
  expr: Expr;
  assignment?: Assignment | null;
  showGateNames?: boolean;
  className?: string;
  title?: string;
}) {
  const reduce = useReducedMotion();
  const tooBig = gateCount(expr) > MAX_GATES;
  const circuit = useMemo(() => (tooBig ? null : buildCircuit(expr)), [expr, tooBig]);

  if (!circuit) {
    return (
      <p className="rounded-xl border border-dashed border-rule-strong p-4 text-[13px] text-graphite">
        This expression needs more than {MAX_GATES} gates, too many to draw clearly. Try simplifying it first.
      </p>
    );
  }

  const values = assignment ? circuitValues(circuit, assignment) : null;
  const isLit = (id: string) => values?.get(id) === true;
  const outputValue = values?.get(circuit.output);
  const gateById = new Map(circuit.gates.map((g) => [g.id, g]));

  return (
    <figure className={className} data-notation="gate">
      <svg
        viewBox={`0 0 ${circuit.width} ${circuit.height}`}
        width="100%"
        style={{ maxWidth: circuit.width * 1.35, maxHeight: circuit.height * 1.35 }}
        role="img"
        aria-label={title ?? "Logic gate circuit"}
        className="block overflow-visible"
      >
        {/* Input rails */}
        {circuit.rails.map((rail) => (
          <g key={rail.id}>
            <text
              x={rail.x}
              y={rail.top - 4}
              textAnchor="middle"
              className="expr fill-ink text-[11px] font-semibold"
            >
              {rail.name}
            </text>
            <line
              x1={rail.x}
              y1={rail.top}
              x2={rail.x}
              y2={rail.bottom}
              strokeWidth={isLit(rail.id) ? 2.25 : 1.5}
              className="transition-[stroke,stroke-width] duration-300"
              stroke={isLit(rail.id) ? "var(--accent)" : "var(--color-rule-strong)"}
            />
          </g>
        ))}

        {circuit.constants.map((k) => (
          <g key={k.id}>
            <rect x={k.x - 8} y={k.y - 8} width={16} height={16} rx={3} fill="var(--color-wash)" stroke="var(--color-rule-strong)" />
            <text x={k.x} y={k.y + 4} textAnchor="middle" className="expr fill-ink text-[11px] font-semibold">
              {k.value ? "1" : "0"}
            </text>
          </g>
        ))}

        {/* Wires: drawn before gates so the gate bodies sit on top. */}
        {circuit.wires.map((wire, i) => {
          const lit = isLit(wire.from);
          // Extend the final segment into curved gate backs so it touches the body.
          const target = wire.to ? gateById.get(wire.to) : undefined;
          const pts = [...wire.points];
          if (target) {
            const last = pts[pts.length - 1];
            pts[pts.length - 1] = { x: last.x + inputReach(target.gate), y: last.y };
          }
          const d = pts.map((p, j) => `${j ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
          return (
            <g key={wire.id}>
              <motion.path
                d={d}
                fill="none"
                strokeLinejoin="round"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45, delay: reduce ? 0 : 0.03 * i, ease: [0.32, 0.72, 0, 1] }}
                stroke={lit ? "var(--accent)" : "var(--color-faint)"}
                strokeWidth={lit ? 2.25 : 1.5}
                className="transition-[stroke,stroke-width] duration-300"
              />
              {wire.tap && (
                <circle
                  cx={wire.tap.x}
                  cy={wire.tap.y}
                  r={3}
                  fill={lit ? "var(--accent)" : "var(--color-faint)"}
                  className="transition-[fill] duration-300"
                />
              )}
            </g>
          );
        })}

        {circuit.gates.map((g) => (
          <g key={g.id} transform={`translate(${g.x} ${g.y})`}>
            <GateShape gate={g.gate} lit={isLit(g.id)} />
            {showGateNames && (
              <text
                x={20}
                y={GATE_HEIGHT / 2 + 12}
                textAnchor="middle"
                className="fill-faint text-[9.5px] font-medium"
              >
                {g.gate}
              </text>
            )}
            {/* Pins are implied by the wires; this keeps the two-input spacing honest. */}
            <desc>{`${g.gate} gate, inputs at ±${PIN_OFFSET}`}</desc>
          </g>
        ))}

        {/* Output terminal */}
        <g transform={`translate(${circuit.outputPoint.x} ${circuit.outputPoint.y})`}>
          <circle
            r={5}
            fill={outputValue ? "var(--accent)" : "var(--color-sheet)"}
            stroke={outputValue ? "var(--accent)" : "var(--color-faint)"}
            strokeWidth={1.5}
            className="transition-[fill,stroke] duration-300"
          />
          {values && (
            <text x={11} y={4} className="expr fill-ink text-[12px] font-semibold">
              {outputValue ? "1" : "0"}
            </text>
          )}
        </g>
      </svg>
      {circuit.notes.length > 0 && (
        <figcaption className="mt-2 space-y-1 text-[12px] text-graphite">
          {circuit.notes.map((n) => (
            <p key={n}>{n}</p>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
