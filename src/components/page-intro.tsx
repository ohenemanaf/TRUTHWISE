import type { ReactNode } from "react";

/** Shared page heading: one container width, one title size, across all modes. */
export function PageIntro({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-[26px] leading-tight font-semibold tracking-tight">{title}</h1>
      {children && <div className="mt-1.5 max-w-[64ch] text-[14px] text-graphite">{children}</div>}
    </div>
  );
}

export function Container({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return <div className={`mx-auto px-4 pt-8 ${narrow ? "max-w-[820px]" : "max-w-[1120px]"}`}>{children}</div>;
}
