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
const FROM_ADDRESS = "Pickture <onboarding@resend.dev>";

type EmailType = "buyer_purchase_confirmation" | "creator_sale_notification";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Same privacy rule as the in-app creator dashboard: never expose the buyer's
// full identity to the creator.
function privacySafeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "A buyer";
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) return `${parts[0]} ${parts[1][0]}.`;
  if (trimmed.length <= 4) return trimmed;
  return `${trimmed.slice(0, Math.min(6, trimmed.length - 2))}…`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailShell(heading: string, bodyHtml: string): string {
  return `<div style="background:#FAF8F5;padding:32px 16px;font-family:Inter,Helvetica,Arial,sans-serif;color:#121212">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e5e1db;padding:32px">
    <p style="margin:0 0 24px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8A8A8A">Pickture</p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600">${heading}</h1>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #e5e1db;margin:24px 0" />
    <p style="margin:0;font-size:12px;color:#8A8A8A">Pickture — proven visuals, verified every time. This is a transactional message about your marketplace activity.</p>
  </div>
</div>`;
}

interface RestClient {
  url: string;
  serviceKey: string;
}

async function restGet(client: RestClient, path: string): Promise<unknown> {
  const response = await fetch(`${client.url}${path}`, {
    headers: { apikey: client.serviceKey, Authorization: `Bearer ${client.serviceKey}` },
  });
  if (!response.ok) throw new Error(`rest_get_failed:${response.status}:${path.split("?")[0]}`);
  return response.json();
}

