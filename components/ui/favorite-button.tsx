"use client";
import { useEffect, useState, useCallback } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Cache global de favoritos del usuario (evita N+1 queries)
const favCache = {
  data: new Set<string>(),
  loaded: false,
  listeners: new Set<() => void>(),
};

async function loadFavorites(userId: string) {
  if (favCache.loaded) return;
  try {
    const { data, error } = await supabase()
      .from("favorites")
      .select("item_id, item_type");
    if (error) {
      // Tabla rota o permisos - modo degradado silencioso
      favCache.loaded = true;
      favCache.listeners.forEach(fn => fn());
      return;
    }
    favCache.data = new Set((data || []).map((f: any) => `${f.item_type}:${f.item_id}`));
    favCache.loaded = true;
    favCache.listeners.forEach(fn => fn());
  } catch {
    // Silencioso: no romper la UI
    favCache.loaded = true;
    favCache.listeners.forEach(fn => fn());
  }
}

export default function FavoriteButton({ itemId, itemType = "business", size = 20, className = "", variant = "floating" }: {
  itemId: string;
  itemType?: "business" | "offer";
  size?: number;
  className?: string;
  /** "floating": círculo sobre una imagen (default, uso original). "card": mismo look que los botones de acción de la ficha (borde, fondo y label). */
  variant?: "floating" | "card";
}) {
  const [user, setUser] = useState<any>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      setUser(user);
      if (user) {
        await loadFavorites(user.id);
        forceUpdate(n => n + 1);
      }
    })();
    const listener = () => forceUpdate(n => n + 1);
    favCache.listeners.add(listener);
    return () => { favCache.listeners.delete(listener); };
  }, []);

  const key = `${itemType}:${itemId}`;
  const isFav = favCache.data.has(key);

  const toggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    // Optimistic update
    if (isFav) favCache.data.delete(key);
    else favCache.data.add(key);
    favCache.listeners.forEach(fn => fn());

    try {
      if (isFav) {
        await supabase().from("favorites").delete().eq("user_id", user.id).eq("item_id", itemId).eq("item_type", itemType);
      } else {
        await supabase().from("favorites").insert({ user_id: user.id, item_id: itemId, item_type: itemType });
      }
    } catch {
      // Revertir si falla (sin loguear para no spamear consola)
      if (isFav) favCache.data.add(key);
      else favCache.data.delete(key);
      favCache.listeners.forEach(fn => fn());
    }
  }, [user, isFav, itemId, itemType, key]);

  if (variant === "card") {
    return (
      <button
        onClick={toggle}
        aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
        className={`flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10 ${className}`}
      >
        <Heart className={isFav ? "fill-red-500 text-red-500" : "text-red-400"} style={{ width: size, height: size }} />
        <span className="text-sm font-bold">{isFav ? "Guardado" : "Favorito"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={`rounded-full bg-black/50 p-2 backdrop-blur-md transition hover:scale-110 ${className}`}
    >
      <Heart className={`${isFav ? "fill-red-500 text-red-500" : "text-white"}`} style={{ width: size, height: size }} />
    </button>
  );
}
