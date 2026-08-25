"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { gaEvent } from "@/lib/track";

export type CartItem = {
  id: string; // `${tipo}-${refId}`
  tipo: "oferta" | "producto";
  refId: string;
  title: string;
  price?: number;
  image?: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  businessWhatsapp?: string;
};

type CartContextType = {
  items: CartItem[];
  lastAddedAt: number | null;
  loaded: boolean;
  addItem: (item: CartItem) => boolean;
  removeItem: (id: string) => void;
  clear: () => void;
  hasItem: (id: string) => boolean;
};

const CartContext = createContext<CartContextType>({
  items: [],
  lastAddedAt: null,
  loaded: false,
  addItem: () => false,
  removeItem: () => {},
  clear: () => {},
  hasItem: () => false,
});

const STORAGE_KEY = "sld-changuito";
const TS_KEY = "sld-changuito-ts";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  // Cuándo se sumó el último producto: alimenta el recordatorio de
  // changuito abandonado. Persistido para sobrevivir el cierre del tab.
  const [lastAddedAt, setLastAddedAt] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
      const ts = localStorage.getItem(TS_KEY);
      if (ts) setLastAddedAt(Number(ts) || null);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    // Evita pisar lo guardado en localStorage con el array vacío del
    // primer render, antes de que termine de leerlo.
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
    if (items.length === 0) {
      setLastAddedAt(null);
      try { localStorage.removeItem(TS_KEY); } catch {}
    }
  }, [items, loaded]);

  const addItem = (item: CartItem) => {
    if (items.some((i) => i.id === item.id)) return false;
    setItems((prev) => [...prev, item]);
    const ts = Date.now();
    setLastAddedAt(ts);
    try { localStorage.setItem(TS_KEY, String(ts)); } catch {}
    // Embudo en GA4 (respetando el consentimiento: sin "Aceptar todo"
    // window.trackEvent no existe y esto es un no-op).
    gaEvent("add_to_cart", {
      currency: "ARS",
      value: item.price,
      items: [{ item_id: item.refId, item_name: item.title, price: item.price }],
    });
    return true;
  };
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);
  const hasItem = (id: string) => items.some((i) => i.id === id);

  return (
    <CartContext.Provider value={{ items, lastAddedAt, loaded, addItem, removeItem, clear, hasItem }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
