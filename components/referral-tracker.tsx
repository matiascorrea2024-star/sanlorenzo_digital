"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Guarda el ?ref=<user_id> de un link de invitación para asociarlo al
// registro si la persona se termina creando una cuenta. Sin esto, el
// sistema de referidos de /invitar no tendría cómo saber quién invitó
// a quién.
export default function ReferralTracker() {
  useEffect(() => {
    const attribute = async (userId?: string) => {
      const pending = localStorage.getItem("sld-ref");
      if (!userId || !pending || pending === userId) return;
      const response = await fetch("/api/referrals/attribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referrer_id: pending }),
      });
      if (response.ok) localStorage.removeItem("sld-ref");
    };

    (async () => {
      try {
        const ref = new URLSearchParams(window.location.search).get("ref");
        if (ref && /^[0-9a-f-]{36}$/i.test(ref)) {
          if (!localStorage.getItem("sld-ref")) localStorage.setItem("sld-ref", ref);
        }
        const { data: { user } } = await supabase().auth.getUser();
        await attribute(user?.id);
      } catch {
      }
    })();

    const { data: { subscription } } = supabase().auth.onAuthStateChange((_event, session) => {
      void attribute(session?.user?.id).catch(() => {});
    });
    return () => subscription.unsubscribe();
  }, []);
  return null;
}
