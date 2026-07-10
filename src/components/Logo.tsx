export function Logo({ size = 28 }: { size?: number }) {
  const s = size;
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-hidden>
        {/* viewfinder brackets */}
        <path d="M2 8V2h6M32 2h6v6M38 32v6h-6M8 38H2v-6" stroke="currentColor" strokeWidth="1.6" />
        {/* frame */}
        <rect x="7" y="9" width="26" height="22" stroke="currentColor" strokeWidth="1.4" />
        {/* pixel left half */}
        <rect x="9" y="11" width="3" height="3" fill="currentColor" />
        <rect x="12" y="14" width="3" height="3" fill="currentColor" opacity=".7" />
        <rect x="9" y="17" width="3" height="3" fill="currentColor" opacity=".5" />
        <rect x="15" y="20" width="3" height="3" fill="currentColor" opacity=".35" />
        <rect x="9" y="23" width="3" height="3" fill="currentColor" opacity=".2" />
        {/* resolved mountain + sun */}
        <circle cx="27" cy="15" r="2" fill="var(--signal)" />
        <path d="M19 28 L24 20 L28 25 L31 22 L31 28 Z" fill="currentColor" />
        {/* teal scan line */}
        <line x1="7" y1="20" x2="33" y2="20" stroke="var(--teal)" strokeWidth="1.2" />
      </svg>
      <span className="font-display text-lg tracking-tight">Pickture</span>
    </span>
  );
}
