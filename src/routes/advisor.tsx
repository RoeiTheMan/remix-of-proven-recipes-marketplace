import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { findBestPrompts, type AdvisorResponse } from "@/services/advisorService";
import { MatchResultCard } from "@/components/MatchResultCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LoaderCircle, Mic, Square, Volume2, VolumeX } from "lucide-react";
import { BrandLottie } from "@/components/BrandLottie";
import aiThinking from "@/assets/lottie/ai-thinking";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/advisor")({
  head: () => ({
    meta: [
      { title: "Advisor — Pickture" },
      {
        name: "description",
        content: "Describe the visual you need; we match it to verified recipes.",
      },
    ],
  }),
  component: Advisor,
});

function Advisor() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<AdvisorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [queryError, setQueryError] = useState("");
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "transcribing">(
    "idle",
  );
  const [speechState, setSpeechState] = useState<"idle" | "loading" | "speaking">("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  function releaseMicrophone() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    recordingTimeoutRef.current = null;
  }

  function stopSpeech() {
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
    setSpeechState("idle");
  }

  useEffect(
    () => () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      if (audioRef.current) audioRef.current.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    },
    [],
  );

  async function transcribeAudio(audio: Blob) {
    setRecordingState("transcribing");
    try {
      const extension = audio.type.includes("mp4")
        ? "mp4"
        : audio.type.includes("ogg")
          ? "ogg"
          : "webm";
      const form = new FormData();
      form.append("file", audio, `advisor-recording.${extension}`);
      const { data, error } = await supabase.functions.invoke<{ text?: string }>(
        "advisor-transcribe",
        { body: form },
      );
      if (error) throw error;
      const transcript = data?.text?.trim();
      if (!transcript) throw new Error("No speech was detected. Please try again.");
      setQuery(transcript);
      setQueryError("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not transcribe the recording");
    } finally {
      setRecordingState("idle");
    }
  }

  async function toggleRecording() {
    if (recordingState === "recording") {
      if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Voice input is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const supportedType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = new MediaRecorder(stream, supportedType ? { mimeType: supportedType } : {});
      const chunks: Blob[] = [];
      let failed = false;

      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = () => {
        failed = true;
        releaseMicrophone();
        setRecordingState("idle");
        toast.error("The recording stopped unexpectedly. Please try again.");
      };
      recorder.onstop = () => {
        const audio = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        releaseMicrophone();
        if (failed) return;
        if (audio.size === 0) {
          setRecordingState("idle");
          toast.error("No audio was recorded. Please try again.");
          return;
        }
        void transcribeAudio(audio);
      };
      recorder.start();
      setRecordingState("recording");
      recordingTimeoutRef.current = setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, 30_000);
    } catch {
      releaseMicrophone();
      setRecordingState("idle");
      toast.error("Allow microphone access to use voice search.");
    }
  }

  async function speakSummary() {
    if (speechState === "speaking") {
      stopSpeech();
      return;
    }
    const text = response?.summary?.trim();
    if (!text) return;

    setSpeechState("loading");
    try {
      const { data, error } = await supabase.functions.invoke<Blob>("advisor-speak", {
        body: { text },
      });
      if (error) throw error;
      if (!(data instanceof Blob) || data.size === 0) throw new Error("No audio was returned.");

      const audioUrl = URL.createObjectURL(new Blob([data], { type: "audio/mpeg" }));
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audioUrlRef.current = audioUrl;
      audio.onended = stopSpeech;
      audio.onerror = () => {
        stopSpeech();
        toast.error("Could not play the Advisor summary.");
      };
      await audio.play();
      setSpeechState("speaking");
    } catch (error) {
      stopSpeech();
      toast.error(error instanceof Error ? error.message : "Could not create the spoken summary");
    }
  }

  async function run() {
    if (!query.trim()) {
      setQueryError("Describe the visual you need first.");
      return;
    }
    stopSpeech();
    setQueryError("");
    setLoading(true);
    setResponse(null);
    try {
      setResponse(await findBestPrompts(query));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not load Advisor recommendations",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <span className="label-eyebrow">Advisor · Prompt Match Score</span>
      <h1 className="font-display text-5xl mt-3">Describe the visual you need.</h1>
      <p className="text-neutral-gray mt-3">
        We rank verified recipes by match score, consistency, model fit, license fit, price, and
        rating.
      </p>

      <div className="mt-8 flex gap-2">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (queryError && e.target.value.trim()) setQueryError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Example: cinematic sneaker campaign, moody light, commercial license, under $15"
          maxLength={500}
          aria-invalid={!!queryError}
          aria-describedby={queryError ? "advisor-query-error" : undefined}
          className="h-12 text-base"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={recordingState === "recording" ? "teal" : "outline"}
                size="icon"
                disabled={recordingState === "transcribing" || loading}
                onClick={toggleRecording}
                aria-label={recordingState === "recording" ? "Stop recording" : "Use voice search"}
                className="h-12 w-12"
              >
                {recordingState === "recording" ? (
                  <Square />
                ) : recordingState === "transcribing" ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Mic />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {recordingState === "recording" ? "Stop recording" : "Describe it by voice"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button size="lg" onClick={run} disabled={loading} className="h-12 min-w-52">
          Find My Best Recipe
        </Button>
      </div>
      {queryError && (
        <p id="advisor-query-error" role="alert" className="mt-2 text-sm text-destructive">
          {queryError}
        </p>
      )}
      {recordingState !== "idle" && (
        <p className="mt-2 text-sm text-neutral-gray" aria-live="polite">
          {recordingState === "recording"
            ? "Recording... click the microphone to stop."
            : "Transcribing..."}
        </p>
      )}

      <div className="mt-10">
        {loading && (
          <div className="border border-border bg-card p-10 text-center flex flex-col items-center gap-2">
            <BrandLottie animationData={aiThinking} loop style={{ height: 48, width: 160 }} />
            <span className="label-eyebrow">Matching verified recipes…</span>
          </div>
        )}
        {!loading && response && (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="label-eyebrow">
                  {response.source === "gemini"
                    ? "Gemini-ranked matches"
                    : "Pickture score matches"}
                </span>
                {response.summary && (
                  <p className="text-sm text-neutral-gray mt-1">{response.summary}</p>
                )}
              </div>
              {response.summary && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={speakSummary}
                  disabled={speechState === "loading"}
                  className="shrink-0"
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
                      ? "Stop audio"
                      : "Listen to summary"}
                </Button>
              )}
            </div>
            {response.results.map((result) => (
              <MatchResultCard key={result.listing.id} result={result} />
            ))}
            {response.results.length === 0 && (
              <p className="text-neutral-gray">No matches. Try broadening your description.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
