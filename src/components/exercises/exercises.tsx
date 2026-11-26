"use client";

import { useMemo, useState } from "react";
import type { ChoiceOption, Exercise } from "@/content/types";
import {
  differingRows,
  equivalent,
  format,
  parse,
  parseArgument,
  checkArgument,
  parseOrThrow,
  truthTable,
} from "@/lib/logic";
import { NOTATION, valueLabel, type Notation } from "@/lib/notation";
import { useProgress } from "@/lib/progress";
import { ArgumentTable } from "@/components/truth/argument-table";
import { CircuitDiagram } from "@/components/truth/circuit-diagram";
import { ExpressionInput } from "@/components/truth/expression-input";
import { NotationToggle } from "@/components/truth/notation-toggle";
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

// ---------------------------------------------------------------------------

function FillTable({ exercise, index }: { exercise: Extract<Exercise, { kind: "fill" }>; index: number }) {
  const expr = useMemo(() => parseOrThrow(exercise.expr), [exercise.expr]);
  const table = useMemo(() => truthTable(expr), [expr]);
  const [notation, setNotation] = useNotation();
  const [answers, setAnswers] = useState<(boolean | null)[]>(() => table.rows.map(() => null));
  const [checked, setChecked] = useState(false);
  const [solved, markSolved] = useSolved(exercise.id);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const wrong = (r: number) => checked && answers[r] !== table.rows[r].output;

  const check = () => {
    setChecked(true);
    const mistakes = table.rows.filter((row, r) => answers[r] !== row.output).length;
    if (mistakes === 0) {
      markSolved();
      setFeedback({ tone: "right", message: <>Every row is right. That&apos;s the truth table for <span className="expr">{format(expr, NOTATION[notation].text)}</span>.</> });
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
        <NotationToggle value={notation} onChange={setNotation} showCourse={false} />
      </div>
      <TableGrid
        variables={table.variables}
        rows={table.rows.map((r) => r.inputs)}
        columns={[{ key: "out", label: expr, values: answers, emphasis: true }]}
        notation={notation}
        rowTone={(r) => (wrong(r) ? "wrong" : checked && answers[r] !== null ? "right" : undefined)}
        editable={{
          column: "out",
          onToggle: (r) => {
            setChecked(false);
            setFeedback(null);
            // Cycle blank → true → false → true …
            setAnswers((a) => a.map((v, i) => (i === r ? (v === null ? true : !v) : v)));
          },
        }}
      />
      <div className="mt-3 flex gap-2">
        <CheckButton onClick={check} disabled={answers.some((a) => a === null)} />
        <button
          type="button"
          onClick={() => {
            setAnswers(table.rows.map(() => null));
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
  if (option.circuit) return <CircuitDiagram expr={parseOrThrow(option.circuit)} showGateNames={false} title="Circuit option" />;
  if (option.expr) return <span className="expr text-[14px]">{format(parseOrThrow(option.expr), NOTATION[notation].text)}</span>;
  return <span className="text-[13.5px]">{option.text}</span>;
}

function Choose({ exercise, index }: { exercise: Extract<Exercise, { kind: "choose" }>; index: number }) {
  const [notation, setNotation] = useNotation();
  const [picked, setPicked] = useState<number | null>(null);
  const [solved, markSolved] = useSolved(exercise.id);
  const target = useMemo(() => (exercise.table ? truthTable(parseOrThrow(exercise.table)) : null), [exercise.table]);
  const hasCircuits = exercise.options.some((o) => o.circuit);

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
            <NotationToggle value={notation} onChange={setNotation} showCourse={false} />
          </div>
          <TableGrid
            variables={target.variables}
            rows={target.rows.map((r) => r.inputs)}
            columns={[{ key: "out", label: "output", values: target.rows.map((r) => r.output), emphasis: true }]}
            notation={notation}
          />
        </div>
      )}
      <div className={`grid gap-2 ${hasCircuits ? "sm:grid-cols-2" : "sm:grid-cols-2"}`} role="radiogroup" aria-label="Options">
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
  const table = useMemo(() => truthTable(target), [target]);
  const parsed = text.trim() ? parse(text) : null;

  const check = () => {
    if (!parsed?.ok) return;
    const used = exercise.forbid?.find((f) => text.toLowerCase().includes(f.toLowerCase()));
    if (used) {
      setFeedback({ tone: "wrong", message: <>Equivalent or not, the point is to do it without <span className="expr">{used}</span>.</> });
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
    setFeedback({ tone: "wrong", message: <>Close, but it gives the wrong output when <span className="expr">{where}</span>.</> });
  };

  return (
    <ExerciseCard prompt={exercise.prompt} solved={solved} feedback={feedback} index={index}>
      <div className="mb-3 space-y-2">
        <div className="flex justify-end">
          <NotationToggle value={notation} onChange={setNotation} showCourse={false} />
        </div>
        <TableGrid
          variables={table.variables}
          rows={table.rows.map((r) => r.inputs)}
          columns={[{ key: "out", label: "target", values: table.rows.map((r) => r.output), emphasis: true }]}
          notation={notation}
        />
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
              answer === choice ? "border-ink bg-ink text-white" : "border-rule-strong bg-sheet"
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
