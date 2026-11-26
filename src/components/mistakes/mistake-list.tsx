"use client";

import Link from "next/link";
import { MISTAKES } from "@/content/mistakes";
import { useProgress, useProgressReady } from "@/lib/progress";

export function MistakeList() {
  const ready = useProgressReady();
  const viewed = useProgress((s) => s.viewedMistakes);

  return (
    <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-sheet">
      {MISTAKES.map((m) => {
        const seen = ready && viewed.includes(m.slug);
        return (
          <li key={m.slug}>
            <Link href={`/mistakes/${m.slug}`} className="flex items-start gap-4 px-4 py-3.5 hover:bg-wash/60">
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium">{m.title}</span>
                <span className="block text-[13px] text-graphite">{m.summary}</span>
              </span>
              <span className="hidden shrink-0 text-[12px] text-faint sm:block">{m.course}</span>
              {seen && (
                <span className="shrink-0 rounded-full bg-good-tint px-2 py-0.5 text-[11.5px] font-medium text-good">Studied</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
