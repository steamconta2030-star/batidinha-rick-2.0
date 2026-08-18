import { useEffect, useState } from "react";
import { initialCategories, initialProducts } from "../data/catalog";
import { initialZones } from "../data/delivery";
import { initialCrusts, initialExtras, initialFlavors, initialSizes } from "../data/pizza";
import { supabase } from "../lib/supabase";
import type { Category, DeliveryZone, PizzaFlavor, PizzaOption, PizzaSize, Product } from "../types";

type MenuData = {
  categories: Category[];
  products: Product[];
  sizes: PizzaSize[];
  flavors: PizzaFlavor[];
  crusts: PizzaOption[];
  extras: PizzaOption[];
  zones: DeliveryZone[];
  storeOpen: boolean;
  minimumOrder: number;
  whatsapp: string;
  online: boolean;
};

const fallback: MenuData = {
  categories: initialCategories,
  products: initialProducts,
  sizes: initialSizes,
  flavors: initialFlavors,
  crusts: initialCrusts,
  extras: initialExtras,
  zones: initialZones,
  storeOpen: true,
  minimumOrder: 0,
  whatsapp: "31985011514",
  online: false,
};

function normalizePackaging(product: Product): Product {
  return { ...product, description: product.description.replace(/garrafa de vidro de/gi, "Garrafa de") };
}

function mergeLocalProducts(saved: Product[] | null): Product[] {
  if (!saved?.length) return initialProducts;
  const defaults = new Map(initialProducts.map((product) => [product.id, product]));
  const merged = saved.map((product) => {
    const currentDefault = defaults.get(product.id);
    if (product.id === "combo-dupla") return normalizePackaging({ ...product, imageUrl: "" });
    return normalizePackaging(currentDefault && !product.imageUrl ? { ...product, imageUrl: currentDefault.imageUrl } : product);
  });
  const savedIds = new Set(merged.map((product) => product.id));
  return [...merged, ...initialProducts.filter((product) => !savedIds.has(product.id))];
}

function getLocalFallback(): MenuData {
  try {
    const savedProducts = JSON.parse(window.localStorage.getItem("batidinha:admin:products") ?? "null") as Product[] | null;
    return {
      ...fallback,
      categories: JSON.parse(window.localStorage.getItem("batidinha:admin:categories") ?? "null") ?? initialCategories,
      products: mergeLocalProducts(savedProducts),
      zones: JSON.parse(window.localStorage.getItem("batidinha:admin:zones") ?? "null") ?? initialZones,
      flavors: JSON.parse(window.localStorage.getItem("batidinha:admin:flavors") ?? "null") ?? initialFlavors,
      crusts: JSON.parse(window.localStorage.getItem("batidinha:admin:preparations") ?? "null") ?? initialCrusts,
      extras: JSON.parse(window.localStorage.getItem("batidinha:admin:extras") ?? "null") ?? initialExtras,
      storeOpen: JSON.parse(window.localStorage.getItem("batidinha:admin:store-open") ?? "true"),
      minimumOrder: JSON.parse(window.localStorage.getItem("batidinha:admin:minimum-order") ?? "0"),
      whatsapp: JSON.parse(window.localStorage.getItem("batidinha:admin:whatsapp") ?? '"31985011514"'),
    };
  } catch {
    return fallback;
  }
}

export function useOnlineMenu() {
  const [data, setData] = useState<MenuData>(getLocalFallback);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    async function load() {
      const [storeResult, categoriesResult, productsResult, sizesResult, flavorsResult, pricesResult, optionsResult, zonesResult] = await Promise.all([
        supabase!.from("stores").select("accepting_orders,minimum_order,whatsapp").eq("slug", "batidinha-rick").single(),
        supabase!.from("categories").select("id,name,active").order("position"),
        supabase!.from("products").select("id,category_id,name,description,price,image_path,active").order("position"),
        supabase!.from("pizza_sizes").select("id,name,slices,max_flavors,base_price,active").order("position"),
        supabase!.from("pizza_flavors").select("id,name,ingredients,active").order("position"),
        supabase!.from("pizza_flavor_prices").select("flavor_id,size_id,price"),
        supabase!.from("pizza_options").select("id,type,name,price,active").order("position"),
        supabase!.from("delivery_zones").select("id,neighborhood,fee,eta_minutes,active").order("neighborhood"),
      ]);

      const failed = [storeResult, categoriesResult, productsResult, sizesResult, flavorsResult, pricesResult, optionsResult, zonesResult]
        .find((result) => result.error);
      if (failed?.error) throw failed.error;

      const categories: Category[] = (categoriesResult.data ?? []).map((row) => ({ id: row.id, name: row.name, active: row.active }));
      const products: Product[] = (productsResult.data ?? []).map((row) => normalizePackaging({
        id: row.id,
        categoryId: row.category_id,
        name: row.name,
        description: row.description,
        price: Number(row.price),
        imageUrl: row.image_path ? (/^https?:\/\//.test(row.image_path) || row.image_path.startsWith("images/") || row.image_path.startsWith("/") ? row.image_path : supabase!.storage.from("product-images").getPublicUrl(row.image_path).data.publicUrl) : "",
        active: row.active,
      }));
      const sizes: PizzaSize[] = (sizesResult.data ?? []).map((row) => ({
        id: row.id, name: row.name, slices: row.slices, maxFlavors: row.max_flavors, basePrice: Number(row.base_price), active: row.active,
      }));
      const prices = pricesResult.data ?? [];
      const flavors: PizzaFlavor[] = (flavorsResult.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        ingredients: row.ingredients,
        active: row.active,
        priceBySize: Object.fromEntries(prices.filter((price) => price.flavor_id === row.id).map((price) => [price.size_id, Number(price.price)])),
      }));
      const crusts: PizzaOption[] = (optionsResult.data ?? []).filter((row) => row.type === "crust").map((row) => ({ id: row.id, name: row.name, price: Number(row.price), active: row.active }));
      const extras: PizzaOption[] = (optionsResult.data ?? []).filter((row) => row.type === "extra").map((row) => ({ id: row.id, name: row.name, price: Number(row.price), active: row.active }));
      const zones: DeliveryZone[] = (zonesResult.data ?? []).map((row) => ({ id: row.id, neighborhood: row.neighborhood, fee: Number(row.fee), etaMinutes: row.eta_minutes, active: row.active }));

      if (active) setData({ categories, products, sizes, flavors, crusts, extras, zones, storeOpen: storeResult.data?.accepting_orders ?? true, minimumOrder: Number(storeResult.data?.minimum_order ?? 0), whatsapp: storeResult.data?.whatsapp ?? "", online: true });
    }

    load().catch((error) => console.error("Não foi possível carregar o cardápio online.", error));
    return () => { active = false; };
  }, []);

  return data;
}
