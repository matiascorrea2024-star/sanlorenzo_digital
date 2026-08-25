"use client";
import { useEffect, useState, useCallback } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAnalytics } from "@/lib/hooks/use-analytics";

// Cache global de favoritos del usuario (evita N+1 queries)
const favCache = {
  data: new Set<string>(),
  loaded: false,
  listeners: new Set<() => void>(),
};

async function loadFavorites(userId: string) {
  if (favCache.loaded) return;
  try {
    // Siempre scoped al usuario: RLS ya lo limita, pero el filtro
    // explícito evita mezclar datos si cambia alguna policy.
    const { data, error } = await supabase()
      .from("favorites")
      .select("item_id, item_type")
      .eq("user_id", userId);
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
  const [busy, setBusy] = useState(false);
  const { trackFavorite } = useAnalytics();

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
    if (!user || busy) {
      if (!user) window.location.href = "/login";
      return;
    }
    setBusy(true);
    // Optimistic update
    const eraFav = isFav;
    if (eraFav) favCache.data.delete(key);
    else favCache.data.add(key);
    favCache.listeners.forEach(fn => fn());

    try {
      const { error } = eraFav
        ? await supabase().from("favorites").delete().eq("user_id", user.id).eq("item_id", itemId).eq("item_type", itemType)
        : await supabase().from("favorites").insert({ user_id: user.id, item_id: itemId, item_type: itemType });
      if (error) throw error;
      if (!eraFav && itemType === "business") trackFavorite(itemId);
    } catch {
      // Revertir si falla -- antes esto solo pasaba con una excepción de
      // red (throw), pero Supabase devuelve {error} sin lanzar excepción,
      // así que un error real de la base nunca revertía el optimistic UI.
      if (eraFav) favCache.data.add(key);
      else favCache.data.delete(key);
      favCache.listeners.forEach(fn => fn());
    }
    setBusy(false);
  }, [user, isFav, itemId, itemType, key, busy, trackFavorite]);

  if (variant === "card") {
    return (
      <button
        onClick={toggle}
        disabled={busy}
        aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
        className={`flex flex-col items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-4 transition hover:bg-[var(--ov-10)] disabled:opacity-60 ${className}`}
      >
        <Heart className={isFav ? "fill-red-500 text-red-500" : "text-[var(--bad)]"} style={{ width: size, height: size }} />
        <span className="text-sm font-bold">{isFav ? "Guardado" : "Favorito"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={`rounded-full bg-black/50 p-2 backdrop-blur-md transition hover:scale-110 disabled:opacity-60 ${className}`}
    >
      <Heart className={`${isFav ? "fill-red-500 text-red-500" : "text-white"}`} style={{ width: size, height: size }} />
    </button>
  );
}
