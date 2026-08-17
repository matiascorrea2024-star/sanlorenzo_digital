"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Square, XCircle, Users, Eye, Lock, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { planDe } from "@/lib/plans";
import BroadcasterRoom from "@/components/live/broadcaster-room";
import LiveChat from "@/components/live/live-chat";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

export default function ControlEnVivo() {
  const params = useParams();
  const router = useRouter();
  const { show } = useToast();
  const streamId = params.id as string;
  const [stream, setStream] = useState<any>(null);
  const [negocio, setNegocio] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [token, setToken] = useState<{ token: string; url: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const cargar = useCallback(async () => {
    const sb = supabase();
    const { data: s } = await sb.from("live_streams").select("*").eq("id", streamId).maybeSingle();
    if (!s) { setLoading(false); return; }
    setStream(s);
    const { data: biz } = await sb.from("businesses").select("*").eq("id", s.business_id).maybeSingle();
    setNegocio(biz);
    if (biz) {
      const { data: prods } = await sb.from("products").select("id, name, price, images").eq("business_id", biz.id).eq("active", true);
      setProductos(prods || []);
    }
    const { data: its } = await sb.from("live_stream_items").select("*, products(name, price, images)").eq("live_stream_id", streamId);
    setItems(its || []);
    setLoading(false);
  }, [streamId]);

  useEffect(() => { cargar(); }, [cargar]);

  const empezar = async () => {
    setBusy(true);
    const sb = supabase();
    const { error } = await sb.from("live_streams").update({ status: "live", started_at: new Date().toISOString() }).eq("id", streamId);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo iniciar la transmisión.")}`, "error"); setBusy(false); return; }
    const res = await fetch("/api/live/token", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ live_stream_id: streamId }),
    });
    const j = await res.json();
    if (res.ok) setToken({ token: j.token, url: j.url });
    else show(`❌ ${j.error}`, "error");
    await cargar();
    setBusy(false);
  };

  const finalizar = async () => {
    if (!confirm("¿Terminar la transmisión?")) return;
    setBusy(true);
    const { error } = await supabase().from("live_streams").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", streamId);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo finalizar la transmisión.")}`, "error"); setBusy(false); return; }
    setToken(null);
    await cargar();
    setBusy(false);
  };

  const cancelar = async () => {
    if (!confirm("¿Cancelar esta transmisión programada?")) return;
    const { error } = await supabase().from("live_streams").update({ status: "cancelled" }).eq("id", streamId);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo cancelar la transmisión.")}`, "error"); return; }
    router.push("/dashboard/en-vivo");
  };

  const agregarProducto = async (productId: string) => {
    const { error } = await supabase().from("live_stream_items").insert({ live_stream_id: streamId, product_id: productId });
    if (error) { show(`❌ ${friendlyError(error, "No se pudo agregar el producto.")}`, "error"); return; }
    await cargar();
  };

  const quitarProducto = async (itemId: string) => {
    const { error } = await supabase().from("live_stream_items").delete().eq("id", itemId);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo quitar el producto.")}`, "error"); return; }
    await cargar();
  };

  if (loading) return <main className="min-h-screen bg-[#0c0a0b] flex items-center justify-center text-white">Cargando...</main>;
  if (!stream || !negocio) return <main className="min-h-screen bg-[#0c0a0b] flex items-center justify-center text-white">Transmisión no encontrada.</main>;

  const plan = planDe(negocio);

  return (
    <main className="min-h-screen bg-[#0c0a0b] text-white pb-24">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <Link href="/dashboard/en-vivo" className="text-sm font-bold text-orange-400 hover:text-orange-300"><ArrowLeft className="mr-1 inline h-4 w-4" />Volver</Link>
        <div className="mt-4 mb-8 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-black leading-[0.95] tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-space)" }}>{stream.title}</h1>
          <div className="flex gap-2">
            {stream.status === "scheduled" && (
              <>
                <button onClick={empezar} disabled={busy} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 text-sm font-black disabled:opacity-50">
                  <Play className="h-4 w-4" /> Empezar
                </button>
                <button onClick={cancelar} className="flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-white/60">
                  <XCircle className="h-4 w-4" /> Cancelar
                </button>
              </>
            )}
            {stream.status === "live" && (
              <button onClick={finalizar} disabled={busy} className="flex items-center gap-1.5 rounded-full border border-red-400/40 bg-red-500/15 px-4 py-2 text-sm font-black text-red-300 disabled:opacity-50">
                <Square className="h-4 w-4" /> Terminar
              </button>
            )}
          </div>
        </div>

        {stream.status === "live" && !token && (
          <p className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">Conectando la cámara...</p>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {stream.status === "live" && token ? (
              <BroadcasterRoom token={token.token} url={token.url} />
            ) : stream.status === "ended" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Pico de espectadores", stream.max_viewers],
                  ["Espectadores totales", stream.total_viewers],
                  ["Minutos en vivo", stream.started_at && stream.ended_at ? Math.round((new Date(stream.ended_at).getTime() - new Date(stream.started_at).getTime()) / 60000) : 0],
                  ["Productos mostrados", items.length],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-[1.25rem] border border-white/[.06] bg-white/[.02] p-1">
                    <div className="rounded-[.9rem] border border-white/[.05] bg-black/10 p-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                      <p className="text-2xl font-black text-orange-400 tabular-nums">{value}</p>
                      <p className="text-[10px] text-white/50">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-[1.5rem] border border-white/[.06] bg-white/[.02] text-white/40">
                Todavía no empezaste esta transmisión.
              </div>
            )}

            <div className="mt-4 rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
            <div className="rounded-[1.375rem] border border-white/[.05] bg-black/10 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
              <p className="mb-3 flex items-center gap-1.5 font-black">
                🛍️ Productos en este vivo
                {!plan.vivoProductos && <Lock className="h-3.5 w-3.5 text-orange-400" />}
              </p>
              {!plan.vivoProductos ? (
                <p className="text-sm text-white/50">Mostrar productos durante el vivo es una herramienta de Plan PRO. <Link href="/dashboard/planes" className="font-bold text-orange-400">Mejorar plan →</Link></p>
              ) : (
                <>
                  {items.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-2.5">
                          <span className="text-sm">{it.products?.name}</span>
                          <button onClick={() => quitarProducto(it.id)}><X className="h-4 w-4 text-white/40" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {productos.filter((p) => !items.some((it) => it.product_id === p.id)).length > 0 && (
                    <select onChange={(e) => e.target.value && agregarProducto(e.target.value)} value=""
                      className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none">
                      <option value="">+ Agregar producto...</option>
                      {productos.filter((p) => !items.some((it) => it.product_id === p.id)).map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
            </div>
          </div>

          <LiveChat liveStreamId={streamId} puedeModerar />
        </div>
      </div>
    </main>
  );
}
