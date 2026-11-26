import { describe, expect, it } from "vitest";
import { checkArgument, equivalent, parse, parseArgument, parseOrThrow, singleGate, truthTable, gateCount, MAX_GATES } from "@/lib/logic";
import { GATES } from "./gates";
import { MISTAKES } from "./mistakes";
import { MODULES, allLessons } from "./modules";
import { ARGUMENT_FORMS, ROSETTA } from "./reference";
import type { Block, Exercise } from "./types";

/**
 * Lesson content is data, so these tests treat it like code: every expression
 * must parse, every answer key must agree with the engine, and every argument
 * labelled valid must actually be valid.
 */

function expressionsIn(block: Block): string[] {
  switch (block.type) {
    case "build":
    case "bridge":
    case "table":
    case "circuit":
    case "simplify":
      return [block.expr];
    case "compare":
      return [block.left, block.right];
    default:
      return [];
  }
}

const argumentOf = (text: string) => {
  const r = parseArgument(text);
  if (!r.ok) throw new Error(`${text}: ${r.error.message}`);
  return checkArgument(r.argument);
};

describe("lesson content", () => {
  const lessons = allLessons();

  it("has six modules and unique slugs and exercise ids", () => {
    expect(MODULES).toHaveLength(6);
    const slugs = lessons.map((l) => l.lesson.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const ids = lessons.flatMap((l) => l.lesson.exercises.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every module ends with a notation bridge", () => {
    for (const m of MODULES) {
      expect(m.lessons.at(-1)!.blocks.some((b) => b.type === "bridge"), m.title).toBe(true);
    }
  });

  it("every lesson has a step-through or worked table, and at least one exercise", () => {
    for (const { lesson } of lessons) {
      expect(lesson.exercises.length, lesson.slug).toBeGreaterThan(0);
      const interactive = lesson.blocks.some((b) =>
        ["build", "bridge", "circuit", "argument", "compare", "simplify", "table"].includes(b.type),
      );
      expect(interactive, lesson.slug).toBe(true);
    }
  });

  it.each(lessons.flatMap(({ lesson }) => lesson.blocks.flatMap(expressionsIn).map((e) => [lesson.slug, e])))(
    "%s: “%s” parses",
    (_, expr) => expect(parse(expr).ok).toBe(true),
  );

  it("circuits in lessons are small enough to draw", () => {
    for (const { lesson } of lessons) {
      for (const b of lesson.blocks) {
        if (b.type === "circuit" || b.type === "bridge") {
          expect(gateCount(parseOrThrow(b.expr)), b.expr).toBeLessThanOrEqual(MAX_GATES);
        }
      }
    }
  });

  it("argument blocks parse", () => {
    for (const { lesson } of lessons) {
      for (const b of lesson.blocks) if (b.type === "argument") argumentOf(b.argument);
    }
  });
});

describe("exercise answer keys agree with the engine", () => {
  const exercises: Exercise[] = allLessons().flatMap((l) => [...l.lesson.exercises]);

  it.each(exercises.filter((e) => e.kind === "choose" && e.table).map((e) => [e.id, e] as const))(
    "%s: exactly the keyed circuit/expression matches the table",
    (_, e) => {
      if (e.kind !== "choose" || !e.table) return;
      const target = parseOrThrow(e.table);
      const matching = e.options
        .map((o, i) => ({ i, src: o.circuit ?? o.expr }))
        .filter((o) => o.src && equivalent(parseOrThrow(o.src), target))
        .map((o) => o.i);
      expect(matching).toEqual([e.answer]);
    },
  );

  it("expression-choice questions have exactly one equivalent option", () => {
    // m3-iff-equivalent and m4-de-morgan-pick ask "which is equivalent to X?"
    const targets: Record<string, string> = { "m3-iff-equivalent": "P ↔ Q", "m4-de-morgan-pick": "¬(P ∧ ¬Q)" };
    for (const [id, targetText] of Object.entries(targets)) {
      const e = exercises.find((x) => x.id === id);
      if (!e || e.kind !== "choose") throw new Error(`missing ${id}`);
      const target = parseOrThrow(targetText);
      const matching = e.options.map((o, i) => (o.expr && equivalent(parseOrThrow(o.expr), target) ? i : -1)).filter((i) => i >= 0);
      expect(matching, id).toEqual([e.answer]);
    }
  });

  it.each(exercises.filter((e) => e.kind === "fill").map((e) => [e.id, e] as const))("%s: expression parses", (_, e) => {
    if (e.kind === "fill") expect(parse(e.expr).ok).toBe(true);
  });

  it("write exercises are solvable without the forbidden symbols", () => {
    // A known-good answer for each, which must be equivalent and avoid the forbidden text.
    const answers: Record<string, string> = {
      "m2-nand-not": "A NAND A",
      "m3-write-contradiction": "P AND ~P".replace("~", "¬"),
      "m4-de-morgan-or": "¬A ∧ ¬B",
      "m4-simplify-factor": "A",
      "m4-simplify-absorb": "P",
      "m6-simplify-code": "a && !b",
    };
    for (const e of exercises) {
      if (e.kind !== "write") continue;
      const answer = answers[e.id];
      expect(answer, `no known answer for ${e.id}`).toBeDefined();
      expect(equivalent(parseOrThrow(answer), parseOrThrow(e.target)), e.id).toBe(true);
      for (const f of e.forbid ?? []) expect(answer.toLowerCase().includes(f.toLowerCase()), `${e.id} uses ${f}`).toBe(false);
    }
  });

  it("validity exercises parse", () => {
    for (const e of exercises) if (e.kind === "validity") argumentOf(e.argument);
  });

  it("the fallacy exercises really are invalid and the valid ones valid", () => {
    const expected: Record<string, boolean> = {
      "m5-validity-mp": true,
      "m5-validity-ds": true,
      "m5-validity-chain": true,
      "m5-validity-ac": false,
      "m5-validity-da": false,
    };
    for (const [id, valid] of Object.entries(expected)) {
      const e = exercises.find((x) => x.id === id);
      if (!e || e.kind !== "validity") throw new Error(`missing ${id}`);
      expect(argumentOf(e.argument).valid, id).toBe(valid);
    }
  });
});

describe("reference content", () => {
  it.each(ARGUMENT_FORMS.map((f) => [f.name, f] as const))("%s has the expected verdict", (_, f) => {
    expect(argumentOf(f.argument).valid ? "valid" : "invalid").toBe(f.expected);
  });

  it("rosetta rows map to the gates they claim", () => {
    for (const row of ROSETTA) {
      if (!row.gate) continue;
      expect(singleGate(parseOrThrow(row.expr)), row.concept).toBe(row.gate);
    }
  });

  it("gate reference expressions are the gates they describe", () => {
    for (const info of Object.values(GATES)) expect(singleGate(parseOrThrow(info.expr))).toBe(info.gate);
  });

  it("mistake evidence parses and the 'wrong' comparisons really differ", () => {
    for (const m of MISTAKES) {
      for (const b of m.evidence) {
        if (b.type === "compare") {
          expect(equivalent(parseOrThrow(b.left), parseOrThrow(b.right)), `${m.slug}: ${b.left} vs ${b.right}`).toBe(false);
        }
        if (b.type === "argument") expect(argumentOf(b.argument).valid, m.slug).toBe(false);
        if (b.type === "table") expect(truthTable(parseOrThrow(b.expr)).rows.length).toBeGreaterThan(0);
      }
    }
  });
});
