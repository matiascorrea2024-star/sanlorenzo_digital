"use client";
// Recordatorio de changuito abandonado: si hay productos hace más de
// 2 horas y todavía no convirtió, avisa una sola vez por estado del
// changuito (toast + notificación del sistema si dio permiso). Todo
// local, sin backend: la marca queda en localStorage atada al
// lastAddedAt, así un producto nuevo vuelve a habilitar el recordatorio.
import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/components/ui/toast";

const HORAS_LIMITE = 2;

export default function AbandonedCartReminder() {
  const { items, loaded, lastAddedAt } = useCart();
  const { show } = useToast();

  useEffect(() => {
    if (!loaded || items.length === 0 || !lastAddedAt) return;
    const check = () => {
      if (items.length === 0 || !lastAddedAt) return;
      if (Date.now() - lastAddedAt < HORAS_LIMITE * 3600_000) return;
      let yaAvisado: string | null = null;
      try { yaAvisado = localStorage.getItem("sld-cart-reminded"); } catch {}
      if (yaAvisado === String(lastAddedAt)) return;
      try { localStorage.setItem("sld-cart-reminded", String(lastAddedAt)); } catch {}
      const n = items.length;
      show(`Tenés ${n} ${n === 1 ? "producto" : "productos"} esperándote en el changuito`, "info");
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("La Gran Barata", {
            body: `Tenés ${n} ${n === 1 ? "producto" : "productos"} en tu changuito. No se te escapan.`,
            icon: "/icon.svg",
          });
        }
      } catch {}
    };
    check();
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, [loaded, items, lastAddedAt, show]);

  return null;
}
