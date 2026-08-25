import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Banknote, Bike, ChefHat, ClipboardList, Cloud, CookingPot, CupSoda, Database, Eye, EyeOff, Flame, LayoutDashboard, PackagePlus, Pencil, Save, Search, Settings, Store, Tags } from "lucide-react";
import PizzaSettings from "./components/PizzaSettings";
import PublicMenu from "./components/PublicMenu";
import OrdersBoard from "./components/OrdersBoard";
import DeliverySettings from "./components/DeliverySettings";
import Operations from "./components/Operations";
import AdminAuth from "./components/AdminAuth";
import { initialCategories, initialProducts } from "./data/catalog";
import { usePersistentState } from "./hooks/usePersistentState";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import type { Category, Product } from "./types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const STORE_ID = "10000000-0000-4000-8000-000000000001";

export default function App() {
  const [categories, setCategories] = usePersistentState<Category[]>("batidinha:admin:categories", initialCategories);
  const [products, setProducts] = usePersistentState<Product[]>("batidinha:admin:products", initialProducts);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [storeOpen, setStoreOpen] = usePersistentState("batidinha:admin:store-open", true);
  const [storeWhatsapp, setStoreWhatsapp] = usePersistentState("batidinha:admin:whatsapp", "31985011514");
  const [minimumOrder, setMinimumOrder] = usePersistentState("batidinha:admin:minimum-order", 0);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [section, setSection] = useState<"dashboard" | "kitchen" | "cash" | "products" | "pizza" | "orders" | "delivery" | "settings" | "public">("public");

  const visible = useMemo(() => products.filter((product) => {
    const matchesText = `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (categoryFilter === "all" || product.categoryId === categoryFilter);
  }), [products, query, categoryFilter]);

  useEffect(() => {
    setProducts((current) => {
      const defaults = new Map(initialProducts.map((product) => [product.id, product]));
      const merged = current.map((product) => {
        const currentDefault = defaults.get(product.id);
        if (product.id === "combo-dupla") return { ...product, imageUrl: "" };
        return currentDefault && !product.imageUrl ? { ...product, imageUrl: currentDefault.imageUrl } : product;
      });
      const currentIds = new Set(merged.map((product) => product.id));
      return [...merged, ...initialProducts.filter((product) => !currentIds.has(product.id))];
    });
  }, [setProducts]);

  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.from("categories").select("id,name,active").eq("store_id", STORE_ID).order("position"),
      supabase.from("products").select("id,category_id,name,description,price,image_path,active").eq("store_id", STORE_ID).order("position"),
      supabase.from("stores").select("accepting_orders,whatsapp,minimum_order").eq("id", STORE_ID).single(),
    ]).then(([categoryResult, productResult, storeResult]) => {
      if (categoryResult.data) setCategories(categoryResult.data.map((row) => ({ id: row.id, name: row.name, active: row.active })));
      if (productResult.data) setProducts(productResult.data.map((row) => ({ id: row.id, categoryId: row.category_id, name: row.name, description: row.description, price: Number(row.price), imageUrl: row.image_path ?? "", active: row.active })));
      if (storeResult.data) { setStoreOpen(storeResult.data.accepting_orders); setStoreWhatsapp(storeResult.data.whatsapp ?? ""); setMinimumOrder(Number(storeResult.data.minimum_order ?? 0)); }
    });
  }, []);

  async function toggleProduct(id: string) {
    const product = products.find((item) => item.id === id); if (!product) return;
    setProducts((current) => current.map((item) => item.id === id ? { ...item, active: !item.active } : item));
    if (!supabase) return;
    const { error } = await supabase.from("products").update({ active: !product.active, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) setProducts((current) => current.map((item) => item.id === id ? product : item));
  }

  async function addCategory() {
    const name = window.prompt("Nome da nova categoria:")?.trim();
    if (!name) return;
    if (!supabase) {
      setCategories((current) => [...current, { id: crypto.randomUUID(), name, active: true }]);
      return;
    }
    const { data, error } = await supabase.from("categories").insert({ store_id: STORE_ID, name, position: categories.length, active: true }).select("id,name,active").single();
    if (!error && data) setCategories((current) => [...current, { id: data.id, name: data.name, active: data.active }]);
  }

  function closeProductForm() {
    setShowForm(false);
    setEditingProduct(null);
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const details = { name: String(data.get("name")).trim(), description: String(data.get("description")).trim(), category_id: String(data.get("category")), price: Number(data.get("price")), image_path: String(data.get("imageUrl") ?? "").trim() || null };
    if (editingProduct) {
      const updated: Product = { ...editingProduct, categoryId: details.category_id, name: details.name, description: details.description, price: details.price, imageUrl: details.image_path ?? "" };
      setProducts((current) => current.map((product) => product.id === editingProduct.id ? updated : product));
      closeProductForm();
      if (!supabase) return;
      const { error } = await supabase.from("products").update({ ...details, updated_at: new Date().toISOString() }).eq("id", editingProduct.id);
      if (error) {
        setProducts((current) => current.map((product) => product.id === editingProduct.id ? editingProduct : product));
        window.alert("Não foi possível salvar a alteração.");
      }
      return;
    }
    const input = { store_id: STORE_ID, ...details, position: products.length, active: true };
    if (!supabase) {
      setProducts((current) => [...current, { id: crypto.randomUUID(), categoryId: input.category_id, name: input.name, description: input.description, price: input.price, imageUrl: input.image_path ?? "", active: true }]);
      closeProductForm();
      return;
    }
    const { data: saved, error } = await supabase.from("products").insert(input).select("id,category_id,name,description,price,image_path,active").single();
    if (!error && saved) { setProducts((current) => [...current, { id: saved.id, categoryId: saved.category_id, name: saved.name, description: saved.description, price: Number(saved.price), imageUrl: saved.image_path ?? "", active: saved.active }]); closeProductForm(); }
  }

  async function toggleStore() { const next = !storeOpen; setStoreOpen(next); if (!supabase) return; const { error } = await supabase.from("stores").update({ accepting_orders: next, updated_at: new Date().toISOString() }).eq("id", STORE_ID); if (error) setStoreOpen(!next); }

  async function saveStoreSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsSaved(false);
    if (!supabase) {
      setSettingsSaved(true);
      window.setTimeout(() => setSettingsSaved(false), 2500);
      return;
    }
    const { error } = await supabase.from("stores").update({ whatsapp: storeWhatsapp.trim(), minimum_order: minimumOrder, updated_at: new Date().toISOString() }).eq("id", STORE_ID);
    if (error) { window.alert("Não foi possível salvar as configurações."); return; }
    setSettingsSaved(true); window.setTimeout(() => setSettingsSaved(false), 2500);
  }

  if (section === "public") return <PublicMenu onBack={() => setSection("dashboard")} />;
  const sectionTitle = section === "dashboard" ? "Visão geral" : section === "kitchen" ? "Cozinha" : section === "cash" ? "Caixa e relatórios" : section === "pizza" ? "Personalização das batidinhas" : section === "orders" ? "Central de pedidos" : section === "delivery" ? "Entrega e retirada" : section === "settings" ? "Configurações da loja" : "Catálogo";

  return <AdminAuth onBack={() => setSection("public")}>
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><Flame size={24} /></span><div><strong>Batidinha</strong><small>Cardápio • Administração</small></div></div>
        <nav>
          <button className={section === "dashboard" ? "active" : ""} onClick={() => setSection("dashboard")}><LayoutDashboard size={19} /> Visão geral</button>
          <button className={section === "kitchen" ? "active" : ""} onClick={() => setSection("kitchen")}><CookingPot size={19} /> Cozinha</button>
          <button className={section === "cash" ? "active" : ""} onClick={() => setSection("cash")}><Banknote size={19} /> Caixa e relatórios</button>
          <button className={section === "products" ? "active" : ""} onClick={() => setSection("products")}><CupSoda size={19} /> Produtos</button>
          <button className={section === "pizza" ? "active" : ""} onClick={() => setSection("pizza")}><ChefHat size={19} /> Montagem</button>
          <button className={section === "orders" ? "active" : ""} onClick={() => setSection("orders")}><ClipboardList size={19} /> Pedidos</button>
          <button className={section === "delivery" ? "active" : ""} onClick={() => setSection("delivery")}><Bike size={19} /> Entregas</button>
          <button className={section === "settings" ? "active" : ""} onClick={() => setSection("settings")}><Settings size={19} /> Configurações</button>
          <button onClick={() => setSection("public")}><Store size={19} /> Ver cardápio</button>
          <button onClick={addCategory}><Tags size={19} /> Categorias</button>
        </nav>
        <div className="wave-card complete"><small>CICLO CONCLUÍDO</small><strong>Base operacional</strong><span>Cardápio e pedidos integrados</span><div><i style={{ width: "100%" }} /></div></div>
      </aside>

      <main>
        <header className="topbar"><div><span>Painel administrativo</span><strong>{sectionTitle}</strong></div><div className="topbar-actions"><span className="data-status" title={isSupabaseConfigured ? "Supabase conectado" : "Os dados ficam salvos neste navegador"}>{isSupabaseConfigured ? <Cloud size={15} /> : <Database size={15} />}{isSupabaseConfigured ? "Nuvem conectada" : "Salvo neste dispositivo"}</span><button className={`store-status ${storeOpen ? "" : "closed"}`} onClick={toggleStore}><i /> {storeOpen ? "Loja aberta" : "Loja fechada"}</button></div></header>
        {section === "dashboard" ? <Operations view="dashboard" /> : section === "kitchen" ? <Operations view="kitchen" /> : section === "cash" ? <Operations view="cash" /> : section === "pizza" ? <PizzaSettings /> : section === "orders" ? <OrdersBoard /> : section === "delivery" ? <DeliverySettings /> : section === "settings" ? <section className="content"><div className="title-row"><div><p className="eyebrow">OPERAÇÃO DA LOJA</p><h1>Configurações comerciais</h1><p>Defina os dados usados no atendimento e no fechamento dos pedidos.</p></div></div><form className="store-settings-card" onSubmit={saveStoreSettings}><div className={`store-operation ${storeOpen ? "open" : "closed"}`}><div><span><Store size={21} /></span><div><strong>{storeOpen ? "Loja aberta" : "Loja fechada"}</strong><small>{storeOpen ? "O cardápio está aceitando novos pedidos." : "Novos pedidos estão temporariamente bloqueados."}</small></div></div><button type="button" onClick={toggleStore}>{storeOpen ? "Fechar loja" : "Abrir loja"}</button></div><label>WhatsApp da loja<input value={storeWhatsapp} onChange={(event) => setStoreWhatsapp(event.target.value)} inputMode="tel" placeholder="Ex.: (31) 99999-9999" /><small>Será utilizado nos próximos recursos de contato com o cliente.</small></label><label>Pedido mínimo<input value={minimumOrder} onChange={(event) => setMinimumOrder(Math.max(0, Number(event.target.value)))} type="number" min="0" step="0.01" /><small>Use zero caso não queira exigir um valor mínimo.</small></label><footer><span>{settingsSaved ? "Configurações salvas com sucesso." : "As alterações serão aplicadas ao cardápio online."}</span><button className="primary" type="submit"><Save size={17} /> Salvar configurações</button></footer></form></section> : <section className="content">
          <div className="title-row"><div><p className="eyebrow">GESTÃO DO CARDÁPIO</p><h1>Produtos</h1><p>Cadastre e edite as batidinhas, combos e adicionais que aparecerão no cardápio.</p></div><button className="primary" onClick={() => { setEditingProduct(null); setShowForm(true); }}><PackagePlus size={18} /> Novo produto</button></div>

          <div className="stats">
            <article><span>Produtos cadastrados</span><strong>{products.length}</strong></article>
            <article><span>Ativos no cardápio</span><strong>{products.filter((p) => p.active).length}</strong></article>
            <article><span>Categorias</span><strong>{categories.length}</strong></article>
          </div>

          <div className="toolbar"><label><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produto..." /></label><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="all">Todas as categorias</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>

          <div className="product-grid">
            {visible.map((product) => <article className="product-card" key={product.id}>
              <div className="product-image">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <CupSoda size={42} />}<span className={product.active ? "available" : "unavailable"}>{product.active ? "Disponível" : "Oculto"}</span></div>
              <div className="product-body"><small>{categories.find((category) => category.id === product.categoryId)?.name}</small><h2>{product.name}</h2><p>{product.description}</p><footer><strong>{money.format(product.price)}</strong><span className="product-actions"><button onClick={() => { setEditingProduct(product); setShowForm(true); }} title={`Editar ${product.name}`} aria-label={`Editar ${product.name}`}><Pencil size={17} /></button><button onClick={() => toggleProduct(product.id)} title={product.active ? "Ocultar do cardápio" : "Exibir no cardápio"} aria-label={product.active ? `Ocultar ${product.name}` : `Exibir ${product.name}`}>{product.active ? <Eye size={18} /> : <EyeOff size={18} />}</button></span></footer></div>
            </article>)}
          </div>
        </section>}
      </main>

      {showForm && <div className="modal-backdrop" onMouseDown={closeProductForm}><form className="modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={saveProduct}><p className="eyebrow">{editingProduct ? "EDITAR ITEM" : "NOVO ITEM"}</p><h2>{editingProduct ? "Editar produto" : "Cadastrar produto"}</h2><label>Nome<input name="name" required defaultValue={editingProduct?.name} placeholder="Ex.: Batidinha de morango" /></label><label>Descrição<textarea name="description" required defaultValue={editingProduct?.description} placeholder="Ingredientes e apresentação" /></label><label>Endereço da imagem <span className="optional">(opcional)</span><input name="imageUrl" type="url" defaultValue={editingProduct?.imageUrl} placeholder="https://..." /></label><div className="form-row"><label>Categoria<select name="category" defaultValue={editingProduct?.categoryId ?? categories[0]?.id}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Preço<input name="price" required min="0" step="0.01" type="number" defaultValue={editingProduct?.price} placeholder="0,00" /></label></div><div className="modal-actions"><button type="button" onClick={closeProductForm}>Cancelar</button><button className="primary" type="submit">{editingProduct ? "Salvar alterações" : "Salvar produto"}</button></div></form></div>}
    </div>
  </AdminAuth>;
}
