export type Category = {
  id: string;
  name: string;
  active: boolean;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  active: boolean;
};

export type PizzaSize = { id: string; name: string; slices: number; maxFlavors: number; basePrice: number; active: boolean };
export type PizzaFlavor = { id: string; name: string; ingredients: string; priceBySize: Record<string, number>; active: boolean };
export type PizzaOption = { id: string; name: string; price: number; active: boolean };

export type CartItem = {
  id: string; name: string; detail: string; price: number; quantity: number;
  source?: { kind: "product"; productId: string } | { kind: "pizza"; sizeId: string; flavorIds: string[]; crustId?: string; extraIds: string[] };
};
export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
export type Order = {
  id: string; number: number; customerName: string; phone: string; deliveryType: "delivery" | "pickup";
  address: string; paymentMethod: "pix" | "cash" | "card"; changeFor?: number; notes: string;
  items: CartItem[]; subtotal: number; deliveryFee: number; total: number; status: OrderStatus; courierId?: string; createdAt: string;
};
export type DeliveryZone = { id: string; neighborhood: string; fee: number; etaMinutes: number; active: boolean };
export type Courier = { id: string; name: string; phone: string; vehicle: string; active: boolean };
export type CashSession = { id: string; openedAt: string; openingAmount: number; closedAt?: string; closingAmount?: number };
