export function Logo({ size = 28 }: { size?: number }) {
  // The approved generated artwork is 1721×914. These values crop its
  // 1263×295 logo lockup without altering or redrawing the design.
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden align-middle"
      style={{ width: size * (1263 / 295), height: size }}
    >
      <img
        src="/branding/pickture-logo-concept-v2.png"
        alt="Pickture"
        draggable={false}
        className="pointer-events-none absolute max-w-none select-none"
        style={{
          width: size * (1721 / 295),
          height: size * (914 / 295),
          left: -size * (266 / 295),
          top: -size * (282 / 295),
        }}
      />
    </span>
  );
}
