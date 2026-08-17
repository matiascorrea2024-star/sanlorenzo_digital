"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Share2, MessageCircle, Truck, ShoppingBasket, Check, Flame } from "lucide-react";
import CountdownTimer from "@/components/ui/countdown-timer";
import CouponButton from "@/components/offers/coupon-button";
import FavoriteButton from "@/components/ui/favorite-button";
import NotifyMeButton from "@/components/offers/notify-me-button";
import { track } from "@/lib/track";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import { planDe } from "@/lib/plans";
import { useToast } from "@/components/ui/toast";
import { useLiveViewers } from "@/lib/hooks/use-live-viewers";
import GroupDealPanel from "@/components/offers/group-deal-panel";
import { generarImagenOferta } from "@/lib/share-image";
import { useCart } from "@/lib/cart-context";

const fmt = (n: number) => "$" + n.toLocaleString("es-AR");

export default function OfertaPage() {
  const params = useParams();
  const router = useRouter();
  const { show } = useToast();
  const offerId = params.id as string;
  const [oferta, setOferta] = useState<any>(null);
  const [negocio, setNegocio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [canjeados, setCanjeados] = useState(0);
  const [compartiendo, setCompartiendo] = useState(false);
  const { trackViewOffer } = useAnalytics();
  const viendo = useLiveViewers(offerId);
  const { addItem, hasItem } = useCart();

  useEffect(() => {
    (async () => {
      const { data: offer } = await supabase().from("offers").select("*").eq("id", offerId).single();
      if (offer) {
        setOferta(offer);
        trackViewOffer(offer.id, offer.business_id);
        const { data: biz } = await supabase().from("businesses").select("*").eq("id", offer.business_id).single();
        if (biz) setNegocio(biz);
        // Prueba social real: cupones que YA se canjearon para esta oferta
        // (nunca un número inventado -- si nadie canjeó todavía, no se
        // muestra nada, en vez de arrancar en un "0" que se ve peor que
        // no mostrar el bloque).
        const { count } = await supabase().from("coupons")
          .select("*", { count: "exact", head: true })
          .eq("offer_id", offer.id).eq("status", "redeemed");
        setCanjeados(count || 0);
      }
      setLoading(false);
    })();
  }, [offerId]);

  const share = async () => {
    const url = window.location.href;
    const text = `🔥 ${oferta.title}\n💰 ${oferta.offer_price ? fmt(Number(oferta.offer_price)) : "OFERTA"}\n📍 ${negocio?.name || "San Lorenzo"}\n\n#LaGranBarataSanLorenzo`;

    // Preferimos compartir la imagen generada (lista para Instagram Story /
    // WhatsApp Status) cuando el navegador lo permite -- publicidad gratis
    // para el negocio, en un toque. Si no, cae al share de texto de siempre.
    setCompartiendo(true);
    let file: File | null = null;
    try {
      const blob = await generarImagenOferta(oferta, negocio);
      file = new File([blob], "oferta.png", { type: "image/png" });
    } catch {
      file = null; // no se pudo generar la imagen -- seguimos con el texto
    }
    setCompartiendo(false);

    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: oferta.title, text });
        if (negocio?.id) track(negocio.id, "share");
        show("📤 ¡Compartido! +10 pts para tu perfil de vecino", "success");
      } catch {
        // Usuario canceló el share de la imagen -- no reintentamos con
        // texto, sería un segundo cartel molesto justo después de cerrar.
      }
      return;
    }

    if (navigator.share) {
      try { await navigator.share({ title: oferta.title, text, url }); } catch { return; }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
    }
    if (negocio?.id) track(negocio.id, "share");
    show("📤 ¡Compartido! +10 pts para tu perfil de vecino", "success");
  };

  if (loading) {
    return (
      <main className="bg-[#0c0a0b] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </main>
    );
  }

  if (!oferta || !negocio) {
    return (
      <main className="bg-[#0c0a0b] min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-space)" }}>Oferta no encontrada</h1>
          <Link href="/" className="mt-4 inline-block text-orange-400">← Volver al inicio</Link>
        </div>
      </main>
    );
  }

  const img = oferta.image_url || negocio.portada_url || "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85";
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const vence = oferta.valid_until ? new Date(oferta.valid_until + "T00:00:00") : null;
  const dias = vence ? Math.round((vence.getTime() - hoy.getTime()) / 86400000) : null;
  const vencido = dias !== null && dias < 0;
  const venceHoy = dias === 0;
  const ahorro = oferta.old_price && oferta.offer_price ? Number(oferta.old_price) - Number(oferta.offer_price) : null;

  return (
    <main className="bg-[#0c0a0b] min-h-screen text-white pb-24">
      {/* Grilla editorial 7/5, calco del mockup aprobado: imagen +
          descripción a la izquierda, precio/acciones a la derecha. */}
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {vencido && (
          <div className="mb-6 rounded-2xl border-2 border-white/20 bg-white/5 p-6 text-center">
            <p className="text-2xl">⏰</p>
            <p className="mt-1 text-lg font-black">Esta oferta ya finalizó</p>
            <p className="mt-1 text-sm text-white/60">Mirá el negocio para ver sus ofertas activas.</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-12">
          {/* IZQUIERDA: imagen + título superpuesto + descripción */}
          <div className="lg:col-span-7">
            <div className="rounded-[2.5rem] border border-white/[.06] bg-white/[.01] p-1.5 shadow-2xl shadow-black/80">
              <div className="relative overflow-hidden rounded-[2.1rem] border border-white/[.05]">
                <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2 sm:left-6 sm:top-6">
                  {viendo >= 2 && (
                    <span className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md">
                      <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" /></span>
                      <span className="text-[11px] font-black uppercase tracking-wider">{viendo} vecinos viendo ahora</span>
                    </span>
                  )}
                  {venceHoy && (
                    <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-red-600 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider">
                      <Flame className="h-3.5 w-3.5" /> Vence hoy
                    </span>
                  )}
                </div>
                <div className="aspect-[4/3] w-full">
                  <Image src={img} alt={oferta.title} fill priority quality={92} sizes="(min-width: 1024px) 700px, 100vw" className="object-cover" />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/85 to-transparent p-6 sm:p-8">
                  <div className="min-w-0">
                    {negocio.category && <p className="mb-2 text-[10px] font-black uppercase tracking-[.35em] text-white/60">{negocio.category}</p>}
                    <h1 className="text-3xl font-black leading-[0.95] sm:text-4xl md:text-5xl" style={{ fontFamily: "var(--font-space)" }}>{oferta.title}</h1>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md sm:h-14 sm:w-14">
                      <FavoriteButton itemType="offer" itemId={oferta.id} />
                    </div>
                    <button onClick={share} disabled={compartiendo} aria-label="Compartir"
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md transition hover:bg-white/20 active:scale-90 disabled:opacity-60 sm:h-14 sm:w-14">
                      <Share2 className={`h-5 w-5 text-sky-400 sm:h-6 sm:w-6 ${compartiendo ? "animate-pulse" : ""}`} />
                    </button>
                  </div>
                </div>
                <button onClick={() => router.back()} aria-label="Volver"
                  className="absolute left-4 top-4 rounded-full bg-black/50 p-2 backdrop-blur-md hover:bg-black/70 sm:hidden">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-8 space-y-6 px-2">
              {oferta.hace_envios || negocio.hace_envios ? (
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5"><Truck className="h-5 w-5 text-orange-400" /></span>
                    <div>
                      <p className="text-xs font-bold text-white/50">Envíos</p>
                      <p className="text-sm font-black">{negocio.envio_gratis ? "Gratis en la zona" : "Hace envíos"}</p>
                    </div>
                  </div>
                </div>
              ) : null}
              {(oferta.product || oferta.description) && (
                <div>
                  <h3 className="mb-3 text-xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Detalles</h3>
                  <p className="leading-relaxed text-white/70">{oferta.product || oferta.description}</p>
                </div>
              )}
              {canjeados > 0 && (
                <p className="flex items-center gap-1.5 text-sm font-bold text-green-300">
                  ✅ {canjeados} {canjeados === 1 ? "persona ya canjeó" : "personas ya canjearon"} esta oferta
                </p>
              )}
            </div>
          </div>

          {/* DERECHA: precio + acciones */}
          <div className="lg:col-span-5">
            <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/[.03] to-transparent p-6 shadow-xl sm:p-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                {oferta.discount_percent ? (
                  <span className="rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange-400">-{oferta.discount_percent}% de ahorro</span>
                ) : oferta.precio_prometido ? (
                  <span className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-sky-400">🔒 Precio prometido</span>
                ) : <span />}
                {!vencido && dias !== null && dias <= 2 && oferta.valid_until && <CountdownTimer expiresAt={oferta.valid_until} compact />}
              </div>

              {oferta.old_price && <p className="text-2xl tracking-tight text-white/40 line-through" style={{ fontFamily: "var(--font-ticket)" }}>{fmt(Number(oferta.old_price))}</p>}
              <div className="flex items-baseline gap-3">
                {oferta.offer_price && <p className="text-6xl font-black tracking-tighter sm:text-7xl" style={{ fontFamily: "var(--font-ticket)" }}>{fmt(Number(oferta.offer_price))}</p>}
                {ahorro && ahorro > 0 && <span className="mb-2 shrink-0 text-sm font-black text-green-400">Ahorrás {fmt(ahorro)}</span>}
              </div>

              <div className="mt-8 space-y-3">
                {negocio.whatsapp && (
                  <a
                    href={`https://wa.me/${String(negocio.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, vi la oferta "${oferta.title}" en La Gran Barata Digital`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex h-16 w-full items-center justify-between rounded-2xl bg-green-600 px-8 font-black text-white transition hover:bg-green-500"
                  >
                    Consultar por WhatsApp
                    <MessageCircle className="h-6 w-6" />
                  </a>
                )}
                <button
                  onClick={() => addItem({
                    id: `oferta-${oferta.id}`, tipo: "oferta", refId: oferta.id, title: oferta.title,
                    price: oferta.offer_price ? Number(oferta.offer_price) : undefined, image: img,
                    businessId: negocio.id, businessName: negocio.name, businessSlug: negocio.slug, businessWhatsapp: negocio.whatsapp,
                  })}
                  disabled={hasItem(`oferta-${oferta.id}`)}
                  className="flex h-16 w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-8 font-black text-white transition hover:bg-white/10 disabled:opacity-60"
                >
                  {hasItem(`oferta-${oferta.id}`) ? "En el changuito" : "Sumar al changuito"}
                  {hasItem(`oferta-${oferta.id}`) ? <Check className="h-6 w-6 text-sky-400" /> : <ShoppingBasket className="h-6 w-6 text-sky-400" />}
                </button>
              </div>
            </div>

            {oferta.es_grupal && oferta.meta_participantes && (
              <div className="mt-6">
                <GroupDealPanel offerId={oferta.id} metaParticipantes={oferta.meta_participantes} initialActivada={!!oferta.grupal_activada} offerTitle={oferta.title} />
              </div>
            )}

            {/* Cupón: uno solo, protagonista -- herramienta de Plan PRO, no se
                muestra el botón si el negocio no lo tiene habilitado (evita
                ofrecer algo que después falla al tocarlo). */}
            {planDe(negocio).cupones && (
              <div className="mt-6">
                <CouponButton offerId={oferta.id} businessId={negocio.id} offerTitle={oferta.title} />
              </div>
            )}

            <Link href={`/negocio/${negocio.slug}`}
              className="mt-6 flex items-center gap-4 rounded-[2rem] border border-white/[.05] bg-white/[.02] p-6 transition hover:border-orange-400/30">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-600/20 text-xl font-black">
                {negocio.logo_url ? <Image src={negocio.logo_url} alt={negocio.name} width={64} height={64} className="h-full w-full object-cover" /> : negocio.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-lg font-black">{negocio.name}</h3>
                  {negocio.status === "verificado" && <Check className="h-4 w-4 shrink-0 text-sky-400" />}
                </div>
                {negocio.address && <p className="truncate text-xs text-white/40">{negocio.address}</p>}
                <span className="mt-1 inline-block text-xs font-black uppercase tracking-widest text-orange-400">Ver negocio →</span>
              </div>
            </Link>

            <div className="mt-6">
              <NotifyMeButton businessId={String(negocio.id)} offerId={String(oferta.id)} productName={oferta.title} originalPrice={oferta.offer_price ? Number(oferta.offer_price) : undefined} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
