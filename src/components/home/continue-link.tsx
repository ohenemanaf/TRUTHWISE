"use client";

import Link from "next/link";
import { findLesson } from "@/content/modules";
import { useProgress, useProgressReady } from "@/lib/progress";

/** "Continue where you left off", shown only to returning visitors. */
export function ContinueLink() {
  const ready = useProgressReady();
  const last = useProgress((s) => s.lastLesson);
  const ref = ready && last ? findLesson(last) : null;
  if (!ref) return null;
  return (
    <p className="mt-4 text-[13px] text-graphite">
      Welcome back.{" "}
      <Link href={`/teach/${ref.lesson.slug}`} className="font-medium text-ink underline underline-offset-2">
        Continue with “{ref.lesson.title}”
      </Link>
    </p>
  );
}
