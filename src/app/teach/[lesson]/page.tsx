import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonView } from "@/components/teach/lesson-view";
import { LESSON_COUNT, allLessons, findLesson } from "@/content/modules";

export function generateStaticParams() {
  return allLessons().map(({ lesson }) => ({ lesson: lesson.slug }));
}

export async function generateMetadata({ params }: PageProps<"/teach/[lesson]">): Promise<Metadata> {
  const ref = findLesson((await params).lesson);
  return ref ? { title: ref.lesson.title, description: ref.lesson.summary } : {};
}

export default async function LessonPage({ params }: PageProps<"/teach/[lesson]">) {
  const ref = findLesson((await params).lesson);
  if (!ref) notFound();
  const { lesson, module, prev, next, position } = ref;

  return (
    <div className="mx-auto max-w-[820px] px-4 pt-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-[12.5px] text-graphite">
        <Link href="/teach" className="hover:text-ink">
          Teach
        </Link>
        <span className="mx-1.5 text-faint">/</span>
        <span>
          Module {module.number}: {module.title}
        </span>
      </nav>
      <header className="mb-6">
        <p className="mb-1 flex items-center gap-2 text-[12.5px] text-graphite">
          <span className="size-2 rounded-full" style={{ background: module.color }} aria-hidden="true" />
          {module.framing}
          <span className="text-faint">
            Lesson {position} of {LESSON_COUNT}, about {lesson.minutes} min
          </span>
        </p>
        <h1 className="text-[26px] leading-tight font-semibold tracking-tight">{lesson.title}</h1>
        <p className="mt-1 text-[14px] text-graphite">{lesson.summary}</p>
      </header>
      <LessonView lesson={lesson} module={module} prev={prev} next={next} />
    </div>
  );
}
