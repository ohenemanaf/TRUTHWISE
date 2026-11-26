"use client";

import { useMemo, useState } from "react";
import type { ChoiceOption, Exercise } from "@/content/types";
import {
  checkArgument,
  differingRows,
  equivalent,
  format,
  parse,
  parseArgument,
  parseOrThrow,
  truthTable,
  type Expr,
  type TruthTable,
} from "@/lib/logic";
import { NOTATION, valueLabel, type Notation } from "@/lib/notation";
import { useProgress } from "@/lib/progress";
import { ArgumentTable } from "@/components/truth/argument-table";
import { CircuitDiagram } from "@/components/truth/circuit-diagram";
import { ExpressionInput } from "@/components/truth/expression-input";
import { NotationToggle } from "@/components/truth/notation-toggle";
import { RowOrderToggle } from "@/components/truth/row-order-toggle";
import { TableGrid } from "@/components/truth/table-grid";
import { RichText } from "@/components/rich-text";
import { CheckButton, ExerciseCard, type Feedback } from "./exercise-card";

export function ExerciseView({ exercise, index }: { exercise: Exercise; index: number }) {
  switch (exercise.kind) {
    case "fill":
      return <FillTable exercise={exercise} index={index} />;
    case "choose":
      return <Choose exercise={exercise} index={index} />;
    case "write":
      return <WriteExpression exercise={exercise} index={index} />;
    case "validity":
      return <Validity exercise={exercise} index={index} />;
  }
}

function useSolved(id: string) {
  const solved = useProgress((s) => s.solvedExercises.includes(id));
  const solve = useProgress((s) => s.solveExercise);
  return [solved, () => solve(id)] as const;
}

function useNotation() {
  return [useProgress((s) => s.notation), useProgress((s) => s.setNotation)] as const;
}

/** The exercise's table in the learner's chosen row order. */
function useOrderedTable(expr: Expr | null): TruthTable | null {
  const order = useProgress((s) => s.rowOrder);
  return useMemo(() => (expr ? truthTable(expr, { order }) : null), [expr, order]);
}

function Toggles({ notation, setNotation }: { notation: Notation; setNotation: (n: Notation) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <RowOrderToggle notation={notation} />
      <NotationToggle value={notation} onChange={setNotation} showCourse={false} />
    </div>
  );
}

/** A read-only output column to match against. */
function TargetTable({ table, notation, label }: { table: TruthTable; notation: Notation; label: string }) {
  return (
    <TableGrid
      variables={table.variables}
      rows={table.rows.map((r) => r.inputs)}
      rowKeys={table.rows.map((r) => r.index)}
      columns={[{ key: "out", label, values: table.rows.map((r) => r.output), emphasis: true }]}
      notation={notation}
    />
  );
}

// ---------------------------------------------------------------------------