async function restWrite(
  client: RestClient,
  method: "POST" | "PATCH",
  path: string,
  body: unknown,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  return fetch(`${client.url}${path}`, {
    method,
    headers: {
      apikey: client.serviceKey,
      Authorization: `Bearer ${client.serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
}

async function getUserEmail(client: RestClient, userId: string): Promise<string | null> {
  const response = await fetch(`${client.url}/auth/v1/admin/users/${userId}`, {
    headers: { apikey: client.serviceKey, Authorization: `Bearer ${client.serviceKey}` },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return isRecord(data) && typeof data.email === "string" ? data.email : null;
}

async function writeLog(
  client: RestClient,
  actorId: string,
  eventType: "email_sent" | "api_failure",
  level: "info" | "error",
  purchaseId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await restWrite(client, "POST", "/rest/v1/logs", {
      actor_id: actorId,
      event_type: eventType,
      entity_type: "purchase",
      entity_id: purchaseId,
      level,
      payload,
    });
  } catch {
    // Logging must never break email delivery reporting.
  }
}

// Claim the (purchase_id, email_type) slot before sending. The UNIQUE
// constraint makes double-sends impossible across refreshes and retries.
// Returns "claimed" when this invocation owns the send, "skip" when a
// previous invocation already sent (or is currently sending) this email.
async function claimEmailEvent(
  client: RestClient,
  purchaseId: string,
  emailType: EmailType,
  recipient: string,
): Promise<"claimed" | "skip"> {
  const insert = await restWrite(
    client,
    "POST",
    "/rest/v1/email_events",
    { purchase_id: purchaseId, email_type: emailType, recipient_email: recipient, status: "pending" },
    { Prefer: "return=representation,resolution=ignore-duplicates" },
  );
  if (!insert.ok) throw new Error(`email_event_insert_failed:${insert.status}`);
  const inserted = (await insert.json()) as unknown[];
  if (Array.isArray(inserted) && inserted.length > 0) return "claimed";

  // A row already existed. Only a failed (or long-abandoned pending) attempt
  // may be retried; the conditional PATCH decides the race winner.
  const rows = (await restGet(
    client,
    `/rest/v1/email_events?purchase_id=eq.${purchaseId}&email_type=eq.${emailType}&select=status,created_at`,
  )) as Array<{ status: string; created_at: string }>;
  const existing = rows[0];
  if (!existing || existing.status === "sent") return "skip";
  const abandoned =
    existing.status === "pending" &&
    Date.now() - new Date(existing.created_at).getTime() > 2 * 60_000;
  if (existing.status !== "failed" && !abandoned) return "skip";

  const patch = await restWrite(
    client,
    "PATCH",
    `/rest/v1/email_events?purchase_id=eq.${purchaseId}&email_type=eq.${emailType}&status=eq.${existing.status}`,
    { status: "pending", error: null },
    { Prefer: "return=representation" },
  );
  if (!patch.ok) return "skip";
  const patched = (await patch.json()) as unknown[];
  return Array.isArray(patched) && patched.length > 0 ? "claimed" : "skip";
}

async function markEmailEvent(
  client: RestClient,
  purchaseId: string,
  emailType: EmailType,
  status: "sent" | "failed",
  providerId: string | null,
  error: string | null,
): Promise<void> {
  await restWrite(
    client,
    "PATCH",
    `/rest/v1/email_events?purchase_id=eq.${purchaseId}&email_type=eq.${emailType}`,
    { status, provider_id: providerId, error },
  );
}

async function sendViaResend(
  resendKey: string,
  to: string,
  subject: string,
  html: string,
): Promise<{ ok: true; id: string | null } | { ok: false; error: string }> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      isRecord(data) && typeof data.message === "string" ? data.message : `status_${response.status}`;
    return { ok: false, error: message.slice(0, 200) };
  }
  return { ok: true, id: isRecord(data) && typeof data.id === "string" ? data.id : null };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!supabaseUrl || !serviceKey || !anonKey) return json({ error: "not_configured" }, 503);
  if (!resendKey) return json({ error: "email_not_configured" }, 503);

  // Identify the caller from their JWT. Only the buyer of the purchase may
  // trigger its emails; the recipient addresses are resolved server-side.
  const authorization = request.headers.get("Authorization");
  if (!authorization) return json({ error: "auth_required" }, 401);
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: authorization },
  });
  if (!userResponse.ok) return json({ error: "auth_invalid" }, 401);
  const caller = await userResponse.json();
  const callerId = isRecord(caller) && typeof caller.id === "string" ? caller.id : null;
  if (!callerId) return json({ error: "auth_invalid" }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const purchaseId = isRecord(body) && typeof body.purchaseId === "string" ? body.purchaseId : "";
  if (!/^[0-9a-f-]{36}$/i.test(purchaseId)) return json({ error: "purchase_id_invalid" }, 400);

  const client: RestClient = { url: supabaseUrl, serviceKey };

  try {
    const purchases = (await restGet(
      client,
      `/rest/v1/purchases?id=eq.${purchaseId}&select=id,buyer_id,listing_id,price_cents,status,listings(title,creator_id)`,
    )) as Array<{
      id: string;
      buyer_id: string;
      listing_id: string;
      price_cents: number;
      status: string;
      listings: { title: string; creator_id: string } | null;
    }>;
    const purchase = purchases[0];
    if (!purchase || !purchase.listings) return json({ error: "purchase_not_found" }, 404);
    if (purchase.buyer_id !== callerId) return json({ error: "forbidden" }, 403);
    if (purchase.status !== "completed") return json({ error: "purchase_not_completed" }, 409);

    const listingTitle = purchase.listings.title;
    const creatorId = purchase.listings.creator_id;
    const price = formatPrice(purchase.price_cents);

    const [buyerEmail, creatorEmail, profiles] = await Promise.all([
      getUserEmail(client, purchase.buyer_id),
      getUserEmail(client, creatorId),
      restGet(
        client,
        `/rest/v1/profiles?id=eq.${purchase.buyer_id}&select=display_name`,
      ) as Promise<Array<{ display_name: string }>>,
    ]);
    const buyerName = privacySafeName(profiles[0]?.display_name ?? "");

    const jobs: Array<{ type: EmailType; to: string | null; subject: string; html: string }> = [
      {
        type: "buyer_purchase_confirmation",
        to: buyerEmail,
        subject: `Your Pickture recipe is unlocked — ${listingTitle}`,
        html: emailShell(
          "Your recipe is unlocked",
          `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">You purchased <strong>${escapeHtml(listingTitle)}</strong> for <strong>${price}</strong>.</p>
           <p style="margin:0;font-size:14px;line-height:1.6">The full verified recipe — prompt, settings, and usage notes — is now available in your <strong>Purchases</strong> library in Pickture.</p>`,
        ),
      },
      {
        type: "creator_sale_notification",
        to: creatorEmail,
        subject: `You made a sale on Pickture — ${listingTitle}`,
        html: emailShell(
          "You made a sale",
          `<p style="margin:0 0 12px;font-size:14px;line-height:1.6"><strong>${escapeHtml(buyerName)}</strong> purchased <strong>${escapeHtml(listingTitle)}</strong> for <strong>${price}</strong>.</p>
           <p style="margin:0;font-size:14px;line-height:1.6">See your sales and reviews in the <strong>Creator</strong> dashboard in Pickture.</p>`,
        ),
      },
    ];

    const results: Record<string, string> = {};
    for (const job of jobs) {
      if (!job.to) {
        results[job.type] = "no_recipient";
        continue;
      }
      const claim = await claimEmailEvent(client, purchaseId, job.type, job.to);
      if (claim === "skip") {
        results[job.type] = "already_sent";
        continue;
      }
      const sent = await sendViaResend(resendKey, job.to, job.subject, job.html);
      if (sent.ok) {
        await markEmailEvent(client, purchaseId, job.type, "sent", sent.id, null);
        await writeLog(client, callerId, "email_sent", "info", purchaseId, {
          provider: "resend",
          email_type: job.type,
          listing_id: purchase.listing_id,
        });
        results[job.type] = "sent";
      } else {
        await markEmailEvent(client, purchaseId, job.type, "failed", null, sent.error);
        await writeLog(client, callerId, "api_failure", "error", purchaseId, {
          provider: "resend",
          email_type: job.type,
          reason: sent.error,
        });
        results[job.type] = "failed";
      }
    }

    return json({ results });
  } catch (error) {
    return json(
      { error: "email_send_failed", reason: error instanceof Error ? error.message.slice(0, 120) : "unknown" },
      500,
    );
  }
});
