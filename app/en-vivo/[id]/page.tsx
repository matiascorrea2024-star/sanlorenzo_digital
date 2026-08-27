"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

  if (loading) return <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text)]">Cargando...</main>;
  if (!stream || !negocio) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-3 text-[var(--text)]">
        <p className="text-[var(--muted)]">Esta transmisión no está disponible.</p>
        <Link href="/en-vivo" className="text-[var(--accent)]">← Ver otras transmisiones</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <button onClick={() => router.back()} className="mb-4 text-sm text-[var(--accent)]"><ArrowLeft className="mr-1 inline h-4 w-4" />Volver</button>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {stream.status === "live" ? (
              token ? <ViewerStage token={token.token} url={token.url} /> : <div className="flex aspect-video items-center justify-center rounded-2xl border border-[var(--line)] bg-black text-[var(--muted2)]">Conectando...</div>
            ) : stream.status === "scheduled" ? (
              <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
                <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                  <p className="font-bold">Todavía no empezó</p>
                  {stream.scheduled_at && <p className="text-sm text-[var(--muted)]">Programado para {new Date(stream.scheduled_at).toLocaleString("es-AR", { weekday: "long", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>}
                </div>
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
                <div className="flex aspect-video items-center justify-center rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] text-[var(--muted2)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">Esta transmisión ya terminó.</div>
              </div>
            )}

            <div className="mt-4 rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-4 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-black" style={{ fontFamily: "var(--font-space)" }}>{stream.title}</h1>
                  <Link href={`/negocio/${negocio.slug}`} className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)]">
                    <Store className="h-3.5 w-3.5" /> {negocio.name}
                  </Link>
                  {stream.description && <p className="mt-2 text-sm text-[var(--text)]/70">{stream.description}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <FollowButton businessId={negocio.id} />
                  {negocio.address && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.address)}`} target="_blank" rel="noopener noreferrer"
                      className="rounded-full border border-[var(--line-strong)] p-2 hover:bg-[var(--ov-10)]"><MapPin className="h-4 w-4" /></a>
                  )}
                </div>
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
                      <div key={it.id} className="rounded-[1.25rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
                        <div className="flex items-center gap-3 rounded-[.9rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-3 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                          {(p?.images?.[0]) && <Image src={p.images[0]} alt={p?.name || "Producto en vivo"} width={56} height={56} className="h-14 w-14 rounded-lg object-cover" />}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">{p?.name || o?.title}</p>
                            <p className="text-sm font-black text-[var(--accent)]">${Number(it.promo_price || p?.price || o?.offer_price || 0).toLocaleString("es-AR")}</p>
                          </div>
                          {negocio.whatsapp && (
                            <a href={`https://wa.me/${String(negocio.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola! Te escribo por "${p?.name || o?.title}" que vi en tu vivo`)}`}
                              target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg bg-green-500/15 px-3 py-1.5 text-xs font-bold text-[var(--ok)]">Consultar</a>
                          )}
                        </div>
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
