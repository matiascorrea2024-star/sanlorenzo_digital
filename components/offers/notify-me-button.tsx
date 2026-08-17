"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  businessId?: string;
  offerId?: string;
  productName?: string;
  originalPrice?: number;
  className?: string;
};

export default function NotifyMeButton({
  businessId,
  offerId,
  productName,
  originalPrice,
  className = "",
}: Props) {
  const [state, setState] = useState<"idle" | "loading" | "active" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Verificar si ya tiene alerta activa
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      if (!user) return;

      let query = supabase().from("user_alerts")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (businessId) query = query.eq("business_id", businessId);
      if (offerId) query = query.eq("offer_id", offerId);

      const { data } = await query.maybeSingle();
      if (data) setState("active");
    })();
  }, [businessId, offerId]);

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
        body: JSON.stringify({ business_id: businessId, offer_id: offerId, product_name: productName, original_price: originalPrice }),
      });
      const data = await res.json();
      if (res.ok) {
        setState("done");
        setMessage(data.message);
      } else {
        setState("error");
        setMessage(data.error);
      }
    } catch (e) {
      setState("error");
      setMessage("Error al crear la alerta");
    }
  };

  if (state === "active") {
    return (
      <button disabled className={`rounded-xl border-2 border-green-400/40 bg-green-500/10 px-4 py-2 text-sm font-black text-[var(--ok)] ${className}`}>
        🔔 Ya estás suscrito
      </button>
    );
  }

  if (state === "done") {
    return (
      <div className={`rounded-xl border-2 border-orange-400/40 bg-orange-500/10 px-4 py-2 text-sm font-black text-orange-300 ${className}`}>
        ✅ {message}
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className={`rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-sm font-black text-white hover:opacity-90 disabled:opacity-50 ${className}`}
    >
      {state === "loading" ? "Suscribiendo..." : "🔔 Avisame si vuelve"}
    </button>
  );
}
