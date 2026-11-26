/** The AND truth table as a 2×2 grid: only the bottom-right cell (1,1) is lit. */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="1" width="9" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="12" width="9" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="12" width="9" height="9" rx="2" fill="var(--color-tf)" />
    </svg>
  );
}
