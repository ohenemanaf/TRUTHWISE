import type { ReactNode } from "react";
import { InlineText } from "@/components/rich-text";

export type Feedback = { tone: "right" | "wrong"; message: ReactNode } | null;

/** Frame shared by every "try it yourself" exercise. */
export function ExerciseCard({
  prompt,
  solved,
  feedback,
  children,
  index,
}: {
  prompt: string;
  solved: boolean;
  feedback: Feedback;
  children: ReactNode;
  index: number;
}) {
  return (
    <section className="rounded-2xl border border-rule bg-sheet p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-[14px] font-semibold">
          <span className="mr-2 text-faint">Exercise {index}</span>
          <InlineText text={prompt} />
        </h3>
        {solved && (
          <span className="shrink-0 rounded-full bg-good-tint px-2 py-0.5 text-[11.5px] font-medium text-good">Solved</span>
        )}
      </div>
      {children}
      {feedback && (
        <div
          role="status"
          className={`mt-3 rounded-xl px-3.5 py-2.5 text-[13.5px] ${
            feedback.tone === "right" ? "bg-good-tint" : "bg-bad-tint"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </section>
  );
}

export function CheckButton({ onClick, disabled, children = "Check" }: { onClick: () => void; disabled?: boolean; children?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-9 rounded-lg bg-ink px-3.5 text-[13px] font-medium text-paper disabled:opacity-40"
    >
      {children}
    </button>
  );
}
