import { Lock } from "lucide-react";

export function RecipePreviewLock({ preview }: { preview: string }) {
  return (
    <div className="relative border border-border bg-secondary p-5">
      <pre className="whitespace-pre-wrap font-mono text-sm text-ink/80 select-none blur-[1.5px]">{preview}</pre>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-warm/70 backdrop-blur-[2px] gap-2">
        <Lock className="h-5 w-5 text-ink" />
        <p className="text-sm text-ink font-medium">Unlock the full recipe by purchasing.</p>
      </div>
    </div>
  );
}
