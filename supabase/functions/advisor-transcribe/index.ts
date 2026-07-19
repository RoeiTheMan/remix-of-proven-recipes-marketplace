declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const JSON_HEADERS = { ...CORS_HEADERS, "Content-Type": "application/json" };
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_REQUESTS_PER_MINUTE = 6;
const requestWindows = new Map<string, { count: number; resetAt: number }>();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const current = requestWindows.get(ip);
  if (!current || current.resetAt <= now) {
    requestWindows.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_MINUTE;
}

async function logVoiceEvent(
  supabaseUrl: string,
  anonKey: string,
  authorization: string | null,
  eventType: "voice_usage" | "api_failure",
  payload: Record<string, unknown>,
): Promise<void> {
  if (!authorization || authorization === `Bearer ${anonKey}`) return;
  try {
    await fetch(`${supabaseUrl}/rest/v1/rpc/log_event`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ _event_type: eventType, _payload: payload }),
    });
  } catch {
    // Logging must never block transcription.
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (isRateLimited(clientIp(request))) return json({ error: "rate_limit_exceeded" }, 429);

  const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!elevenLabsKey || !supabaseUrl || !anonKey)
    return json({ error: "voice_not_configured" }, 503);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "invalid_form_data" }, 400);
  }

  const audio = form.get("file");
  if (!(audio instanceof File) || audio.size === 0) return json({ error: "audio_required" }, 400);
  if (audio.size > MAX_AUDIO_BYTES) return json({ error: "audio_too_large" }, 413);
  if (audio.type && !audio.type.startsWith("audio/"))
    return json({ error: "audio_type_invalid" }, 415);

  const providerForm = new FormData();
  providerForm.append("file", audio, audio.name || "advisor-recording.webm");
  providerForm.append("model_id", "scribe_v2");
  providerForm.append("tag_audio_events", "false");
  providerForm.append("diarize", "false");

  const authorization = request.headers.get("Authorization");
  try {
    const providerResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": elevenLabsKey },
      body: providerForm,
    });
    if (!providerResponse.ok) throw new Error(`elevenlabs_stt_failed:${providerResponse.status}`);

    const providerBody: unknown = await providerResponse.json();
    const text =
      typeof providerBody === "object" && providerBody !== null && "text" in providerBody
        ? (providerBody as { text?: unknown }).text
        : undefined;
    if (typeof text !== "string" || !text.trim()) throw new Error("elevenlabs_transcript_empty");

    await logVoiceEvent(supabaseUrl, anonKey, authorization, "voice_usage", {
      provider: "elevenlabs",
      action: "speech_to_text",
      model: "scribe_v2",
      audio_bytes: audio.size,
      transcript_length: text.trim().length,
    });
    return json({ text: text.trim().slice(0, 500) });
  } catch (error) {
    await logVoiceEvent(supabaseUrl, anonKey, authorization, "api_failure", {
      provider: "elevenlabs",
      feature: "advisor_speech_to_text",
      reason: error instanceof Error ? error.message.slice(0, 120) : "unknown_error",
    });
    return json({ error: "transcription_failed" }, 502);
  }
});
