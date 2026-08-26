import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!accessToken) return new Response("Not configured", { status: 503 });

    const payload = await req.json().catch(() => ({}));
    const providerOrderId = payload?.data?.id ?? payload?.id;
    if (!providerOrderId) return new Response("Ignored", { status: 200 });

    // Nunca confie no status recebido pelo webhook. Reconsulta a order diretamente no Mercado Pago.
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