function FillTable({ exercise, index }: { exercise: Extract<Exercise, { kind: "fill" }>; index: number }) {
  const expr = useMemo(() => parseOrThrow(exercise.expr), [exercise.expr]);
  const table = useOrderedTable(expr)!;
  const [notation, setNotation] = useNotation();
  // Keyed by each row's binary index, so answers stay put when the row order flips.
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [checked, setChecked] = useState(false);
  const [solved, markSolved] = useSolved(exercise.id);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const answerAt = (pos: number): boolean | null => answers[table.rows[pos].index] ?? null;
  const wrong = (pos: number) => checked && answerAt(pos) !== table.rows[pos].output;
  const complete = table.rows.every((r) => answers[r.index] !== undefined);

  const check = () => {
    setChecked(true);
    const mistakes = table.rows.filter((row) => answers[row.index] !== row.output).length;
    if (mistakes === 0) {
      markSolved();
      setFeedback({
        tone: "right",
        message: (
          <>
            Every row is right. That&apos;s the truth table for{" "}
            <span className="expr">{format(expr, NOTATION[notation].text)}</span>.
          </>
        ),
      });
    } else {
      setFeedback({
        tone: "wrong",
        message: `${mistakes} row${mistakes === 1 ? " isn't" : "s aren't"} right yet. They're highlighted. Click a cell to change it.`,
      });
    }
  };

  return (
    <ExerciseCard prompt={exercise.prompt} solved={solved} feedback={feedback} index={index}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12.5px] text-graphite">Click each output cell to set it.</p>
        <Toggles notation={notation} setNotation={setNotation} />
      </div>
      <TableGrid
        variables={table.variables}
        rows={table.rows.map((r) => r.inputs)}
        rowKeys={table.rows.map((r) => r.index)}
        columns={[{ key: "out", label: expr, values: table.rows.map((_, pos) => answerAt(pos)), emphasis: true }]}
        notation={notation}
        rowTone={(pos) => (wrong(pos) ? "wrong" : checked && answerAt(pos) !== null ? "right" : undefined)}
        editable={{
          column: "out",
          onToggle: (pos) => {
            setChecked(false);
            setFeedback(null);
            const key = table.rows[pos].index;
            // Cycle blank → true → false → true …
            setAnswers((a) => ({ ...a, [key]: a[key] === undefined ? true : !a[key] }));
          },
        }}
      />
      <div className="mt-3 flex gap-2">
        <CheckButton onClick={check} disabled={!complete} />
        <button
          type="button"
          onClick={() => {
            setAnswers({});
            setChecked(false);
            setFeedback(null);
          }}
          className="h-9 rounded-lg px-2 text-[13px] text-graphite hover:text-ink"
        >
          Clear
        </button>
      </div>
    </ExerciseCard>
  );
}

// ---------------------------------------------------------------------------

function OptionBody({ option, notation }: { option: ChoiceOption; notation: Notation }) {
  if (option.circuit) {
    return <CircuitDiagram expr={parseOrThrow(option.circuit)} showGateNames={false} title="Circuit option" />;
  }
  if (option.expr) {
    return <span className="expr text-[14px]">{format(parseOrThrow(option.expr), NOTATION[notation].text)}</span>;
  }
  return <span className="text-[13.5px]">{option.text}</span>;
}

