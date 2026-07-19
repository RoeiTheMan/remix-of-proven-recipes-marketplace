import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { CircleHelp, LoaderCircle, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getSectionHelp, getSectionHelpNarration } from "@/content/sectionHelp";

type SpeechState = "idle" | "loading" | "speaking";

export function SectionHelp() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const content = useMemo(() => getSectionHelp(pathname), [pathname]);
  const [open, setOpen] = useState(false);
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const stopAudio = useCallback((updateState = true) => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (updateState) setSpeechState("idle");
  }, []);

  useEffect(() => {
    setOpen(false);
    stopAudio();
  }, [content?.id, stopAudio]);

  useEffect(() => () => stopAudio(false), [stopAudio]);

  async function toggleNarration() {
    if (!content) return;
    if (speechState === "speaking") {
      stopAudio();
      return;
    }

    setSpeechState("loading");
    try {
      const { data, error } = await supabase.functions.invoke<Blob>("advisor-speak", {
        body: { text: getSectionHelpNarration(content) },
      });
      if (error) throw error;
      if (!(data instanceof Blob) || data.size === 0) throw new Error("No audio was returned.");

      const audioUrl = URL.createObjectURL(new Blob([data], { type: "audio/mpeg" }));
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audioUrlRef.current = audioUrl;
      audio.onended = () => stopAudio();
      audio.onerror = () => {
        stopAudio();
        toast.error("Could not play this section's explanation.");
      };
      await audio.play();
      setSpeechState("speaking");
    } catch {
      stopAudio();
      toast.error("Could not create the spoken explanation. Please try again.");
    }
  }

  if (!content) return null;

  return (
    <div
      className={`${content.id === "advisor" ? "max-w-4xl" : "max-w-7xl"} relative z-30 mx-auto -mb-6 flex justify-end px-6 pt-4`}
    >
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) stopAudio();
        }}
      >
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 bg-background shadow-sm [&_svg]:size-5"
            aria-label={`How ${content.section} works`}
            title={`How ${content.section} works`}
          >
            <CircleHelp />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <span className="label-eyebrow text-teal">{content.section}</span>
            <DialogTitle className="font-display text-2xl">{content.title}</DialogTitle>
            <DialogDescription className="pt-2 text-left leading-relaxed">
              {content.description}
            </DialogDescription>
          </DialogHeader>

          <ol className="space-y-3 py-2">
            {content.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed">
                <span className="font-mono text-xs text-teal pt-0.5" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div className="border-t border-border pt-4">
            <Button
              variant="teal"
              onClick={toggleNarration}
              disabled={speechState === "loading"}
              aria-live="polite"
            >
              {speechState === "loading" ? (
                <LoaderCircle className="animate-spin" />
              ) : speechState === "speaking" ? (
                <VolumeX />
              ) : (
                <Volume2 />
              )}
              {speechState === "loading"
                ? "Preparing audio..."
                : speechState === "speaking"
                  ? "Stop reading"
                  : "Read this to me"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
