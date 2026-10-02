export function Logo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="22" stroke="hsl(38 62% 64%)" strokeWidth="1.5" />
      <path d="M12 31c4-1 8-1 12 2 4-3 8-3 12-2V15c-4-1-8-1-12 2-4-3-8-3-12-2z" stroke="hsl(38 62% 64%)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M24 17v16" stroke="hsl(38 62% 64%)" strokeWidth="1.5" />
      <path d="M16 21h4M16 25h4M28 21h4M28 25h4" stroke="hsl(40 38% 89%)" strokeWidth="1" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}
