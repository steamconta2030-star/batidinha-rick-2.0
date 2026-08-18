import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { initialCouriers } from "../data/delivery";
import { usePersistentState } from "./usePersistentState";
import type { Courier, Order, OrderStatus } from "../types";

export function useOnlineOrders() {
  const [orders, setOrders] = usePersistentState<Order[]>("batidinha:orders", []);
  const [couriers, setCouriers] = usePersistentState<Courier[]>("batidinha:admin:couriers", initialCouriers);
  const [error, setError] = useState("");
  const [newOrderId, setNewOrderId] = useState("");

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const [{ data: orderRows, error: orderError }, { data: courierRows }] = await Promise.all([
      supabase.from("orders").select("id,number,customer_name,phone,delivery_type,address,payment_method,change_for,notes,subtotal,delivery_fee,total,status,courier_id,created_at,order_items(id,name,detail,quantity,unit_price)").order("created_at", { ascending: false }).limit(200),
      supabase.from("couriers").select("id,name,phone,vehicle,active").order("name"),
    ]);
    if (orderError) { setError("Não foi possível carregar os pedidos desta conta."); return; }
    setError("");
    setOrders((orderRows ?? []).map((row) => ({
      id: row.id, number: Number(row.number), customerName: row.customer_name, phone: row.phone,
      deliveryType: row.delivery_type as Order["deliveryType"], address: row.address ?? "",
      paymentMethod: row.payment_method as Order["paymentMethod"], changeFor: row.change_for ? Number(row.change_for) : undefined,
      notes: row.notes, subtotal: Number(row.subtotal), deliveryFee: Number(row.delivery_fee), total: Number(row.total),
      status: row.status as OrderStatus, courierId: row.courier_id ?? undefined, createdAt: row.created_at,
      items: (row.order_items ?? []).map((item) => ({ id: item.id, name: item.name, detail: item.detail, quantity: item.quantity, price: Number(item.unit_price) })),
    })));
    setCouriers((courierRows ?? []).map((row) => ({ id: row.id, name: row.name, phone: row.phone, vehicle: row.vehicle, active: row.active })));
  }, []);

  useEffect(() => {
    refresh();
    const client = supabase;
    if (!client) return;
    const channel = client.channel(`batidinha-orders-${crypto.randomUUID()}`).on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
      if (payload.eventType === "INSERT") {
        const id = String((payload.new as { id?: string }).id ?? "");
        setNewOrderId(id);
        document.title = "🔔 Novo pedido • Batidinha";
        try {
          const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (AudioContextClass) {
            const audio = new AudioContextClass(); const oscillator = audio.createOscillator(); const gain = audio.createGain();
            oscillator.connect(gain); gain.connect(audio.destination); oscillator.frequency.value = 880; gain.gain.value = 0.08;
            oscillator.start(); oscillator.stop(audio.currentTime + 0.22);
          }
        } catch { /* Alguns navegadores exigem interação antes de liberar áudio. */ }
        window.setTimeout(() => { setNewOrderId(""); document.title = "Batidinha do Rick"; }, 8000);
      }
      refresh();
    }).subscribe();
    return () => { client.removeChannel(channel); };
  }, [refresh]);

  async function updateStatus(id: string, status: OrderStatus) {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
    if (!supabase) return;
    const { error: updateError } = await supabase!.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (updateError) { setError("Não foi possível atualizar o pedido."); refresh(); }
  }

  async function assignCourier(id: string, courierId: string) {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, courierId: courierId || undefined } : order));
    if (!supabase) return;
    const { error: updateError } = await supabase!.from("orders").update({ courier_id: courierId || null, updated_at: new Date().toISOString() }).eq("id", id);
    if (updateError) { setError("Não foi possível atribuir o entregador."); refresh(); }
  }

  return { orders, couriers, error, newOrderId, updateStatus, assignCourier, refresh };
}
