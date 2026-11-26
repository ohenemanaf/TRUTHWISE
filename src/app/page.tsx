import Link from "next/link";
import { HeroDemo } from "@/components/home/hero-demo";
import { ContinueLink } from "@/components/home/continue-link";

const MODES = [
  {
    href: "/teach",
    title: "Teach",
    body: "Six short modules, from your first truth table to arguments and code. Every table is built row by row, so you see where each value comes from.",
  },
  {
    href: "/experiment",
    title: "Experiment",
    body: "Type any expression and get its table, circuit and simplest form live. The notation toggle works here too.",
  },
  {
    href: "/mistakes",
    title: "Learn from mistakes",
    body: "Seven errors almost everyone makes, from De Morgan slips to affirming the consequent, each disproved by its own truth table.",
  },
  {
    href: "/cheat-codes",
    title: "Cheat codes",
    body: "Every gate, law and argument form on one searchable page, plus a Rosetta Stone for the notations.",
  },
] as const;

const COURSES = [
  { course: "Digital Electronics", writes: "A · B", values: "1 / 0", color: "var(--color-binary)" },
  { course: "Discrete Maths", writes: "P ∧ Q", values: "T / F", color: "var(--color-tf)" },
  { course: "Critical Thinking", writes: "P and Q", values: "true / false", color: "var(--color-word)" },
  { course: "Computer Science", writes: "a && b", values: "true / false", color: "var(--color-code)" },
] as const;

export default function Home() {
  return (
    <div className="mx-auto max-w-[1120px] px-4">
      <section className="grid items-center gap-8 pt-10 pb-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:pt-14">
        <div>
          <h1 className="text-[28px] leading-[1.15] font-semibold tracking-tight sm:text-[32px]">
            One truth table, four classes.
          </h1>
          <p className="mt-3 max-w-[46ch] text-[15px] text-graphite">
            Electronics writes 1 and 0. Discrete maths writes T and F. Code writes <code className="expr">&amp;&amp;</code>{" "}
            and <code className="expr">||</code>. It&apos;s the same logic every time, and Truthwise lets you switch
            between notations to see it.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/teach/what-is-a-truth-table"
              className="inline-flex h-10 items-center rounded-xl bg-ink px-4 text-[13.5px] font-medium text-paper hover:bg-ink/90"
            >
              Start the first lesson
            </Link>
            <Link
              href="/experiment"
              className="inline-flex h-10 items-center rounded-xl border border-rule-strong bg-sheet px-4 text-[13.5px] font-medium hover:border-ink"
            >
              Try your own expression
            </Link>
          </div>
          <ContinueLink />
        </div>
        <HeroDemo />
      </section>

      <section className="border-t border-rule py-10">
        <h2 className="text-[18px] font-semibold tracking-tight">The same idea, wearing four outfits</h2>
        <p className="mt-1 max-w-[64ch] text-graphite">
          &ldquo;Both must be true&rdquo; turns up in at least four courses, written four different ways. Once you see
          they match, you only have to learn it once.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-rule bg-sheet">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-rule bg-wash/60 text-left text-[12px] text-graphite">
                <th scope="col" className="px-3.5 py-2 font-medium">Course</th>
                <th scope="col" className="px-3.5 py-2 font-medium">Writes AND as</th>
                <th scope="col" className="px-3.5 py-2 font-medium">Values</th>
              </tr>
            </thead>
            <tbody>
              {COURSES.map((c) => (
                <tr key={c.course} className="border-b border-rule last:border-b-0">
                  <td className="px-3.5 py-2">
                    <span className="mr-2 inline-block size-2 rounded-full align-middle" style={{ background: c.color }} />
                    {c.course}
                  </td>
                  <td className="expr px-3.5 py-2" style={{ color: c.color }}>{c.writes}</td>
                  <td className="expr px-3.5 py-2 whitespace-nowrap text-graphite">{c.values}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-t border-rule py-10">
        <h2 className="text-[18px] font-semibold tracking-tight">Four ways to learn</h2>
        <ul className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
          {MODES.map((m) => (
            <li key={m.href}>
              <Link href={m.href} className="group -mx-3 block rounded-xl px-3 py-3 hover:bg-sheet">
                <span className="font-semibold group-hover:underline">{m.title}</span>
                <span className="mt-0.5 block text-[13.5px] text-graphite">{m.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
