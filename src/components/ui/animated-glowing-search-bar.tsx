// 21st.dev component: "Animated Glowing Search Bar" (adapted).
// The source was a fixed-size search input wrapped in a rotating
// conic-gradient glow. Adapted here into a reusable WRAPPER that puts the
// same animated glow around an arbitrary block (the Browse filter section),
// recolored from the original pink/purple to Pickture's brand: teal
// (#1F6F6F) and signal blue (#2952E3). The glow sits calm at rest and
// sweeps around when any control inside is hovered or focused.
import React from "react";

// Shared conic-gradient + rotation behaviour for each glow layer.
const rotate =
  "before:absolute before:content-[''] before:w-[1400px] before:h-[1400px] " +
  "before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 " +
  "before:rotate-[60deg] before:transition-transform before:duration-[2000ms] " +
  "group-hover:before:rotate-[-60deg] group-focus-within:before:rotate-[420deg] " +
  "group-focus-within:before:duration-[4000ms]";

export function GlowingSearchBorder({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group rounded-xl">
      {/* wide, soft brand-colored halo */}
      <div
        aria-hidden
        className={
          "pointer-events-none absolute -inset-[3px] overflow-hidden rounded-xl blur-[6px] " +
          "before:bg-[conic-gradient(transparent,#1F6F6F_8%,transparent_28%,transparent_52%,#2952E3_60%,transparent_82%)] " +
          rotate
        }
      />
      {/* tighter, brighter rim */}
      <div
        aria-hidden
        className={
          "pointer-events-none absolute -inset-[1px] overflow-hidden rounded-xl blur-[1.5px] " +
          "before:brightness-125 before:bg-[conic-gradient(transparent,#1F6F6F_8%,transparent_24%,transparent_52%,#2952E3_60%,transparent_78%)] " +
          rotate
        }
      />
      {/* content sits on top with its own opaque background */}
      <div className="relative">{children}</div>
    </div>
  );
}

export default GlowingSearchBorder;
