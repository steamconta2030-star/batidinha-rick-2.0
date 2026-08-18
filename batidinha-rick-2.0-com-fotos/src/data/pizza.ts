import type { PizzaFlavor, PizzaOption, PizzaSize } from "../types";

export const initialSizes: PizzaSize[] = [
  { id: "individual", name: "Individual 300 ml", slices: 1, maxFlavors: 1, basePrice: 15, active: true },
  { id: "dupla", name: "Dupla 600 ml", slices: 2, maxFlavors: 2, basePrice: 28, active: true },
  { id: "familia", name: "Família 1,2 L", slices: 4, maxFlavors: 3, basePrice: 54, active: true },
];
export const initialFlavors: PizzaFlavor[] = [
  { id: "morango", name: "Morango", ingredients: "Doce, cremosa e gelada", priceBySize: { individual: 15, dupla: 28, familia: 54 }, active: true },
  { id: "maracuja", name: "Maracujá", ingredients: "Cremosa com o azedinho da fruta", priceBySize: { individual: 15, dupla: 28, familia: 54 }, active: true },
  { id: "pacoca", name: "Paçoca", ingredients: "Cremosa e preparada com paçoca selecionada", priceBySize: { individual: 15, dupla: 28, familia: 54 }, active: true },
  { id: "acai", name: "Açaí", ingredients: "Em breve no cardápio", priceBySize: { individual: 15, dupla: 28, familia: 54 }, active: false },
];
export const initialCrusts: PizzaOption[] = [
  { id: "tradicional", name: "Receita tradicional", price: 0, active: true },
  { id: "menos-doce", name: "Menos doce", price: 0, active: true },
  { id: "extra-gelada", name: "Extra gelada", price: 0, active: true },
];
export const initialExtras: PizzaOption[] = [
  { id: "leite-condensado", name: "Leite condensado", price: 2, active: true },
  { id: "granola", name: "Granola", price: 2, active: true },
  { id: "fruta-extra", name: "Fruta extra", price: 3, active: true },
];
