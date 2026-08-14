"use client";
import { useState } from "react";
import { Flag, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const MOTIVOS = ["Información incorrecta", "Negocio inexistente", "Oferta falsa", "Otro"];

export default function ReportButton({ businessId, businessName }: {
  businessId: string;
  businessName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [detalle, setDetalle] = useState("");
  const [sent, setSent] = useState(false);

  const [error, setError] = useState("");

  const send = async () => {
    setError("");
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { error: err } = await supabase().from("reports").insert({
      business_id: businessId,
      user_id: user.id,
      reason: motivo,
      details: detalle || null,
    });
    if (err) { setError("No se pudo enviar el reporte. Probá de nuevo."); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <p className="flex items-center justify-center gap-1 text-xs text-green-400">
        <CheckCircle2 className="h-3 w-3" /> Reporte enviado. Gracias por cuidar la plataforma.
      </p>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20 hover:text-red-300">
        <Flag className="mr-1 inline h-3 w-3" /> Reportar negocio
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left">
      <p className="mb-2 text-sm font-bold">Reportar {businessName || "negocio"}</p>
      <div className="mb-2 flex flex-wrap gap-2">
        {MOTIVOS.map(m => (
          <button key={m} onClick={() => setMotivo(m)}
            className={`rounded-full px-3 py-1 text-xs transition ${
              motivo === m
                ? "border border-red-400/40 bg-red-500/20 text-red-300"
                : "border border-white/15 text-white/60"
            }`}>
            {m}
          </button>
        ))}
      </div>
      <textarea value={detalle} onChange={(e) => setDetalle(e.target.value)} rows={2}
        placeholder="Contanos qué está mal (opcional)"
        className="w-full rounded-lg border border-white/15 bg-black/40 p-2 text-xs outline-none" />
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button onClick={send}
          className="rounded-lg bg-red-500/20 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/30">
          Enviar reporte
        </button>
        <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-xs text-white/50">
          Cancelar
        </button>
      </div>
    </div>
  );
}
