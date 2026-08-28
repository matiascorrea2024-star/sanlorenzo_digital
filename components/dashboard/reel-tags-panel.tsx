"use client";
import { useEffect, useState } from "react";
import { Tag, X, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";

type Opcion = { id: string; label: string };
type EtiquetaExistente = {
  id: string;
  product_id: string | null;
  offer_id: string | null;
  label: string | null;
  timecode_seconds: number;
  clicks: number;
};

// Panel de etiquetas de producto/oferta dentro de un reel -- vive
// colapsado dentro de cada card de app/dashboard/reels/page.tsx. La
// validación de "esto es tuyo" la hace la propia API (/api/reels/tags),
// acá solo se arma la lista de productos/ofertas para elegir.
export default function ReelTagsPanel({ reelId, businessId }: { reelId: string; businessId: string }) {
  const { show } = useToast();
  const [cargando, setCargando] = useState(true);
  const [productos, setProductos] = useState<Opcion[]>([]);
  const [ofertas, setOfertas] = useState<Opcion[]>([]);
  const [etiquetas, setEtiquetas] = useState<EtiquetaExistente[]>([]);
  const [tipo, setTipo] = useState<"product" | "offer">("product");
  const [seleccion, setSeleccion] = useState("");
  const [timecode, setTimecode] = useState("0");
  const [label, setLabel] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: prods }, { data: offs }, { data: tags }] = await Promise.all([
        supabase().from("products").select("id, name").eq("business_id", businessId).eq("active", true).limit(100),
        supabase().from("offers").select("id, title").eq("business_id", businessId).eq("active", true).limit(100),
        supabase().from("reel_products").select("id, product_id, offer_id, label, timecode_seconds, clicks").eq("reel_id", reelId).order("timecode_seconds"),
      ]);
      setProductos((prods || []).map((p) => ({ id: p.id, label: p.name })));
      setOfertas((offs || []).map((o) => ({ id: o.id, label: o.title })));
      setEtiquetas(tags || []);
      setCargando(false);
    })();
  }, [reelId, businessId]);

  const opciones = tipo === "product" ? productos : ofertas;

  const agregar = async () => {
    if (!seleccion) { show("Elegí un producto o una oferta", "error"); return; }
    setGuardando(true);
    try {
      const res = await fetch("/api/reels/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reel_id: reelId,
          [tipo === "product" ? "product_id" : "offer_id"]: seleccion,
          label: label.trim() || undefined,
          timecode_seconds: Number(timecode) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) { show(`❌ ${data.error || "No se pudo crear la etiqueta"}`, "error"); setGuardando(false); return; }
      setEtiquetas((prev) => [...prev, data].sort((a, b) => a.timecode_seconds - b.timecode_seconds));
      setSeleccion(""); setLabel(""); setTimecode("0");
      show("✅ Etiqueta agregada");
    } catch {
      show("❌ No se pudo crear la etiqueta", "error");
    }
    setGuardando(false);
  };

  const eliminar = async (id: string) => {
    try {
      const res = await fetch("/api/reels/tags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); show(`❌ ${d.error || "No se pudo eliminar la etiqueta"}`, "error"); return; }
      setEtiquetas((prev) => prev.filter((t) => t.id !== id));
    } catch {
      show("❌ No se pudo eliminar la etiqueta", "error");
    }
  };

  if (cargando) return <p className="p-3 text-xs text-[var(--muted2)]">Cargando etiquetas...</p>;

  return (
    <div className="border-t border-[var(--ov-05)] p-3">
      {etiquetas.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {etiquetas.map((t) => {
            const nombre = t.product_id
              ? productos.find((p) => p.id === t.product_id)?.label
              : ofertas.find((o) => o.id === t.offer_id)?.label;
            return (
              <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--ov-05)] px-2.5 py-1.5 text-xs">
                <span className="truncate">
                  <Tag className="mr-1 inline h-3 w-3 text-[var(--accent-ink)]" />
                  {t.label || nombre || "(sin nombre)"} · seg {t.timecode_seconds} · {t.clicks} clicks
                </span>
                <button onClick={() => eliminar(t.id)} aria-label="Eliminar etiqueta" className="shrink-0 text-[var(--muted2)] hover:text-[var(--bad)]">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {productos.length === 0 && ofertas.length === 0 ? (
        <p className="text-xs text-[var(--muted2)]">Cargá un producto o una oferta activa para poder etiquetarlos acá.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <select value={tipo} onChange={(e) => { setTipo(e.target.value as "product" | "offer"); setSeleccion(""); }}
            className="rounded-lg border border-[var(--line-strong)] bg-[var(--card-inner)] px-2 py-1.5 text-xs">
            <option value="product">Producto</option>
            <option value="offer">Oferta</option>
          </select>
          <select value={seleccion} onChange={(e) => setSeleccion(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-[var(--line-strong)] bg-[var(--card-inner)] px-2 py-1.5 text-xs">
            <option value="">{opciones.length === 0 ? "Nada activo de este tipo" : "Elegir..."}</option>
            {opciones.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <input value={timecode} onChange={(e) => setTimecode(e.target.value)} type="number" min="0" placeholder="Seg"
            className="w-14 rounded-lg border border-[var(--line-strong)] bg-[var(--card-inner)] px-2 py-1.5 text-xs" />
          <button onClick={agregar} disabled={guardando || !seleccion}
            className="flex items-center gap-1 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
            <Plus className="h-3.5 w-3.5" /> Agregar
          </button>
        </div>
      )}
    </div>
  );
}
