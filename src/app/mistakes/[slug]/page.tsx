import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MistakeView } from "@/components/mistakes/mistake-view";
import { MISTAKES, findMistake } from "@/content/mistakes";

export function generateStaticParams() {
  return MISTAKES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/mistakes/[slug]">): Promise<Metadata> {
  const m = findMistake((await params).slug);
  return m ? { title: m.title, description: m.summary } : {};
}

export default async function MistakePage({ params }: PageProps<"/mistakes/[slug]">) {
  const mistake = findMistake((await params).slug);
  if (!mistake) notFound();
  const i = MISTAKES.indexOf(mistake);
  const next = MISTAKES[i + 1] ?? null;

  return (
    <div className="mx-auto max-w-[820px] px-4 pt-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-[12.5px] text-graphite">
        <Link href="/mistakes" className="hover:text-ink">
          Learn from mistakes
        </Link>
        <span className="mx-1.5 text-faint">/</span>
        <span>
          {i + 1} of {MISTAKES.length}
        </span>
      </nav>
      <header className="mb-6">
        <p className="mb-1 text-[12.5px] text-graphite">Usually met in {mistake.course}</p>
        <h1 className="text-[26px] leading-tight font-semibold tracking-tight">{mistake.title}</h1>
        <p className="mt-1 text-graphite">{mistake.summary}</p>
      </header>
      <MistakeView mistake={mistake} />
      <div className="mt-8 flex justify-end border-t border-rule pt-5">
        {next ? (
          <Link
            href={`/mistakes/${next.slug}`}
            className="inline-flex h-9 items-center rounded-lg bg-ink px-3.5 text-[13px] font-medium text-white"
          >
            Next mistake: {next.title}
          </Link>
        ) : (
          <Link href="/cheat-codes" className="inline-flex h-9 items-center rounded-lg bg-ink px-3.5 text-[13px] font-medium text-white">
            Open the cheat codes
          </Link>
        )}
      </div>
    </div>
  );
}