function Choose({ exercise, index }: { exercise: Extract<Exercise, { kind: "choose" }>; index: number }) {
  const [notation, setNotation] = useNotation();
  const [picked, setPicked] = useState<number | null>(null);
  const [solved, markSolved] = useSolved(exercise.id);
  const targetExpr = useMemo(() => (exercise.table ? parseOrThrow(exercise.table) : null), [exercise.table]);
  const target = useOrderedTable(targetExpr);

  const feedback: Feedback =
    picked === null
      ? null
      : picked === exercise.answer
        ? { tone: "right", message: <RichText text={exercise.explain} /> }
        : { tone: "wrong", message: "Not that one. Check it against the table row by row, then try again." };

  return (
    <ExerciseCard prompt={exercise.prompt} solved={solved} feedback={feedback} index={index}>
      {target && (
        <div className="mb-3 space-y-2">
          <div className="flex justify-end">
            <Toggles notation={notation} setNotation={setNotation} />
          </div>
          <TargetTable table={target} notation={notation} label="output" />
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Options">
        {exercise.options.map((option, i) => {
          const state = picked === i ? (i === exercise.answer ? "right" : "wrong") : null;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={picked === i}
              onClick={() => {
                setPicked(i);
                if (i === exercise.answer) markSolved();
              }}
              className={`min-w-0 rounded-xl border p-3 text-left transition-colors ${
                state === "right"
                  ? "border-good bg-good-tint/50"
                  : state === "wrong"
                    ? "border-bad bg-bad-tint/50"
                    : "border-rule hover:border-rule-strong"
              }`}
            >
              <span className="mb-1 block text-[11.5px] text-faint">Option {String.fromCharCode(65 + i)}</span>
              <OptionBody option={option} notation={notation} />
            </button>
          );
        })}
      </div>
    </ExerciseCard>
  );
}

// ---------------------------------------------------------------------------

function WriteExpression({ exercise, index }: { exercise: Extract<Exercise, { kind: "write" }>; index: number }) {
  const [notation, setNotation] = useNotation();
  const [text, setText] = useState("");
  const [solved, markSolved] = useSolved(exercise.id);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const target = useMemo(() => parseOrThrow(exercise.target), [exercise.target]);
  const table = useOrderedTable(target)!;
  const parsed = text.trim() ? parse(text) : null;

  const check = () => {
    if (!parsed?.ok) return;
    const used = exercise.forbid?.find((f) => text.toLowerCase().includes(f.toLowerCase()));
    if (used) {
      setFeedback({
        tone: "wrong",
        message: (
          <>
            Equivalent or not, the point is to do it without <span className="expr">{used.trim()}</span>.
          </>
        ),
      });
      return;
    }
    if (equivalent(parsed.expr, target)) {
      markSolved();
      setFeedback({ tone: "right", message: "Correct. Your expression has exactly this truth table." });
      return;
    }
    const diff = differingRows(parsed.expr, target)[0];
    const where = Object.entries(diff)
      .map(([k, v]) => `${k} = ${valueLabel(v, notation)}`)
      .join(", ");
    setFeedback({
      tone: "wrong",
      message: (
        <>
          Close, but it gives the wrong output when <span className="expr">{where}</span>.
        </>
      ),
    });
  };

  return (
    <ExerciseCard prompt={exercise.prompt} solved={solved} feedback={feedback} index={index}>
      <div className="mb-3 space-y-2">
        <div className="flex justify-end">
          <Toggles notation={notation} setNotation={setNotation} />
        </div>
        <TargetTable table={table} notation={notation} label="target" />
      </div>
      <ExpressionInput
        value={text}
        onChange={(t) => {
          setText(t);
          setFeedback(null);
        }}
        error={parsed && !parsed.ok ? parsed.error : null}
        label="Your expression"
        placeholder={exercise.hint ?? "Any notation works"}
      />
      <div className="mt-3">
        <CheckButton onClick={check} disabled={!parsed?.ok} />
      </div>
    </ExerciseCard>
  );
}

// ---------------------------------------------------------------------------

function Validity({ exercise, index }: { exercise: Extract<Exercise, { kind: "validity" }>; index: number }) {
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [solved, markSolved] = useSolved(exercise.id);
  const valid = useMemo(() => {
    const parsed = parseArgument(exercise.argument);
    if (!parsed.ok) throw new Error(parsed.error.message);
    return checkArgument(parsed.argument).valid;
  }, [exercise.argument]);

  const feedback: Feedback =
    answer === null
      ? null
      : answer === valid
        ? { tone: "right", message: "Right. The table below shows why." }
        : { tone: "wrong", message: "Not quite. Look for a row where every premise is true but the conclusion is false." };

  return (
    <ExerciseCard prompt={exercise.prompt} solved={solved} feedback={feedback} index={index}>
      <p className="expr mb-3 text-[15px]">{exercise.argument}</p>
      <div className="flex gap-2">
        {[true, false].map((choice) => (
          <button
            key={String(choice)}
            type="button"
            onClick={() => {
              setAnswer(choice);
              if (choice === valid) markSolved();
            }}
            aria-pressed={answer === choice}
            className={`h-9 rounded-lg border px-3.5 text-[13px] font-medium ${
              answer === choice ? "border-ink bg-ink text-paper" : "border-rule-strong bg-sheet"
            }`}
          >
            {choice ? "Valid" : "Invalid"}
          </button>
        ))}
      </div>
      {answer !== null && (
        <div className="mt-4">
          <ArgumentTable argument={exercise.argument} />
        </div>
      )}
    </ExerciseCard>
  );
}
