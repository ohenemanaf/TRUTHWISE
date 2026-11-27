import { format, toIfStatement, type Assignment, type Expr, evaluate } from "@/lib/logic";

/** The expression as a real `if` statement, optionally run against one row. */
export function CodeView({ expr, assignment }: { expr: Expr; assignment?: Assignment | null }) {
  const condition = format(expr, "code");
  const result = assignment ? evaluate(expr, assignment) : null;
  const names = Object.keys(assignment ?? {});

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-rule bg-[#1d2335] text-[12.5px] text-[#d9deea]" data-notation="code">
      <pre className="expr whitespace-pre-wrap break-words p-3.5 leading-relaxed">
        {assignment && names.length > 0 && (
          <span className="block text-[#8d97ad]">
            {names.map((n, i) => (
              <span key={n} className="block">
                <span className="text-[#c792ea]">{i === 0 ? "const " : "      "}</span>
                {n} = <span className={assignment[n] ? "text-[#f2a3cf]" : "text-[#8d97ad]"}>{String(assignment[n])}</span>
                {i === names.length - 1 ? ";" : ","}
              </span>
            ))}
            {"\n"}
          </span>
        )}
        <span className="text-[#c792ea]">if</span> ({condition}) {"{"}
        {"\n"}
        <span className="text-[#8d97ad]">{"  // runs when condition is true"}</span>
        {"\n}"}
      </pre>
      {result !== null && (
        <p className="border-t border-white/10 px-3.5 py-2 text-[12px]">
          Condition is <span className="expr font-semibold text-[#f2a3cf]">{String(result)}</span>, so the block{" "}
          {result ? "runs" : "is skipped"}.
        </p>
      )}
      <span className="sr-only">{toIfStatement(expr)}</span>
    </div>
  );
}
