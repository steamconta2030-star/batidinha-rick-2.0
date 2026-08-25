import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Bike, MapPin, Plus, Power } from "lucide-react";
import { initialCouriers, initialZones } from "../data/delivery";
import { supabase } from "../lib/supabase";
import { usePersistentState } from "../hooks/usePersistentState";
import type { Courier, DeliveryZone } from "../types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const STORE_ID = "10000000-0000-4000-8000-000000000001";

export default function DeliverySettings() {
  const [zones, setZones] = usePersistentState<DeliveryZone[]>("batidinha:admin:zones", initialZones);
  const [couriers, setCouriers] = usePersistentState<Courier[]>("batidinha:admin:couriers", initialCouriers);
  const [formType, setFormType] = useState<"zone" | "courier" | null>(null);

  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.from("delivery_zones").select("id,neighborhood,fee,eta_minutes,active").order("neighborhood"),
      supabase.from("couriers").select("id,name,phone,vehicle,active").order("name"),
    ]).then(([zoneResult, courierResult]) => {
      if (zoneResult.data) setZones(zoneResult.data.map((row) => ({ id: row.id, neighborhood: row.neighborhood, fee: Number(row.fee), etaMinutes: row.eta_minutes, active: row.active })));
      if (courierResult.data) setCouriers(courierResult.data.map((row) => ({ id: row.id, name: row.name, phone: row.phone, vehicle: row.vehicle, active: row.active })));
    });
  }, [setCouriers, setZones]);

  async function saveLogistics(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (formType === "zone") {
      const neighborhood = String(form.get("neighborhood") ?? "").trim();
      const fee = Math.max(0, Number(form.get("fee")) || 0);
      const etaMinutes = Math.max(1, Number(form.get("eta")) || 45);
      if (!neighborhood) return;
      if (!supabase) { setZones((current) => [...current, { id: crypto.randomUUID(), neighborhood, fee, etaMinutes, active: true }]); setFormType(null); return; }
      const { data } = await supabase.from("delivery_zones").insert({ store_id: STORE_ID, neighborhood, fee, eta_minutes: etaMinutes, active: true }).select("id,neighborhood,fee,eta_minutes,active").single();
      if (data) { setZones((current) => [...current, { id: data.id, neighborhood: data.neighborhood, fee: Number(data.fee), etaMinutes: data.eta_minutes, active: data.active }]); setFormType(null); }
      return;
    }
    if (formType === "courier") {
      const name = String(form.get("name") ?? "").trim();
      const phone = String(form.get("phone") ?? "").trim();
      const vehicle = String(form.get("vehicle") ?? "Moto").trim();
      if (!name) return;
      if (!supabase) { setCouriers((current) => [...current, { id: crypto.randomUUID(), name, phone, vehicle, active: true }]); setFormType(null); return; }
      const { data } = await supabase.from("couriers").insert({ store_id: STORE_ID, name, phone, vehicle, active: true }).select("id,name,phone,vehicle,active").single();
      if (data) { setCouriers((current) => [...current, { id: data.id, name: data.name, phone: data.phone, vehicle: data.vehicle, active: data.active }]); setFormType(null); }
    }
  }

  async function toggleZone(zone: DeliveryZone) { setZones((current) => current.map((item) => item.id === zone.id ? { ...item, active: !item.active } : item)); await supabase?.from("delivery_zones").update({ active: !zone.active }).eq("id", zone.id); }
  async function toggleCourier(courier: Courier) { setCouriers((current) => current.map((item) => item.id === courier.id ? { ...item, active: !item.active } : item)); await supabase?.from("couriers").update({ active: !courier.active }).eq("id", courier.id); }

  return <>
    <section className="content delivery-settings"><div className="title-row"><div><p className="eyebrow">LOGÍSTICA</p><h1>Entrega e retirada</h1><p>Configure bairros, taxas e a equipe de entrega.</p></div></div><div className="delivery-columns"><article className="delivery-panel"><header><div><MapPin /><div><h2>Bairros atendidos</h2><p>Taxa e prazo estimado por região.</p></div></div><button className="primary" onClick={() => setFormType("zone")}><Plus size={16} /> Bairro</button></header><div className="zone-list">{zones.map((zone) => <div key={zone.id}><span className="zone-icon"><MapPin size={17} /></span><div><strong>{zone.neighborhood}</strong><small>Estimativa: {zone.etaMinutes} minutos</small></div><b>{zone.fee ? money.format(zone.fee) : "Grátis"}</b><button className={zone.active ? "toggle-on" : ""} aria-label={`${zone.active ? "Desativar" : "Ativar"} entrega em ${zone.neighborhood}`} onClick={() => toggleZone(zone)}><Power size={15} /></button></div>)}</div></article><article className="delivery-panel"><header><div><Bike /><div><h2>Entregadores</h2><p>Equipe disponível para os pedidos.</p></div></div><button className="primary" onClick={() => setFormType("courier")}><Plus size={16} /> Entregador</button></header><div className="courier-list">{couriers.map((courier) => <div key={courier.id}><span className="courier-avatar">{courier.name.slice(0, 1).toUpperCase()}</span><div><strong>{courier.name}</strong><small>{courier.vehicle}{courier.phone ? ` • ${courier.phone}` : ""}</small></div><span className={courier.active ? "courier-online" : "courier-offline"}>{courier.active ? "Disponível" : "Inativo"}</span><button className={courier.active ? "toggle-on" : ""} aria-label={`${courier.active ? "Desativar" : "Ativar"} ${courier.name}`} onClick={() => toggleCourier(courier)}><Power size={15} /></button></div>)}</div></article></div></section>
    {formType && <div className="modal-backdrop" onMouseDown={() => setFormType(null)}><form className="modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={saveLogistics}><p className="eyebrow">{formType === "zone" ? "NOVO BAIRRO" : "NOVO ENTREGADOR"}</p><h2>{formType === "zone" ? "Cadastrar área de entrega" : "Cadastrar entregador"}</h2>{formType === "zone" ? <><label>Bairro<input name="neighborhood" required autoFocus placeholder="Ex.: Veneza" /></label><div className="form-row"><label>Taxa de entrega<input name="fee" type="number" min="0" step="0.01" defaultValue="0" required /></label><label>Prazo estimado (minutos)<input name="eta" type="number" min="1" defaultValue="45" required /></label></div></> : <><label>Nome<input name="name" required autoFocus placeholder="Nome do entregador" /></label><div className="form-row"><label>Telefone<input name="phone" inputMode="tel" placeholder="(31) 99999-9999" /></label><label>Veículo<input name="vehicle" defaultValue="Moto" required /></label></div></>}<div className="modal-actions"><button type="button" onClick={() => setFormType(null)}>Cancelar</button><button className="primary" type="submit">Salvar</button></div></form></div>}
  </>;
}
