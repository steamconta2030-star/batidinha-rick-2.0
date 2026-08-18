import { useEffect, useMemo, useState } from "react";
import { Check, CircleDollarSign, Plus, Settings2 } from "lucide-react";
import { initialCrusts, initialFlavors } from "../data/pizza";
import { useOnlineMenu } from "../hooks/useOnlineMenu";
import { usePersistentState } from "../hooks/usePersistentState";
import { supabase } from "../lib/supabase";
import type { PizzaFlavor, PizzaOption, PizzaSize } from "../types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function PizzaSettings() {
  const onlineMenu = useOnlineMenu();
  const sizes = onlineMenu.sizes;
  const [extras, setExtras] = usePersistentState<PizzaOption[]>("batidinha:admin:extras", onlineMenu.extras);
  const [flavors, setFlavors] = usePersistentState<PizzaFlavor[]>("batidinha:admin:flavors", initialFlavors);
  const [crusts, setCrusts] = usePersistentState<PizzaOption[]>("batidinha:admin:preparations", initialCrusts);
  const [selectedSize, setSelectedSize] = useState("individual");
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>(["morango"]);
  const [selectedCrust, setSelectedCrust] = useState("tradicional");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const size = sizes.find((item) => item.id === selectedSize) ?? sizes[0];
  const chosenFlavors = flavors.filter((flavor) => selectedFlavors.includes(flavor.id));
  const flavorPrice = Math.max(size.basePrice, ...chosenFlavors.map((flavor) => flavor.priceBySize[selectedSize] ?? size.basePrice));
  const crustPrice = crusts.find((crust) => crust.id === selectedCrust)?.price ?? 0;
  const extrasPrice = extras.filter((extra) => selectedExtras.includes(extra.id)).reduce((sum, extra) => sum + extra.price, 0);
  const total = flavorPrice + crustPrice + extrasPrice;
  const summary = useMemo(() => chosenFlavors.map((flavor) => flavor.name).join(" + "), [chosenFlavors]);

  useEffect(() => {
    if (!onlineMenu.online) return;
    setFlavors(onlineMenu.flavors);
    setCrusts(onlineMenu.crusts);
    setExtras(onlineMenu.extras);
  }, [onlineMenu.extras, onlineMenu.flavors, onlineMenu.crusts, onlineMenu.online, setCrusts, setExtras, setFlavors]);
  useEffect(() => {
    if (!sizes.some((item) => item.id === selectedSize)) setSelectedSize(sizes.find((item) => item.name === "Grande")?.id ?? sizes[0]?.id ?? "");
    if (!crusts.some((item) => item.id === selectedCrust)) setSelectedCrust(crusts.find((item) => item.name.includes("tradicional"))?.id ?? crusts[0]?.id ?? "");
    setSelectedFlavors((current) => current.filter((id) => flavors.some((flavor) => flavor.id === id)).slice(0, size.maxFlavors));
  }, [crusts, flavors, selectedCrust, selectedSize, size.maxFlavors, sizes]);

  function chooseFlavor(id: string) {
    setSelectedFlavors((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length >= size.maxFlavors ? [...current.slice(1), id] : [...current, id]);
  }
  async function addFlavor() {
    const name = window.prompt("Nome do novo sabor:")?.trim(); if (!name) return;
    const ingredients = window.prompt("Ingredientes principais:")?.trim() ?? "";
    const priceBySize = Object.fromEntries(sizes.map((item) => [item.id, item.basePrice]));
    if (!supabase) {
      setFlavors((current) => [...current, { id: crypto.randomUUID(), name, ingredients, priceBySize, active: true }]);
      return;
    }
    const { data, error } = await supabase.from("pizza_flavors").insert({ store_id: "10000000-0000-4000-8000-000000000001", name, ingredients, position: flavors.length, active: true }).select("id,name,ingredients,active").single();
    if (error || !data) return;
    await supabase.from("pizza_flavor_prices").insert(sizes.map((item) => ({ flavor_id: data.id, size_id: item.id, price: item.basePrice })));
    setFlavors((current) => [...current, { id: data.id, name: data.name, ingredients: data.ingredients, priceBySize, active: data.active }]);
  }
  async function addCrust() {
    const name = window.prompt("Nome do novo preparo:")?.trim(); if (!name) return;
    const price = Number(window.prompt("Acréscimo do preparo:", "8")?.replace(",", ".") ?? 0);
    if (!supabase) {
      setCrusts((current) => [...current, { id: crypto.randomUUID(), name, price: Number.isFinite(price) ? price : 0, active: true }]);
      return;
    }
    const { data } = await supabase.from("pizza_options").insert({ store_id: "10000000-0000-4000-8000-000000000001", type: "crust", name, price: Number.isFinite(price) ? price : 0, position: crusts.length, active: true }).select("id,name,price,active").single();
    if (data) setCrusts((current) => [...current, { id: data.id, name: data.name, price: Number(data.price), active: data.active }]);
  }
  async function addExtra() {
    const name = window.prompt("Nome do novo adicional:")?.trim(); if (!name) return;
    const price = Number(window.prompt("Valor do adicional:", "2")?.replace(",", ".") ?? 0);
    const safePrice = Number.isFinite(price) && price >= 0 ? price : 0;
    if (!supabase) {
      setExtras((current) => [...current, { id: crypto.randomUUID(), name, price: safePrice, active: true }]);
      return;
    }
    const { data } = await supabase.from("pizza_options").insert({ store_id: "10000000-0000-4000-8000-000000000001", type: "extra", name, price: safePrice, position: extras.length, active: true }).select("id,name,price,active").single();
    if (data) setExtras((current) => [...current, { id: data.id, name: data.name, price: Number(data.price), active: data.active }]);
  }

  return <section className="content pizza-settings">
    <div className="title-row"><div><p className="eyebrow">CONFIGURAÇÃO DAS BATIDINHAS</p><h1>Personalização das batidinhas</h1><p>Defina quantidades, sabores, preparo e adicionais do cardápio.</p></div><div className="title-actions"><button onClick={addExtra}><Plus size={18} /> Adicional</button><button className="primary" onClick={addFlavor}><Plus size={18} /> Novo sabor</button></div></div>
    <div className="settings-grid"><div className="settings-column">
      <article className="settings-card"><header><div><span className="step-number">1</span><div><h2>Tamanhos</h2><p>Quantidade de unidades e sabores permitidos.</p></div></div></header><div className="size-list">{sizes.map((item) => <button key={item.id} className={selectedSize === item.id ? "selected" : ""} onClick={() => { setSelectedSize(item.id); setSelectedFlavors((current) => current.slice(0, item.maxFlavors)); }}><strong>{item.name}</strong><span>{item.slices} unidades • até {item.maxFlavors} sabor{item.maxFlavors > 1 ? "es" : ""}</span><small>A partir de {money.format(item.basePrice)}</small></button>)}</div></article>
      <article className="settings-card"><header><div><span className="step-number">2</span><div><h2>Sabores</h2><p>Selecione até {size.maxFlavors} para testar.</p></div></div><button className="icon-action" onClick={addFlavor}><Plus size={17} /></button></header><div className="flavor-list">{flavors.filter((flavor) => flavor.active).map((flavor) => { const selected = selectedFlavors.includes(flavor.id); return <button key={flavor.id} className={selected ? "selected" : ""} onClick={() => chooseFlavor(flavor.id)}><span className="check">{selected && <Check size={14} />}</span><div><strong>{flavor.name}</strong><small>{flavor.ingredients}</small></div><b>{money.format(flavor.priceBySize[selectedSize] ?? size.basePrice)}</b></button>; })}</div></article>
      <article className="settings-card"><header><div><span className="step-number">3</span><div><h2>Preparo e adicionais</h2><p>Preferências de preparo e complementos com acréscimo.</p></div></div><button className="icon-action" onClick={addCrust}><Plus size={17} /></button></header><div className="option-chips">{crusts.filter((item) => item.active).map((item) => <button key={item.id} className={selectedCrust === item.id ? "selected" : ""} onClick={() => setSelectedCrust(item.id)}>{item.name}<small>{item.price ? `+ ${money.format(item.price)}` : "Incluso"}</small></button>)}</div><div className="option-chips extras">{extras.filter((item) => item.active).map((item) => <button key={item.id} className={selectedExtras.includes(item.id) ? "selected" : ""} onClick={() => setSelectedExtras((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}>{item.name}<small>+ {money.format(item.price)}</small></button>)}</div></article>
    </div><aside className="simulator"><div className="simulator-heading"><Settings2 size={19} /><span>SIMULADOR DO PEDIDO</span></div><div className="pizza-visual"><div>{chosenFlavors.length > 1 && <i />}</div><span>{chosenFlavors.length} sabor{chosenFlavors.length === 1 ? "" : "es"}</span></div><div className="simulation-summary"><span>Batidinha {size.name}</span><h2>{summary || "Escolha um sabor"}</h2><p>{crusts.find((item) => item.id === selectedCrust)?.name}</p>{selectedExtras.length > 0 && <p>{extras.filter((item) => selectedExtras.includes(item.id)).map((item) => item.name).join(", ")}</p>}</div><div className="price-rule"><CircleDollarSign size={18} /><div><strong>Regra de preço</strong><span>Nas combinações, o preço segue a opção selecionada.</span></div></div><div className="price-breakdown"><p><span>Sabores</span><b>{money.format(flavorPrice)}</b></p><p><span>Preparo</span><b>{money.format(crustPrice)}</b></p><p><span>Adicionais</span><b>{money.format(extrasPrice)}</b></p><footer><span>Total</span><strong>{money.format(total)}</strong></footer></div></aside></div>
  </section>;
}
