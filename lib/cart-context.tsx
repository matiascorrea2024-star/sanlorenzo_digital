"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

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
  addItem: (item: CartItem) => boolean;
  removeItem: (id: string) => void;
  clear: () => void;
  hasItem: (id: string) => boolean;
};

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => false,
  removeItem: () => {},
  clear: () => {},
  hasItem: () => false,
});

const STORAGE_KEY = "sld-changuito";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    // Evita pisar lo guardado en localStorage con el array vacío del
    // primer render, antes de que termine de leerlo.
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items, loaded]);

  const addItem = (item: CartItem) => {
    if (items.some((i) => i.id === item.id)) return false;
    setItems((prev) => [...prev, item]);
    return true;
  };
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);
  const hasItem = (id: string) => items.some((i) => i.id === id);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, hasItem }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
