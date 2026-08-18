import type { Category, Product } from "../types";

export const initialCategories: Category[] = [
  { id: "batidinhas", name: "Batidinhas", active: true },
  { id: "combos", name: "Combos", active: true },
  { id: "adicionais", name: "Adicionais", active: true },
];

export const initialProducts: Product[] = [
  {
    id: "batidinha-morango",
    categoryId: "batidinhas",
    name: "Batidinha de Morango",
    description: "Cremosa, gelada e preparada na hora. Garrafa de vidro de 300 ml.",
    price: 15,
    imageUrl: "images/batidinha-morango.webp",
    active: true,
  },
  {
    id: "batidinha-maracuja",
    categoryId: "batidinhas",
    name: "Batidinha de Maracujá",
    description: "Cremosa e equilibrada com o azedinho do maracujá. Garrafa de 300 ml.",
    price: 15,
    imageUrl: "images/batidinha-maracuja.webp",
    active: true,
  },
  {
    id: "batidinha-pacoca",
    categoryId: "batidinhas",
    name: "Batidinha de Paçoca",
    description: "Cremosa, refrescante e preparada com paçoca selecionada. Garrafa de 300 ml.",
    price: 15,
    imageUrl: "images/batidinha-pacoca.webp",
    active: true,
  },
  {
    id: "combo-dupla",
    categoryId: "combos",
    name: "Combo Dupla do Rick",
    description: "Duas batidinhas de 300 ml. Escolha entre os sabores disponíveis.",
    price: 28,
    imageUrl: "images/batidinha-morango.webp",
    active: true,
  },
];
