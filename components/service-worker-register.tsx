"use client";
import { useEffect } from "react";

// Sin este registro, sw.js nunca corre: el caché offline queda muerto y
// lib/push.ts:subscribeToPush() se cuelga para siempre esperando
// navigator.serviceWorker.ready (que nunca resuelve sin un SW activo),
// rompiendo en silencio el flujo de activar notificaciones push.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("No se pudo registrar el service worker:", err);
    });
  }, []);
  return null;
}
