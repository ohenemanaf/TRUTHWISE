import { Fragment, type ReactNode } from "react";

/**
 * Tiny, safe formatter for lesson copy: blank lines make paragraphs,
 * **bold**, `code` and _emphasis_ inline. No HTML is ever interpreted.
 */
function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith("_") && part.endsWith("_") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const paragraphs = text.trim().split(/\n\s*\n/);
  return (
    <div className={`prose-tw ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i}>{inline(p.replace(/\s*\n\s*/g, " "))}</p>
      ))}
    </div>
  );
}

export function InlineText({ text }: { text: string }) {
  return <>{inline(text)}</>;
}
