// Client-only Lottie player.
// lottie-react is CJS; under Vite/SSR its default export can arrive as a
// module-namespace object ("Element type is invalid" crash) and lottie-web
// touches the DOM at import time. Loading it dynamically on the client and
// unwrapping the double default fixes both.
import { useEffect, useState, type ComponentType, type CSSProperties } from "react";

interface LottieProps {
  animationData: object;
  loop?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function BrandLottie({ animationData, loop = true, className, style }: LottieProps) {
  const [Player, setPlayer] = useState<ComponentType<LottieProps> | null>(null);

  useEffect(() => {
    let mounted = true;
    import("lottie-react").then((mod) => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const resolved = ((mod.default as any)?.default ?? mod.default) as ComponentType<LottieProps>;
      if (mounted && typeof resolved === "function") setPlayer(() => resolved);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Reserve the space while (or if) the player can't load — layout stays stable.
  if (!Player) return <div className={className} style={style} aria-hidden />;
  return <Player animationData={animationData} loop={loop} className={className} style={style} />;
}
