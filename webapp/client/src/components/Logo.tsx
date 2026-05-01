type Props = {
  className?: string;
};

// Custom SVG mark — a 3x3 grid where one node is the gold anomaly.
export function Logo({ className }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-label="ANOMALY"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="6" y="6" width="14" height="14" rx="2" fill="currentColor" />
      <rect x="25" y="6" width="14" height="14" rx="2" fill="currentColor" />
      <rect x="44" y="6" width="14" height="14" rx="2" fill="currentColor" />
      <rect x="6" y="25" width="14" height="14" rx="2" fill="currentColor" />
      <circle cx="32" cy="32" r="7" fill="hsl(42 65% 53%)" />
      <rect x="44" y="25" width="14" height="14" rx="2" fill="currentColor" />
      <rect x="6" y="44" width="14" height="14" rx="2" fill="currentColor" />
      <rect x="25" y="44" width="14" height="14" rx="2" fill="currentColor" />
      <rect x="44" y="44" width="14" height="14" rx="2" fill="currentColor" />
    </svg>
  );
}
