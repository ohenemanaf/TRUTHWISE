export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-rule">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-2 px-4 py-6 text-[12.5px] text-graphite">
        <p>Truthwise is free and runs entirely in your browser. Progress is saved on this device only.</p>
        <p>
          Part of a learning series with{" "}
          <span className="font-medium text-ink">BranchWise</span>, for Git &amp; GitHub.
        </p>
      </div>
    </footer>
  );
}
