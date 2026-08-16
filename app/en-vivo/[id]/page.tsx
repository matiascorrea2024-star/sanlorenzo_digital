"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ViewerStage from "@/components/live/viewer-stage";
import LiveChat from "@/components/live/live-chat";
import FollowButton from "@/components/business/follow-button";

export default function VerEnVivo() {
  const params = useParams();
  const router = useRouter();
  const streamId = params.id as string;
  const [stream, setStream] = useState<any>(null);
  const [negocio, setNegocio] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [token, setToken] = useState<{ token: string; url: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    const sb = supabase();
    const { data: s } = await sb.from("live_streams").select("*, businesses(*)").eq("id", streamId).maybeSingle();
    if (!s) { setLoading(false); return; }
    setStream(s);
    setNegocio((s as any).businesses);
    const { data: its } = await sb.from("live_stream_items").select("*, products(name, price, old_price, images), offers(title, offer_price, old_price)").eq("live_stream_id", streamId);
    setItems(its || []);
    setLoading(false);
  }, [streamId]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!stream || stream.status !== "live") return;
    (async () => {
      const res = await fetch("/api/live/token", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ live_stream_id: streamId }),
      });
      const j = await res.json();
      if (res.ok) setToken({ token: j.token, url: j.url });
    })();
  }, [stream, streamId]);

  // Refresco simple del estado (por si el negocio termina el vivo
  // mientras alguien lo está mirando).
  useEffect(() => {
    const t = setInterval(cargar, 20000);
    return () => clearInterval(t);
  }, [cargar]);

  if (loading) return <main className="min-h-screen bg-[#120d09] flex items-center justify-center text-white">Cargando...</main>;
  if (!stream || !negocio) {
    return (
      <main className="min-h-screen bg-[#120d09] flex flex-col items-center justify-center gap-3 text-white">
        <p className="text-white/60">Esta transmisión no está disponible.</p>
        <Link href="/en-vivo" className="text-orange-400">← Ver otras transmisiones</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <button onClick={() => router.back()} className="mb-4 text-sm text-orange-400"><ArrowLeft className="mr-1 inline h-4 w-4" />Volver</button>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {stream.status === "live" ? (
              token ? <ViewerStage token={token.token} url={token.url} /> : <div className="flex aspect-video items-center justify-center rounded-2xl border border-white/10 bg-black text-white/40">Conectando...</div>
            ) : stream.status === "scheduled" ? (
              <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-center">
                <p className="font-bold">Todavía no empezó</p>
                {stream.scheduled_at && <p className="text-sm text-white/50">Programado para {new Date(stream.scheduled_at).toLocaleString("es-AR", { weekday: "long", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>}
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/40">Esta transmisión ya terminó.</div>
            )}

            <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-black">{stream.title}</h1>
                <Link href={`/negocio/${negocio.slug}`} className="mt-1 flex items-center gap-1.5 text-sm text-white/60 hover:text-orange-300">
                  <Store className="h-3.5 w-3.5" /> {negocio.name}
                </Link>
                {stream.description && <p className="mt-2 text-sm text-white/70">{stream.description}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <FollowButton businessId={negocio.id} />
                {negocio.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.address)}`} target="_blank" rel="noopener noreferrer"
                    className="rounded-full border border-white/15 p-2 hover:bg-white/10"><MapPin className="h-4 w-4" /></a>
                )}
              </div>
            </div>

            {items.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-black">🛍️ Mostrando ahora</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((it: any) => {
                    const p = it.products;
                    const o = it.offers;
                    if (!p && !o) return null;
                    return (
                      <div key={it.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                        {(p?.images?.[0]) && <img src={p.images[0]} alt="" className="h-14 w-14 rounded-lg object-cover" />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{p?.name || o?.title}</p>
                          <p className="text-sm font-black text-orange-400">${Number(it.promo_price || p?.price || o?.offer_price || 0).toLocaleString("es-AR")}</p>
                        </div>
                        {negocio.whatsapp && (
                          <a href={`https://wa.me/${String(negocio.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola! Te escribo por "${p?.name || o?.title}" que vi en tu vivo`)}`}
                            target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg bg-green-500/15 px-3 py-1.5 text-xs font-bold text-green-300">Consultar</a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <LiveChat liveStreamId={streamId} />
        </div>
      </div>
    </main>
  );
}
