import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Check, CheckCircle2, CupSoda, LockKeyhole, MapPin, MessageCircle, Minus, Plus, Search, Share2, ShoppingBag, Sparkles, Trash2, X } from "lucide-react";
import { initialZones } from "../data/delivery";
import { usePersistentState } from "../hooks/usePersistentState";
import { useOnlineMenu } from "../hooks/useOnlineMenu";
import { supabase } from "../lib/supabase";
import { checkoutSchema } from "../validation/order";
import type { CartItem, Order, Product } from "../types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function PublicMenu({ onBack }: { onBack: () => void }) {
  const { products, categories, sizes, flavors, crusts, extras, zones, online, storeOpen, minimumOrder, whatsapp } = useOnlineMenu();
  const [cart, setCart] = usePersistentState<CartItem[]>("batidinha:cart", []);
  const [orders, setOrders] = usePersistentState<Order[]>("batidinha:orders", []);
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [browserOnline, setBrowserOnline] = useState(() => navigator.onLine);
  const [shareFeedback, setShareFeedback] = useState("Compartilhar");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [checkoutDeliveryType, setCheckoutDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [checkoutZoneId, setCheckoutZoneId] = useState(initialZones[0].id);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cash" | "card">("pix");
  const [sizeId, setSizeId] = useState("individual");
  const [flavorIds, setFlavorIds] = useState<string[]>([]);
  const [crustId, setCrustId] = useState("tradicional");
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const size = sizes.find((item) => item.id === sizeId) ?? sizes[0];
  const chosenFlavors = flavors.filter((item) => flavorIds.includes(item.id));
  const flavorPrice = Math.max(size.basePrice, ...chosenFlavors.map((item) => item.priceBySize[sizeId] ?? size.basePrice));
  const crustPrice = crusts.find((item) => item.id === crustId)?.price ?? 0;
  const extrasPrice = extras.filter((item) => extraIds.includes(item.id)).reduce((sum, item) => sum + item.price, 0);
  const pizzaTotal = flavorPrice + crustPrice + extrasPrice;
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const amountToMinimum = Math.max(0, minimumOrder - cartTotal);
  const selectedZone = zones.find((item) => item.id === checkoutZoneId && item.active);
  const checkoutFee = checkoutDeliveryType === "delivery" ? (selectedZone?.fee ?? 0) : 0;
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const showBuilder = activeCategory === "all" && !normalizedQuery;
  const filteredProducts = useMemo(() => products.filter((item) => item.active && (activeCategory === "all" || item.categoryId === activeCategory) && (!normalizedQuery || `${item.name} ${item.description}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery))), [products, activeCategory, normalizedQuery]);

  useEffect(() => {
    if (!sizes.some((item) => item.id === sizeId)) setSizeId(sizes.find((item) => item.name === "Grande")?.id ?? sizes[0]?.id ?? "");
    if (!crusts.some((item) => item.id === crustId)) setCrustId(crusts[0]?.id ?? "");
    if (!zones.some((item) => item.id === checkoutZoneId)) setCheckoutZoneId(zones[0]?.id ?? initialZones[0].id);
  }, [checkoutZoneId, crustId, crusts, sizeId, sizes, zones]);

  useEffect(() => {
    const updateConnection = () => setBrowserOnline(navigator.onLine);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  function selectFlavor(id: string) {
    setFlavorIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length >= size.maxFlavors ? [...current.slice(1), id] : [...current, id]);
  }
  function addPizza() {
    if (!storeOpen) { window.alert("A loja está fechada para novos pedidos no momento."); return; }
    if (!flavorIds.length) return;
    const crust = crusts.find((item) => item.id === crustId);
    const selectedExtras = extras.filter((item) => extraIds.includes(item.id));
    setCart((current) => [...current, { id: crypto.randomUUID(), name: `Batidinha ${size.name}`, detail: `${chosenFlavors.map((item) => item.name).join(" + ")} • ${crust?.name}${selectedExtras.length ? ` • ${selectedExtras.map((item) => item.name).join(", ")}` : ""}`, price: pizzaTotal, quantity: 1, source: { kind: "pizza", sizeId: size.id, flavorIds, crustId: crust?.id, extraIds } }]);
    setBuilderOpen(false); setCartOpen(true); setFlavorIds([]); setExtraIds([]); setCrustId(crusts[0]?.id ?? "");
  }
  function addProduct(product: Product) {
    if (!storeOpen) { window.alert("A loja está fechada para novos pedidos no momento."); return; }
    setCart((current) => { const existing = current.find((item) => item.id === product.id); return existing ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { id: product.id, name: product.name, detail: product.description, price: product.price, quantity: 1, source: { kind: "product", productId: product.id } }]; });
  }
  function quantity(id: string, delta: number) { setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0)); }
  async function finishOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    if (!storeOpen) { window.alert("A Batidinha do Rick está fechada para novos pedidos no momento."); return; }
    if (cartTotal < minimumOrder) { window.alert(`O pedido mínimo é ${money.format(minimumOrder)}.`); return; }
    const deliveryType = checkoutDeliveryType; const deliveryFee = checkoutFee;
    const zoneName = selectedZone?.neighborhood ?? "";
    const parsed = checkoutSchema.safeParse({
      name: String(data.get("name") ?? ""), phone: String(data.get("phone") ?? ""), deliveryType,
      address: String(data.get("address") ?? ""), paymentMethod,
      changeFor: String(data.get("changeFor") ?? "").trim() || undefined, notes: String(data.get("notes") ?? ""),
    });
    if (!parsed.success) { window.alert(parsed.error.issues[0]?.message ?? "Confira os dados do pedido."); return; }
    const checkout = parsed.data;
    const draft: Order = { id: crypto.randomUUID(), number: Math.max(0, ...orders.map((item) => item.number)) + 1, customerName: checkout.name, phone: checkout.phone, deliveryType, address: deliveryType === "delivery" ? `${checkout.address} • ${zoneName}` : "", paymentMethod: checkout.paymentMethod, changeFor: checkout.changeFor || undefined, notes: checkout.notes, items: cart, subtotal: cartTotal, deliveryFee, total: cartTotal + deliveryFee, status: "pending", createdAt: new Date().toISOString() };
    if (!supabase || !online) {
      setOrders((current) => [draft, ...current]);
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
      setCompletedOrder(draft);
      return;
    }
    try {
      if (cart.some((item) => !item.source)) throw new Error("Atualize o cardápio e monte novamente o pedido.");
      const payload = {
        customer_name: draft.customerName, phone: draft.phone, delivery_type: deliveryType,
        address: checkout.address, delivery_zone_id: deliveryType === "delivery" ? checkoutZoneId : null,
        payment_method: draft.paymentMethod, change_for: draft.changeFor ?? null, notes: draft.notes,
        items: cart.map((item) => item.source?.kind === "product"
          ? { kind: "product", product_id: item.source.productId, quantity: item.quantity }
          : { kind: "pizza", size_id: item.source!.sizeId, flavor_ids: item.source!.flavorIds, crust_id: item.source!.crustId ?? null, extra_ids: item.source!.extraIds, quantity: item.quantity }),
      };
      const { data: saved, error } = await supabase.rpc("create_public_order", { payload });
      if (error) throw error;
      const order: Order = { ...draft, id: String(saved.id), number: Number(saved.number), subtotal: Number(saved.subtotal), deliveryFee: Number(saved.delivery_fee), total: Number(saved.total), createdAt: String(saved.created_at) };
      setOrders((current) => [order, ...current.filter((item) => item.id !== order.id)]); setCart([]); setCheckoutOpen(false); setCartOpen(false); setCompletedOrder(order);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível enviar o pedido. Tente novamente.");
    }
  }

  function confirmOnWhatsapp(order: Order) {
    const digits = whatsapp.replace(/\D/g, "");
    if (!digits) return;
    const phone = digits.startsWith("55") ? digits : `55${digits}`;
    const itemLines = order.items.map((item) => `${item.quantity}x ${item.name}${item.detail ? ` — ${item.detail}` : ""} — ${money.format(item.price * item.quantity)}`).join("\n");
    const paymentLabels = { pix: "PIX", cash: "Dinheiro", card: "Cartão na entrega" };
    const deliveryLine = order.deliveryType === "delivery" ? `Entrega: ${order.address}\nTaxa: ${money.format(order.deliveryFee)}` : "Recebimento: Retirada na loja";
    const changeLine = order.paymentMethod === "cash" && order.changeFor ? `\nTroco para: ${money.format(order.changeFor)}` : "";
    const notesLine = order.notes ? `\nObservações: ${order.notes}` : "";
    const message = `Olá! Acabei de fazer o pedido #${String(order.number).padStart(3, "0")} pelo cardápio da Batidinha do Rick.\n\n${itemLines}\n\nSubtotal: ${money.format(order.subtotal)}\n${deliveryLine}\nTotal: ${money.format(order.total)}\nPagamento: ${paymentLabels[order.paymentMethod]}${changeLine}${notesLine}\n\nCliente: ${order.customerName}\nWhatsApp: ${order.phone}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  async function shareMenu() {
    const shareData = { title: "Batidinha do Rick", text: "Confira o cardápio online da Batidinha do Rick!", url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); return; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareFeedback("Link copiado!");
      window.setTimeout(() => setShareFeedback("Compartilhar"), 2200);
    } catch {
      window.prompt("Copie o link do cardápio:", window.location.href);
    }
  }

  return <div className="public-menu">
    <header className="public-header"><div className="public-brand"><span><CupSoda size={22} /></span><div><strong>Batidinha do Rick</strong><small>{online ? `Cardápio online • ${storeOpen ? "Loja aberta" : "Loja fechada"}${minimumOrder ? ` • Mín. ${money.format(minimumOrder)}` : ""}` : "Gelada, cremosa e feita para você."}</small></div></div><button className="cart-button" onClick={() => setCartOpen(true)}><ShoppingBag size={19} /><span>{cartCount}</span><b>{money.format(cartTotal)}</b></button></header>
    {!browserOnline && <div className="offline-banner" role="status"><strong>Você está sem internet</strong><span>O cardápio salvo continua disponível, mas o envio do pedido precisará de conexão.</span></div>}
    {!storeOpen && <div className="store-closed-banner"><strong>Loja fechada no momento</strong><span>Você pode consultar o cardápio, mas novos pedidos estão temporariamente pausados.</span></div>}
    <section className="public-hero"><div><small>🥤 BATIDINHA GELADA • ENTREGA RÁPIDA</small><h1>Sua batidinha, do seu jeito.</h1><p>Escolha seus sabores favoritos e receba geladinha em casa.</p><div className="hero-actions"><button disabled={!storeOpen} onClick={() => setBuilderOpen(true)}>Personalizar minha batidinha <Plus size={18} /></button><button className="share-menu" onClick={shareMenu}><Share2 size={17} /> {shareFeedback}</button></div></div></section>
    <section className="benefit-strip" aria-label="Diferenciais da Batidinha do Rick"><article><Sparkles size={21} /><div><strong>Feita na hora</strong><span>Cremosa e bem gelada</span></div></article><article><MapPin size={21} /><div><strong>Entrega ou retirada</strong><span>Escolha ao finalizar</span></div></article></section>
    <nav className="category-pills"><button className={activeCategory === "all" ? "active" : ""} onClick={() => setActiveCategory("all")}>Todos</button>{categories.filter((item) => item.active).map((item) => <button key={item.id} className={activeCategory === item.id ? "active" : ""} onClick={() => setActiveCategory(item.id)}>{item.name}</button>)}</nav>
    <div className="menu-search"><label><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Buscar sabor, combo ou produto..." aria-label="Buscar no cardápio" />{query && <button aria-label="Limpar busca" onClick={() => setQuery("")}><X size={16} /></button>}</label></div>
    <main className="menu-content"><div className="menu-title"><div><small>NOSSO CARDÁPIO</small><h2>Escolha o seu pedido</h2></div><span>{filteredProducts.length + (showBuilder ? 1 : 0)} opções disponíveis</span></div>{!filteredProducts.length && !showBuilder ? <div className="menu-empty"><Search size={34} /><strong>Nenhum item encontrado</strong><span>Tente buscar outro nome ou escolha uma categoria diferente.</span></div> : <div className="menu-grid">{showBuilder && <article className="menu-card build-card"><div className="menu-photo build-photo"><Plus size={34} /><span>Monte do seu jeito</span></div><div><small>BATIDINHAS</small><h3>Monte sua batidinha</h3><p>Escolha quantidade, sabores, preparo e adicionais.</p><footer><strong>A partir de {money.format(Math.min(...sizes.map((item) => item.basePrice)))}</strong><button disabled={!storeOpen} onClick={() => setBuilderOpen(true)}>Montar</button></footer></div></article>}{filteredProducts.map((product) => <article className="menu-card" key={product.id}><div className="menu-photo">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" decoding="async" /> : <CupSoda size={38} />}</div><div><small>{categories.find((item) => item.id === product.categoryId)?.name}</small><h3>{product.name}</h3><p>{product.description}</p><footer><strong>{money.format(product.price)}</strong><button disabled={!storeOpen} aria-label={`Adicionar ${product.name} ao carrinho`} onClick={() => addProduct(product)}><Plus size={18} /><span>Adicionar</span></button></footer></div></article>)}</div>}</main>
    <footer className="public-footer"><div><span><CupSoda size={21} /></span><div><strong>Batidinha do Rick</strong><small>Cardápio online • Ipatinga, MG</small></div></div><button onClick={onBack}><LockKeyhole size={14} /> Área administrativa</button></footer>
    {cartCount > 0 && !cartOpen && !checkoutOpen && !completedOrder && <button className="floating-cart" onClick={() => setCartOpen(true)}><span><ShoppingBag size={19} /><b>{cartCount} {cartCount === 1 ? "item" : "itens"}</b></span><strong>{money.format(cartTotal)}</strong></button>}

    {builderOpen && <div className="menu-overlay"><div className="pizza-builder"><header><div><small>MONTE SUA BATIDINHA</small><h2>Personalize seu pedido</h2></div><button onClick={() => setBuilderOpen(false)}><X /></button></header><div className="builder-body"><section><h3><span>1</span> Escolha o tamanho</h3><div className="builder-sizes">{sizes.filter((item) => item.active).map((item) => <button key={item.id} className={sizeId === item.id ? "selected" : ""} onClick={() => { setSizeId(item.id); setFlavorIds((current) => current.slice(0, item.maxFlavors)); }}><strong>{item.name}</strong><small>{item.slices} unidades • {item.maxFlavors} sabor{item.maxFlavors > 1 ? "es" : ""}</small><b>A partir de {money.format(item.basePrice)}</b></button>)}</div></section><section><h3><span>2</span> Escolha até {size.maxFlavors} sabor{size.maxFlavors > 1 ? "es" : ""}</h3><div className="builder-flavors">{flavors.filter((item) => item.active).map((item) => { const selected = flavorIds.includes(item.id); return <button key={item.id} className={selected ? "selected" : ""} onClick={() => selectFlavor(item.id)}><i>{selected && <Check size={14} />}</i><div><strong>{item.name}</strong><small>{item.ingredients}</small></div><b>{money.format(item.priceBySize[sizeId] ?? size.basePrice)}</b></button> })}</div></section><section><h3><span>3</span> Escolha o preparo</h3><div className="builder-options">{crusts.filter((item) => item.active).map((item) => <button key={item.id} className={crustId === item.id ? "selected" : ""} onClick={() => setCrustId(item.id)}>{item.name}<small>{item.price ? `+ ${money.format(item.price)}` : "Sem acréscimo"}</small></button>)}</div></section><section><h3><span>4</span> Adicionais</h3><div className="builder-options">{extras.filter((item) => item.active).map((item) => <button key={item.id} className={extraIds.includes(item.id) ? "selected" : ""} onClick={() => setExtraIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}>{item.name}<small>+ {money.format(item.price)}</small></button>)}</div></section></div><footer className="builder-footer"><div><span>Total da batidinha</span><strong>{money.format(pizzaTotal)}</strong><small>Preço calculado conforme a opção escolhida</small></div><button disabled={!flavorIds.length} onClick={addPizza}><ShoppingBag size={18} /> Adicionar ao carrinho</button></footer></div></div>}
    {cartOpen && <div className="menu-overlay cart-overlay" onMouseDown={() => setCartOpen(false)}><aside className="cart-drawer" onMouseDown={(event) => event.stopPropagation()}><header><div><small>SEU PEDIDO</small><h2>Carrinho</h2></div><div className="cart-header-actions">{cart.length > 0 && <button className="clear-cart" onClick={() => { if (window.confirm("Deseja remover todos os itens do carrinho?")) setCart([]); }}>Limpar</button>}<button aria-label="Fechar carrinho" onClick={() => setCartOpen(false)}><X /></button></div></header><div className="cart-items">{cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={36} /><strong>Seu carrinho está vazio</strong><span>Escolha uma batidinha ou outro item do cardápio.</span></div> : cart.map((item) => <article key={item.id}><div><strong>{item.name}</strong><p>{item.detail}</p><b>{money.format(item.price * item.quantity)}</b>{item.quantity > 1 && <small>{money.format(item.price)} cada</small>}</div><div className="quantity"><button aria-label={`Diminuir ${item.name}`} onClick={() => quantity(item.id, -1)}>{item.quantity === 1 ? <Trash2 size={15} /> : <Minus size={15} />}</button><span>{item.quantity}</span><button aria-label={`Aumentar ${item.name}`} onClick={() => quantity(item.id, 1)}><Plus size={15} /></button></div></article>)}</div><footer><div><span>Subtotal</span><strong>{money.format(cartTotal)}</strong></div>{amountToMinimum > 0 && cart.length > 0 && <p className="minimum-warning">Adicione mais {money.format(amountToMinimum)} para atingir o pedido mínimo.</p>}<button disabled={!cart.length || !storeOpen || amountToMinimum > 0} onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>{!storeOpen ? "Loja fechada" : amountToMinimum > 0 ? `Faltam ${money.format(amountToMinimum)}` : "Continuar pedido"}</button><small>{storeOpen ? "Você preencherá os dados antes de confirmar." : "Novos pedidos estão temporariamente pausados."}</small></footer></aside></div>}
    {checkoutOpen && <div className="menu-overlay"><form className="checkout-card" onSubmit={finishOrder}><header><div><small>FINALIZAR PEDIDO</small><h2>Seus dados</h2></div><button type="button" aria-label="Fechar finalização" onClick={() => setCheckoutOpen(false)}><X /></button></header><div className="checkout-body"><div className="checkout-row"><label>Nome completo<input name="name" required autoComplete="name" placeholder="Como podemos chamar você?" /></label><label>WhatsApp<input name="phone" required inputMode="tel" autoComplete="tel" maxLength={16} placeholder="(31) 99999-9999" /></label></div><fieldset><legend>Como deseja receber?</legend><label><input type="radio" name="deliveryType" value="delivery" checked={checkoutDeliveryType === "delivery"} onChange={() => setCheckoutDeliveryType("delivery")} /> Entrega</label><label><input type="radio" name="deliveryType" value="pickup" checked={checkoutDeliveryType === "pickup"} onChange={() => setCheckoutDeliveryType("pickup")} /> Retirar na loja</label></fieldset>{checkoutDeliveryType === "delivery" && <><label>Bairro<select value={checkoutZoneId} onChange={(event) => setCheckoutZoneId(event.target.value)}>{zones.filter((zone) => zone.active).map((zone) => <option key={zone.id} value={zone.id}>{zone.neighborhood} — {zone.fee ? money.format(zone.fee) : "Entrega grátis"}</option>)}</select>{selectedZone && <small className="delivery-estimate">Previsão aproximada: {selectedZone.etaMinutes} minutos</small>}</label><label>Endereço de entrega<input name="address" required autoComplete="street-address" placeholder="Rua, número e referência" /></label></>}<div className="checkout-row"><label>Pagamento<select name="paymentMethod" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as "pix" | "cash" | "card")}><option value="pix">PIX</option><option value="cash">Dinheiro</option><option value="card">Cartão na entrega</option></select></label>{paymentMethod === "cash" && <label>Troco para<input name="changeFor" type="number" min={cartTotal + checkoutFee} step="0.01" placeholder={`Ex.: ${Math.ceil((cartTotal + checkoutFee) / 10) * 10}`} /></label>}</div><label>Observações<textarea name="notes" maxLength={500} placeholder="Ex.: tocar o interfone, sem cebola..." /></label><div className="checkout-total"><span>Subtotal <b>{money.format(cartTotal)}</b></span><span>{checkoutDeliveryType === "delivery" ? `Entrega${selectedZone ? ` • ${selectedZone.neighborhood}` : ""}` : "Retirada"} <b>{checkoutFee ? money.format(checkoutFee) : "Grátis"}</b></span><strong>Total <b>{money.format(cartTotal + checkoutFee)}</b></strong></div></div><footer><button type="button" onClick={() => { setCheckoutOpen(false); setCartOpen(true); }}>Voltar</button><button className="confirm-order" type="submit">Confirmar pedido</button></footer></form></div>}
    {completedOrder && <div className="menu-overlay"><div className="order-success"><CheckCircle2 size={58} /><small>PEDIDO RECEBIDO</small><h2>Pedido #{String(completedOrder.number).padStart(3, "0")}</h2><p>Seu pedido já foi enviado para a central da Batidinha do Rick.</p><strong>{money.format(completedOrder.total)}</strong>{whatsapp && <button className="whatsapp-order" onClick={() => confirmOnWhatsapp(completedOrder)}><MessageCircle size={18} /> Confirmar pelo WhatsApp</button>}<button className="back-menu" onClick={() => setCompletedOrder(null)}>Voltar ao cardápio</button></div></div>}
  </div>;
}
