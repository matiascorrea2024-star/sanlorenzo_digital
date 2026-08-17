"use client";
import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Insignia de confianza calculada con datos reales del chat -- nunca un
// número inventado. RLS restringe la tabla "messages" al cliente de esa
// conversación puntual o al dueño del negocio (son chats privados, está
// bien que sea así) -- así que el cálculo no se puede hacer leyendo la
// tabla del lado del cliente, un visitante nuevo (a quien justamente hay
// que convencer) no tiene permiso. Por eso esto llama a una función de
// Postgres (negocio_responde_rapido) que corre server-side con
// privilegios propios y devuelve SOLO el número agregado -- nunca
// mensajes, remitentes ni customer_id.
export default function ResponseBadge({ businessId }: { businessId: string }) {
  const [minutos, setMinutos] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase().rpc("negocio_responde_rapido", { biz_id: businessId });
      if (typeof data === "number" && data <= 60) setMinutos(data);
    })();
  }, [businessId]);

  if (minutos === null) return null;

  const texto = minutos <= 15 ? "Responde al instante" : "Responde rápido";

  return (
    <span className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-300">
      <Zap className="h-3 w-3 fill-emerald-300" /> {texto}
    </span>
  );
}
