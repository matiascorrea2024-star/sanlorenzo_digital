"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const cache: { data: Record<string, string | null>; loaded: boolean; listeners: Set<() => void> } = {
  data: {}, loaded: false, listeners: new Set(),
};

async function load() {
  if (cache.loaded) return;
  try {
    const { data } = await supabase().from("platform_settings").select("key, value");
    (data || []).forEach((r: any) => { cache.data[r.key] = r.value; });
  } catch {}
  cache.loaded = true;
  cache.listeners.forEach((fn) => fn());
}

export function usePlatformSetting(key: string): string | null {
  const [, force] = useState(0);
  useEffect(() => {
    load();
    const l = () => force((n) => n + 1);
    cache.listeners.add(l);
    return () => { cache.listeners.delete(l); };
  }, [key]);
  return cache.data[key] ?? null;
}

export async function setPlatformSetting(key: string, value: string) {
  const { error } = await supabase().from("platform_settings").upsert({ key, value, updated_at: new Date().toISOString() });
  if (!error) {
    cache.data[key] = value;
    cache.listeners.forEach((fn) => fn());
  }
  return { error };
}
