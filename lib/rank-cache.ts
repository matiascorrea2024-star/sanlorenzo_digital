"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const cache: {
  data: Record<string, { puntos: number; category: string; portada_url?: string }>;
  loaded: boolean;
  listeners: Set<() => void>;
} = { data: {}, loaded: false, listeners: new Set() };

export async function loadRanks() {
  if (cache.loaded) return;
  try {
    const { data: biz } = await supabase().from("businesses")
      .select("slug, category, portada_url");
    const { data: leagues } = await supabase().from("business_leagues")
      .select("id, puntos");
    const data = (biz || []).map((b: any) => {
      const league: any = (leagues || []).find((l: any) => l.id === b.id) || { puntos: 0 };
      return { ...b, puntos: league.puntos || 0 };
    });
    (data || []).forEach((r: any) => { cache.data[r.slug] = { puntos: r.puntos || 0, category: r.category, portada_url: r.portada_url }; });
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
