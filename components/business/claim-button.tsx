"use client";
import { useState } from "react";
import { Store, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const METODOS = [
  "Soy el encargado/dueño del local",
  "Tengo el WhatsApp/redes oficiales del negocio",
  "Tengo un comprobante o factura a nombre del negocio",
  "Otro",
];

// "¿Sos el dueño de este negocio?" -- solo aparece en negocios sin owner_id
// (típicamente cargados en lote por el admin desde /admin/cargar-bulk).
// No asigna nada directo: crea una solicitud en business_claims que un
// admin aprueba o rechaza desde /admin -- ver app/api/business/claim.
export default function ClaimButton({ businessId, businessName }: {
  businessId: string;
  businessName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [metodo, setMetodo] = useState(METODOS[0]);
  const [detalle, setDetalle] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const abrir = async () => {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) { window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`; return; }
    setEmail(user.email || "");
    setOpen(true);
  };

  const enviar = async () => {
    setError("");
    if (!nombre.trim() || !email.trim() || !telefono.trim()) {
      setError("Completá tu nombre, email y teléfono.");
      return;
    }
    const proof_method = metodo === "Otro" && detalle.trim() ? `Otro: ${detalle.trim()}` : `${metodo}${detalle.trim() ? ` — ${detalle.trim()}` : ""}`;
    if (proof_method.length < 10) {
      setError("Contanos un poco más de cómo podés probarlo.");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/business/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, claimer_name: nombre, claimer_email: email, claimer_phone: telefono, proof_method }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "No se pudo enviar la solicitud."); setEnviando(false); return; }
      setSent(true);
    } catch {
      setError("No se pudo enviar la solicitud. Probá de nuevo.");
      setEnviando(false);
    }
  };

  if (sent) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-[var(--ok)]">
        <CheckCircle2 className="h-3.5 w-3.5" /> Solicitud enviada. Te avisamos cuando la revisemos.
      </p>
    );
  }

  if (!open) {
    return (
      <button onClick={abrir}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line-strong)] bg-[var(--ov-05)] px-3 py-1.5 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--ov-10)]">
        <Store className="h-3.5 w-3.5" /> ¿Sos el dueño de este negocio?
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--ov-05)] p-4 text-left">
      <p className="mb-2 text-sm font-bold">Reclamar {businessName || "este negocio"}</p>
      <div className="mb-2 flex flex-wrap gap-2">
        {METODOS.map((m) => (
          <button key={m} onClick={() => setMetodo(m)}
            className={`rounded-full px-3 py-1 text-xs transition ${
              metodo === m
                ? "border border-[var(--accent)]/50 bg-[var(--accent)]/15 text-[var(--accent)]"
                : "border border-[var(--line-strong)] text-[var(--muted)]"
            }`}>
            {m}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre"
          className="rounded-lg border border-[var(--line-strong)] bg-[var(--card-inner)] px-2.5 py-2 text-xs outline-none" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email"
          className="rounded-lg border border-[var(--line-strong)] bg-[var(--card-inner)] px-2.5 py-2 text-xs outline-none" />
        <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono"
          className="rounded-lg border border-[var(--line-strong)] bg-[var(--card-inner)] px-2.5 py-2 text-xs outline-none" />
      </div>
      <textarea value={detalle} onChange={(e) => setDetalle(e.target.value)} rows={2}
        placeholder="Contanos más (opcional, salvo que elegiste 'Otro')"
        className="mt-2 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--card-inner)] p-2 text-xs outline-none" />
      {error && <p className="mt-2 text-xs text-[var(--bad)]">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button onClick={enviar} disabled={enviando}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
          {enviando ? "Enviando..." : "Enviar solicitud"}
        </button>
        <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-xs text-[var(--muted)]">
          Cancelar
        </button>
      </div>
    </div>
  );
}
