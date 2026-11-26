"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";

const MODES = [
  { href: "/teach", label: "Teach" },
  { href: "/experiment", label: "Experiment" },
  { href: "/mistakes", label: "Mistakes" },
  { href: "/cheat-codes", label: "Cheat codes" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1120px] items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <Logo />
          <span className="hidden text-[15px] min-[440px]:inline">Truthwise</span>
          <span className="sr-only min-[440px]:hidden">Truthwise home</span>
        </Link>
        <nav aria-label="Modes" className="-mr-2 ml-auto flex min-w-0 gap-0.5 overflow-x-auto">
          {MODES.map((m) => {
            const active = pathname === m.href || pathname.startsWith(`${m.href}/`);
            return (
              <Link
                key={m.href}
                href={m.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors sm:px-3 ${
                  active ? "bg-ink text-white" : "text-graphite hover:bg-wash hover:text-ink"
                }`}
              >
                {m.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
