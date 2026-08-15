"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const cache: {
  data: Record<string, { puntos: number; category: string }>;
  loaded: boolean;
  listeners: Set<() => void>;
} = { data: {}, loaded: false, listeners: new Set() };

export async function loadRanks() {
  if (cache.loaded) return;
  try {
    // business_leagues ya trae slug/categoría/puntos calculados en una
    // sola vista -- antes esto hacía 2 queries (businesses + business_
    // leagues) y las unía a mano en el cliente.
    const { data } = await supabase().from("business_leagues")
      .select("slug, category, puntos");
    (data || []).forEach((r: any) => { cache.data[r.slug] = { puntos: r.puntos || 0, category: r.category }; });
  } catch {}
  cache.loaded = true;
  cache.listeners.forEach(fn => fn());
}

export function useRank(slug?: string) {
  const [, force] = useState(0);
  useEffect(() => {
    loadRanks();
    const l = () => force(n => n + 1);
    cache.listeners.add(l);
    return () => { cache.listeners.delete(l); };
  }, [slug]);
  return slug ? cache.data[slug] || null : null;
}
