"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  businessId?: string;
  offerId?: string;
  /** Búsqueda sin resultados (ej. "playstation 5"): registra demanda por un
   *  producto que todavía no existe en el catálogo, en vez de "avisame si
   *  vuelve" una oferta puntual. No dispara ningún matching automático --
   *  solo guarda la señal para revisarla a mano más adelante. */
  searchQuery?: string;
  productName?: string;
  originalPrice?: number;
  className?: string;
  label?: string;
};

export default function NotifyMeButton({
  businessId,
  offerId,
  searchQuery,
  productName,
  originalPrice,
  className = "",
  label,
}: Props) {
  const [state, setState] = useState<"checking" | "idle" | "loading" | "active" | "done" | "error">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Verificar si ya tiene alerta activa
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      if (!user) { setState("idle"); return; }

      let query = supabase().from("user_alerts")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (businessId) query = query.eq("business_id", businessId);
      if (offerId) query = query.eq("offer_id", offerId);
      if (searchQuery) query = query.ilike("search_query", searchQuery);

      const { data } = await query.maybeSingle();
      setState(data ? "active" : "idle");
    })();
  }, [businessId, offerId, searchQuery]);

  const handleClick = async () => {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) {
      window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
      return;
    }

    setState("loading");
    try {
      const res = await fetch("/api/alerts/notify-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, offer_id: offerId, search_query: searchQuery, product_name: productName, original_price: originalPrice }),
      });
      const data = await res.json();
      if (res.ok) {
        setState("done");
        setMessage(data.message);
      } else {
        setState("error");
        setMessage(data.error);
      }
    } catch {
      setState("error");
      setMessage("Error al crear la alerta");
    }
  };

  if (state === "checking") return null;

  if (state === "active") {
    return (
      <button disabled className={`rounded-xl border-2 border-[var(--ok)]/40 bg-[var(--ok)]/10 px-4 py-2 text-sm font-black text-[var(--ok)] ${className}`}>
        🔔 Ya estás suscrito
      </button>
    );
  }

  if (state === "done") {
    return (
      <div className={`rounded-xl border-2 border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-2 text-sm font-black text-[var(--accent-ink)] ${className}`}>
        ✅ {message}
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className={`rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-black text-white hover:opacity-90 disabled:opacity-50 ${className}`}
    >
      {state === "loading" ? "Suscribiendo..." : (label ?? "🔔 Avisame si vuelve")}
    </button>
  );
}
