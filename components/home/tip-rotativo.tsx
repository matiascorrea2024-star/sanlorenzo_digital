"use client";
import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";

const TIPS = [
  "Seguí a tus negocios favoritos para enterarte primero de sus ofertas nuevas.",
  "Las ofertas con ⏰ vencen hoy -- si te interesa, no esperes a mañana.",
  "Dejar una reseña con foto ayuda mucho más a otros vecinos a decidir.",
  "Invitá vecinos con tu link de /invitar y sumá puntos por cada referido activo.",
  "El Salón de la Fama se actualiza con seguidores, reseñas, ofertas activas y canjes reales.",
  "Podés filtrar por ciudad y barrio para ver solo lo que está cerca tuyo.",
  "Compartí una oferta por WhatsApp: sumás puntos y ayudás al negocio a crecer.",
];

export default function TipRotativo() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % TIPS.length), 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[.03] px-4 py-2.5 text-xs text-white/60">
        <Lightbulb className="h-4 w-4 shrink-0 text-orange-400" />
        <span className="font-bold text-white/80">¿Sabías que?</span>
        <span className="truncate">{TIPS[i]}</span>
      </div>
    </div>
  );
}
