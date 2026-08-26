import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function validateSignature(req: Request, dataId: string) {
  const secret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
  if (!secret) return false;

  const signatureHeader = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(signatureHeader.split(",").map((part) => part.trim().split("=")).filter((item) => item.length === 2));
  const ts = parts.ts;
  const received = parts.v1;
  if (!ts || !received || !requestId) return false;

  const timestamp = Number(ts);
  if (!Number.isFinite(timestamp)) return false;
  const ageMs = Math.abs(Date.now() - timestamp * 1000);
  if (ageMs > 10 * 60 * 1000) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = await hmacHex(secret, manifest);
  return timingSafeEqual(expected.toLowerCase(), received.toLowerCase());
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const webhookSecret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!accessToken || !webhookSecret) return new Response("Not configured", { status: 503 });

    const payload = await req.json().catch(() => ({}));
    const providerOrderId = String(payload?.data?.id ?? payload?.id ?? "");
    if (!providerOrderId) return new Response("Ignored", { status: 200 });

    if (!(await validateSignature(req, providerOrderId))) {
      return new Response("Invalid signature", { status: 401 });
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(providerOrderId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!mpResponse.ok) return new Response("Provider lookup failed", { status: 502 });

    const mpOrder = await mpResponse.json();
    const orderId = mpOrder.external_reference;
    if (!orderId) return new Response("Missing external reference", { status: 200 });

    const paid = mpOrder.status === "processed" && mpOrder.status_detail === "accredited";
    const failed = ["failed", "cancelled", "rejected"].includes(mpOrder.status);
    const paymentStatus = paid ? "paid" : failed ? "failed" : "pending";

    const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
    const changes: Record<string, unknown> = {
      payment_provider: "mercado_pago",
      provider_payment_id: String(mpOrder.id),
      payment_status: paymentStatus,
    };
    if (paid) changes.paid_at = new Date().toISOString();

    const { error } = await admin.from("orders").update(changes).eq("id", orderId).eq("provider_payment_id", String(mpOrder.id));
    if (error) {
      console.error(error);
      return new Response("Database update failed", { status: 500 });
    }

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("Internal error", { status: 500 });
  }
});
