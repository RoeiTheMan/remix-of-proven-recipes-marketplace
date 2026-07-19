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
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
const MAX_TEXT_LENGTH = 1_000;
const MAX_REQUESTS_PER_MINUTE = 6;
const requestWindows = new Map<string, { count: number; resetAt: number }>();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
    // Logging must never block speech generation.
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (!isRecord(body) || typeof body.text !== "string")
    return json({ error: "text_required" }, 400);
  const text = body.text.trim();
  if (!text || text.length > MAX_TEXT_LENGTH) return json({ error: "text_length_invalid" }, 400);

  const voiceId = Deno.env.get("ELEVENLABS_VOICE_ID") ?? DEFAULT_VOICE_ID;
  const authorization = request.headers.get("Authorization");
  try {
    const providerResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": elevenLabsKey, "Content-Type": "application/json" },
        body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
      },
    );
    if (!providerResponse.ok) throw new Error(`elevenlabs_tts_failed:${providerResponse.status}`);

    const audio = await providerResponse.arrayBuffer();
    if (audio.byteLength === 0) throw new Error("elevenlabs_audio_empty");
    await logVoiceEvent(supabaseUrl, anonKey, authorization, "voice_usage", {
      provider: "elevenlabs",
      action: "text_to_speech",
      model: "eleven_multilingual_v2",
      text_length: text.length,
      audio_bytes: audio.byteLength,
    });
    return new Response(audio, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/octet-stream",
        "Cache-Control": "no-store",
        "X-Audio-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    await logVoiceEvent(supabaseUrl, anonKey, authorization, "api_failure", {
      provider: "elevenlabs",
      feature: "advisor_text_to_speech",
      reason: error instanceof Error ? error.message.slice(0, 120) : "unknown_error",
    });
    return json({ error: "speech_generation_failed" }, 502);
  }
});
