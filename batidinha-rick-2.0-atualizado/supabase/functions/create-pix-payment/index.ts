import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { orderId, payerEmail } = await req.json();
    if (!orderId || !payerEmail) return json({ error: "orderId e payerEmail são obrigatórios" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) return json({ error: "Mercado Pago não configurado" }, 503);

    const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id,total,payment_status,provider_payment_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) return json({ error: "Pedido não encontrado" }, 404);
    if (order.payment_status === "paid") return json({ error: "Pedido já está pago" }, 409);

    if (order.provider_payment_id) {
      const existing = await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(order.provider_payment_id)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (existing.ok) return json(await existing.json(), 200);
    }

    const idempotencyKey = `batidinha-pix-${order.id}`;
    const mpResponse = await fetch("https://api.mercadopago.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        type: "online",
        total_amount: Number(order.total).toFixed(2),
        external_reference: order.id,
        processing_mode: "automatic",
        transactions: {
          payments: [{
            amount: Number(order.total).toFixed(2),
            payment_method: { id: "pix", type: "bank_transfer" },
            expiration_time: "PT30M",
          }],
        },
        payer: { email: payerEmail },
      }),
    });

    const mpOrder = await mpResponse.json();
    if (!mpResponse.ok) return json({ error: "Falha ao criar Pix", provider: mpOrder }, mpResponse.status);

    const providerId = mpOrder.id;
    const { error: updateError } = await admin.from("orders").update({
      payment_provider: "mercado_pago",
      payment_status: "pending",
      provider_payment_id: providerId,
      payment_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }).eq("id", order.id);

    if (updateError) return json({ error: "Pix criado, mas não foi possível vincular a cobrança ao pedido" }, 500);

    const payment = mpOrder?.transactions?.payments?.[0];
    return json({
      providerOrderId: providerId,
      status: mpOrder.status,
      statusDetail: mpOrder.status_detail,
      ticketUrl: payment?.payment_method?.ticket_url ?? null,
      qrCode: payment?.payment_method?.qr_code ?? null,
      qrCodeBase64: payment?.payment_method?.qr_code_base64 ?? null,
    }, 201);
  } catch (error) {
    console.error(error);
    return json({ error: "Erro interno ao criar pagamento" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
