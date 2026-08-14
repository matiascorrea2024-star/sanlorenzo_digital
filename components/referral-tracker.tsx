"use client";
import { useEffect } from "react";

// Guarda el ?ref=<user_id> de un link de invitación para asociarlo al
// registro si la persona se termina creando una cuenta. Sin esto, el
// sistema de referidos de /invitar no tendría cómo saber quién invitó
// a quién.
export default function ReferralTracker() {
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) localStorage.setItem("sld-ref", ref);
    } catch {}
  }, []);
  return null;
}
