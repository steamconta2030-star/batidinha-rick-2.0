import type { Courier, DeliveryZone } from "../types";
export const initialZones: DeliveryZone[] = [
  { id: "centro", neighborhood: "Centro", fee: 0, etaMinutes: 35, active: true },
  { id: "veneza", neighborhood: "Veneza", fee: 0, etaMinutes: 35, active: true },
  { id: "planalto", neighborhood: "Planalto", fee: 0, etaMinutes: 40, active: true },
  { id: "parque-das-aguas", neighborhood: "Parque das Águas", fee: 0, etaMinutes: 40, active: true },
  { id: "caravelas", neighborhood: "Caravelas", fee: 5, etaMinutes: 45, active: true },
  { id: "cidade-nova", neighborhood: "Cidade Nova", fee: 2, etaMinutes: 50, active: true },
];
export const initialCouriers: Courier[] = [
  { id: "entregador-1", name: "Entregador 1", phone: "", vehicle: "Moto", active: true },
];
