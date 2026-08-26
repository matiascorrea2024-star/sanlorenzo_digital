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
import { getTrackedShareUrl } from "@/lib/tracked-link";
import { relativeTime } from "@/lib/relative-time";

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
  const { trackViewOffer, trackClickWhatsApp, trackShareOffer } = useAnalytics();
  const viendo = useLiveViewers(offerId);
  const { addItem, hasItem } = useCart();

  useEffect(() => {
    (async () => {
      const { data: offer } = await supabase().from("offers").select("*").eq("id", offerId).single();
      if (offer) {
        setOferta(offer);
        const sourceCode = new URLSearchParams(window.location.search).get("src") || undefined;
        trackViewOffer(offer.id, offer.business_id, sourceCode ? "tracked_link" : undefined, sourceCode);
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
  }, [offerId, trackViewOffer]);

  const share = async () => {
    const url = await getTrackedShareUrl({
      offerId,
      businessId: negocio?.id || undefined,
      source: "share",
      fallback: window.location.href,
    });
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
        if (negocio?.id) {
          track(negocio.id, "share");
          trackShareOffer(oferta.id, negocio.id);
        }
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
    if (negocio?.id) {
      track(negocio.id, "share");
      trackShareOffer(oferta.id, negocio.id);
    }
    show("📤 ¡Compartido! +10 pts para tu perfil de vecino", "success");
  };

  if (loading) {
    return (
      <main className="bg-[#0c0a0b] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </main>
    );
  }

  if (!oferta || !negocio) {
    return (
      <main className="bg-[#0c0a0b] min-h-screen flex items-center justify-center text-[var(--text)]">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="font-display text-3xl uppercase tracking-wide">Oferta no encontrada</h1>
          <Link href="/" className="mt-4 inline-block text-[var(--accent)] hover:underline">← Volver al inicio</Link>
        </div>
      </main>
    );
  }

  const img = oferta.image_url || negocio.portada_url || null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const vence = oferta.valid_until ? new Date(oferta.valid_until + "T00:00:00") : null;
  const dias = vence ? Math.round((vence.getTime() - hoy.getTime()) / 86400000) : null;
  const vencido = dias !== null && dias < 0;
  const venceHoy = dias === 0;
  const ahorro = oferta.old_price && oferta.offer_price ? Number(oferta.old_price) - Number(oferta.offer_price) : null;
  const publicado = relativeTime(oferta.created_at);

  return (
    <main className="min-h-screen bg-[#0c0a0b] pb-24 text-[var(--text)]">
      {/* Grilla 7/5: imagen + descripción a la izquierda, precio/acciones a la derecha. */}
      <div className="mx-auto max-w-[1700px] px-4 pt-6 sm:px-6 md:pt-10">
        {vencido && (
          <div className="mb-6 rounded-3xl border border-white/10 bg-[#161314] p-6 text-center">
            <p className="text-2xl">⏰</p>
            <p className="mt-1 font-display text-xl uppercase tracking-wide">Esta oferta ya finalizó</p>
            <p className="mt-1 text-sm text-[#a99b86]">Mirá el negocio para ver sus ofertas activas.</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-12">
          {/* IZQUIERDA: imagen + título superpuesto + descripción */}
          <div className="lg:col-span-7">
            <div className="rounded-[2.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5 shadow-2xl shadow-black/80">
              <div className="relative overflow-hidden rounded-[2.1rem] border border-[var(--ov-05)]">
                <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2 sm:left-6 sm:top-6">
                  {viendo >= 2 && (
                    <span className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md">
                      <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" /></span>
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
                  {img ? (
                    <Image src={img} alt={oferta.title} fill priority quality={92} sizes="(min-width: 1024px) 700px, 100vw" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2a2324] to-[#161314]">
                      <span className="font-display text-6xl uppercase tracking-wide text-white/15">{negocio.category || "Oferta"}</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/85 to-transparent p-6 text-white sm:p-8">
                  <div className="min-w-0">
                    {negocio.category && <p className="mb-2 text-[10px] font-black uppercase tracking-[.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>{negocio.category}</p>}
                    <h1 className="font-display text-4xl uppercase leading-[0.9] tracking-tight sm:text-5xl md:text-6xl">{oferta.title}</h1>
                    {publicado && <p className="mt-2 text-xs font-semibold text-white/70">Publicado {publicado}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md sm:h-14 sm:w-14">
                      <FavoriteButton itemType="offer" itemId={oferta.id} />
                    </div>
                    <button onClick={share} disabled={compartiendo} aria-label="Compartir"
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md transition hover:bg-white/20 active:scale-90 disabled:opacity-60 sm:h-14 sm:w-14">
                      <Share2 className={`h-5 w-5 text-[var(--place)] sm:h-6 sm:w-6 ${compartiendo ? "animate-pulse" : ""}`} />
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
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5"><Truck className="h-5 w-5 text-[var(--accent)]" /></span>
                    <div>
                      <p className="text-xs font-bold text-[var(--muted)]">Envíos</p>
                      <p className="text-sm font-black">{negocio.envio_gratis ? "Gratis en la zona" : "Hace envíos"}</p>
                    </div>
                  </div>
                </div>
              ) : null}
              {(oferta.product || oferta.description) && (
                <div>
                  <h3 className="mb-3 text-xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Detalles</h3>
                  <p className="leading-relaxed text-[var(--muted)]">{oferta.product || oferta.description}</p>
                </div>
              )}
              {canjeados > 0 && (
                <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--ok)]">
                  ✅ {canjeados} {canjeados === 1 ? "persona ya canjeó" : "personas ya canjearon"} esta oferta
                </p>
              )}
            </div>
          </div>

          {/* DERECHA: precio + acciones */}
          <div className="lg:col-span-5">
            <div className="rounded-[2.5rem] border border-[var(--line)] bg-gradient-to-b from-[var(--ov-03)] to-transparent p-6 shadow-xl sm:p-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                {oferta.discount_percent ? (
                  <span className={`rounded-xl px-4 py-1.5 text-sm font-black uppercase tracking-widest text-white shadow-2xl ${venceHoy ? "animate-pulse" : ""}`}
                    style={{ fontFamily: "var(--font-display)", background: "var(--accent)" }}>
                    -{oferta.discount_percent}% OFF
                  </span>
                ) : oferta.precio_prometido ? (
                  <span className="rounded-xl bg-sky-500 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-2xl" style={{ fontFamily: "var(--font-display)" }}>🔒 Precio prometido</span>
                ) : <span />}
                {!vencido && dias !== null && dias <= 2 && oferta.valid_until && <CountdownTimer expiresAt={oferta.valid_until} compact />}
              </div>

              {oferta.old_price && <p className="text-xl font-bold tracking-tight text-[#7d6f5c] line-through decoration-2">{fmt(Number(oferta.old_price))}</p>}
              <div className="flex items-baseline gap-3">
                {oferta.offer_price && <p className="magenta-glow font-display text-7xl leading-none text-[var(--accent)] transition-colors sm:text-8xl">{fmt(Number(oferta.offer_price))}</p>}
                {ahorro && ahorro > 0 && <span className="mb-2 shrink-0 rounded-lg bg-green-500/15 px-2 py-1 text-xs font-black uppercase tracking-wider text-[var(--ok)]" style={{ fontFamily: "var(--font-display)" }}>Ahorrás {fmt(ahorro)}</span>}
              </div>

              <div className="mt-8 space-y-3">
                {negocio.whatsapp && (
                  <a
                    onClick={() => trackClickWhatsApp(negocio.id)}
                    href={`https://wa.me/${String(negocio.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, vi la oferta "${oferta.title}" en La Gran Barata Digital`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn-hard-green hidden h-16 w-full items-center justify-between rounded-2xl bg-green-500 px-8 font-black uppercase tracking-wider text-white sm:flex"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Consultar por WhatsApp
                    <MessageCircle className="h-6 w-6" />
                  </a>
                )}
                <button
                  onClick={() => addItem({
                    id: `oferta-${oferta.id}`, tipo: "oferta", refId: oferta.id, title: oferta.title,
                    price: oferta.offer_price ? Number(oferta.offer_price) : undefined, image: img || undefined,
                    businessId: negocio.id, businessName: negocio.name, businessSlug: negocio.slug, businessWhatsapp: negocio.whatsapp,
                  })}
                  disabled={hasItem(`oferta-${oferta.id}`)}
                  className="flex h-16 w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-8 font-black uppercase tracking-wider text-white transition hover:border-[var(--accent)] hover:bg-white/10 disabled:opacity-60"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {hasItem(`oferta-${oferta.id}`) ? "En el changuito" : "Sumar al changuito"}
                  {hasItem(`oferta-${oferta.id}`) ? <Check className="h-6 w-6 text-[var(--place)]" /> : <ShoppingBasket className="h-6 w-6 text-[var(--place)]" />}
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
              className="mt-6 flex items-center gap-4 rounded-[2rem] border border-white/5 bg-[#161314] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[var(--accent)]">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--accent)]/25 to-[#861642]/25 text-xl font-black">
                {negocio.logo_url ? <Image src={negocio.logo_url} alt={negocio.name} width={64} height={64} className="h-full w-full object-cover" /> : negocio.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-display text-xl uppercase tracking-wide">{negocio.name}</h3>
                  {negocio.status === "verificado" && <Check className="h-4 w-4 shrink-0 text-[var(--place)]" />}
                </div>
                {negocio.address && <p className="truncate text-xs text-[#7d6f5c]">{negocio.address}</p>}
                <span className="mt-1 inline-block text-[11px] font-black uppercase tracking-widest text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>Ver negocio →</span>
              </div>
            </Link>

            {/* "Avisame si vuelve" solo si la oferta ya venció: con la
                oferta activa era una contradicción (¿volver de dónde?). */}
            {vencido && (
              <div className="mt-6">
                <NotifyMeButton businessId={String(negocio.id)} offerId={String(oferta.id)} productName={oferta.title} originalPrice={oferta.offer_price ? Number(oferta.offer_price) : undefined} />
              </div>
            )}
          </div>
        </div>
      </div>
      {negocio.whatsapp && !vencido && (
        <div className="fixed inset-x-0 bottom-14 z-40 border-t border-white/10 bg-[#0c0a0b]/95 p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
          <a
            onClick={() => trackClickWhatsApp(negocio.id)}
            href={`https://wa.me/${String(negocio.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, vi la oferta "${oferta.title}" en La Gran Barata Digital`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 w-full items-center justify-center gap-2 bg-green-600 px-4 py-3 text-sm font-black text-white"
          >
            <MessageCircle className="h-5 w-5" /> Consultar por WhatsApp
          </a>
        </div>
      )}
    </main>
  );
}
