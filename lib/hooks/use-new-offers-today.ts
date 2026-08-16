"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Ofertas activas publicadas hoy en toda la plataforma -- dato real
// (created_at >= hoy 00:00), no un número inventado. Alimenta el badge
// de "Ofertas" en la barra inferior para que se note cuando hay algo
// nuevo, sin necesidad de estar logueado.
export function useNewOffersToday() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    (async () => {
      const hoy00 = new Date();
      hoy00.setHours(0, 0, 0, 0);
      const { count: c } = await supabase().from("offers")
        .select("*", { count: "exact", head: true })
        .eq("active", true)
        .gte("created_at", hoy00.toISOString());
      setCount(c || 0);
    })();
  }, [pathname]);

  return count;
}
