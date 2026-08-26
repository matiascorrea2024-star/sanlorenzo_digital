"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Share2, MessageCircle, Truck, ShoppingBasket, ShoppingBasket as BasketIcon, Check, Flame, Star, Clock, ShieldCheck, Eye } from "lucide-react";
import CountdownTimer from "@/components/ui/countdown-timer";
import CouponButton from "@/components/offers/coupon-button";
import FavoriteButton from "@/components/ui/favorite-button";
import NotifyMeButton from "@/components/offers/notify-me-button";
import FollowButton from "@/components/business/follow-button";
import ReviewsSection from "@/components/business/reviews-section";
import OpinionVote from "@/components/offers/opinion-vote";
import { track } from "@/lib/track";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import { planDe } from "@/lib/plans";
import { useToast } from "@/components/ui/toast";
import { useLiveViewers } from "@/lib/hooks/use-live-viewers";
import GroupDealPanel from "@/components/offers/group-deal-panel";
import { generarImagenOferta } from "@/lib/share-image";
import { useCart } from "@/lib/cart-context";
import { getTrackedShareUrl } from "@/lib/tracked-link";
import { sumarAMiBarata } from "@/lib/mi-barata";
import { useAuth } from "@/components/providers/auth-provider";
import { relativeTime } from "@/lib/relative-time";
import { estaAbiertoAhora } from "@/lib/horarios";
import { calcSDLScore } from "@/lib/sdl-score";

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
  const { user } = useAuth();

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

  // "Abierto ahora": calculado en efecto (no en render) para no
  // desincronizar la hidratación server/cliente -- mismo patrón que la
  // ficha del negocio (app/negocio/[slug]/client.tsx).
  const [abierto, setAbierto] = useState<boolean | null>(null);
  useEffect(() => {
    if (!negocio) return;
    const porHorario = estaAbiertoAhora(negocio.schedule_json);
    setAbierto(porHorario === null ? (negocio.open ?? null) : porHorario);
  }, [negocio]);

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
      <main className="bg-[var(--bg)] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </main>
    );
  }

  if (!oferta || !negocio) {
    return (
      <main className="bg-[var(--bg)] min-h-screen flex items-center justify-center text-[var(--text)]">
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
  // Mismo índice que usan las OfferCard en toda la web (lib/sdl-score.ts) --
  // "Top" acá significa lo mismo que en cualquier otra tarjeta del sitio,
  // no es un badge inventado para esta página en particular.
  const sdlScore = calcSDLScore({ descuento: oferta.discount_percent || 0, rating: negocio.rating || 0, diasRestantes: dias });
  const esTop = sdlScore >= 80;
  const codigoCorto = String(oferta.id).slice(0, 8).toUpperCase();
  const plan = planDe(negocio);

  return (
    <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
      {/* Glow ambiental de marca, mismo lenguaje que el resto del sitio V3. */}
      <div className="pointer-events-none fixed left-[-10%] top-[-15%] -z-10 h-[60%] w-[60%] rounded-full bg-[#d12f68] opacity-[0.06] blur-[180px]" aria-hidden="true" />

      <div className="mx-auto max-w-[1700px] px-4 pt-6 sm:px-6 md:pt-10">
        {vencido && (
          <div className="mb-6 rounded-3xl border border-[var(--line-strong)] bg-[var(--surface)] p-6 text-center">
            <p className="text-2xl">⏰</p>
            <p className="mt-1 font-display text-xl uppercase tracking-wide">Esta oferta ya finalizó</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Mirá el negocio para ver sus ofertas activas.</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-12">
          {/* IZQUIERDA: imagen + título superpuesto + detalles + reseñas reales */}
          <div className="lg:col-span-7">
            <div className="rounded-[2.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5 shadow-2xl shadow-black/80">
              <div className="relative overflow-hidden rounded-[2.3rem] border border-[var(--ov-05)]">
                <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2 sm:left-6 sm:top-6">
                  {viendo >= 2 && (
                    <span className="flex items-center gap-2 rounded-xl border border-[var(--line-strong)] bg-black/50 px-3.5 py-2 backdrop-blur-md">
                      <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" /></span>
                      <span className="text-[11px] font-black uppercase tracking-wider">{viendo} vecinos viendo ahora</span>
                    </span>
                  )}
                  {venceHoy && (
                    <span className="flex items-center gap-1.5 rounded-xl border border-[var(--line-strong)] bg-red-600 px-3.5 py-2 text-[11px] font-black uppercase tracking-wider">
                      <Flame className="h-3.5 w-3.5" /> Vence hoy
                    </span>
                  )}
                  {esTop && !venceHoy && (
                    <span className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[11px] font-black uppercase tracking-wider text-black shadow-2xl">
                      ⭐ Top de la semana
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--line-strong)] bg-[var(--ov-10)] backdrop-blur-md sm:h-14 sm:w-14">
                      <FavoriteButton itemType="offer" itemId={oferta.id} />
                    </div>
                    <button onClick={share} disabled={compartiendo} aria-label="Compartir"
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--line-strong)] bg-[var(--ov-10)] backdrop-blur-md transition hover:bg-white/20 active:scale-90 disabled:opacity-60 sm:h-14 sm:w-14">
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
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--ov-05)]"><Truck className="h-5 w-5 text-[var(--accent)]" /></span>
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

            {/* Reseñas reales del comercio -- mismo componente completo que
                la ficha (fotos, visita verificada, respuestas). Antes solo
                vivía en /negocio/[slug]; acá aporta confianza justo donde
                más importa: el momento de decidir. */}
            <div id="resenas" className="mt-14 scroll-mt-24 px-2">
              <div className="mb-8 flex items-center gap-4">
                <div className="h-9 w-1.5 rounded-full bg-[var(--accent)]" />
                <h2 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">Lo que dicen los vecinos</h2>
              </div>
              <ReviewsSection businessId={negocio.id} baseRating={negocio.rating || 0} baseCount={negocio.reviews || 0} />
            </div>
          </div>

          {/* DERECHA: precio + acciones + comercio */}
          <div className="lg:col-span-5">
            <div className="rounded-[2.75rem] border border-[var(--line)] bg-[var(--surface2)] p-6 shadow-xl sm:p-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-[.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>Oferta #{codigoCorto}</span>
                {!vencido && dias !== null && dias <= 2 && oferta.valid_until && <CountdownTimer expiresAt={oferta.valid_until} compact />}
              </div>

              <h2 className="font-display text-3xl uppercase leading-[0.95] tracking-tight sm:text-4xl">{oferta.title}</h2>

              {negocio.rating > 0 && (
                <a href="#resenas" className="mt-3 flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-1 font-display text-xl font-black text-[var(--text)]">
                    <Star className="h-4 w-4 fill-[var(--warn)] text-[var(--warn)]" /> {Number(negocio.rating).toFixed(1)}
                  </span>
                  {negocio.reviews > 0 && (
                    <span className="font-bold text-[var(--muted)] underline decoration-[var(--line-strong)] underline-offset-2">{negocio.reviews} reseñas del comercio</span>
                  )}
                </a>
              )}

              <div className="mt-5 mb-2 flex flex-wrap items-center gap-2">
                {oferta.discount_percent ? (
                  <span className={`rounded-xl px-4 py-1.5 text-sm font-black uppercase tracking-widest text-white shadow-2xl ${venceHoy ? "animate-pulse" : ""}`}
                    style={{ fontFamily: "var(--font-display)", background: "var(--accent)" }}>
                    -{oferta.discount_percent}% OFF
                  </span>
                ) : oferta.precio_prometido ? (
                  <span className="rounded-xl bg-sky-500 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-2xl" style={{ fontFamily: "var(--font-display)" }}>🔒 Precio prometido</span>
                ) : null}
              </div>

              {oferta.old_price && <p className="text-xl font-bold tracking-tight text-[var(--muted2)] line-through decoration-2">{fmt(Number(oferta.old_price))}</p>}
              <div className="flex items-baseline gap-3">
                {oferta.offer_price && <p className="magenta-glow font-display text-7xl leading-none text-[var(--accent)] transition-colors sm:text-8xl">{fmt(Number(oferta.offer_price))}</p>}
                {ahorro && ahorro > 0 && <span className="mb-2 shrink-0 rounded-lg bg-green-500/15 px-2 py-1 text-xs font-black uppercase tracking-wider text-[var(--ok)]" style={{ fontFamily: "var(--font-display)" }}>Ahorrás {fmt(ahorro)}</span>}
              </div>

              {/* Chips de info real -- nada acá es inventado: horario sale
                  del cálculo real (lib/horarios.ts), envío y verificación
                  son campos reales del negocio, "interés ahora" es el mismo
                  contador de vecinos viendo que ya usa el resto del sitio. */}
              <div className="mt-8 grid grid-cols-2 gap-4 border-y border-[var(--line)] py-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ov-05)] text-[var(--accent)]"><Clock className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--muted2)]">Horario</p>
                    <p className="truncate text-sm font-black">{abierto === null ? "Consultar" : abierto ? "Abierto ahora" : "Cerrado ahora"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ov-05)] text-[var(--accent)]"><Truck className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--muted2)]">Envío</p>
                    <p className="truncate text-sm font-black">{negocio.envio_gratis ? "Gratis en la zona" : negocio.hace_envios ? "Hace envíos" : "Retirás en el local"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ov-05)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--muted2)]">Comercio</p>
                    <p className="truncate text-sm font-black">{negocio.status === "verificado" ? "Verificado" : "En la plataforma"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ov-05)] text-[var(--accent)]"><Eye className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--muted2)]">Interés</p>
                    <p className="truncate text-sm font-black">{viendo >= 1 ? `${viendo} viendo ahora` : "Sé el primero"}</p>
                  </div>
                </div>
              </div>

              {/* Opinión real de vecinos (Sí/No, un voto por persona,
                  persistente) -- no es un número inventado como en el
                  mockup original, es lib/offer_opinions con RLS real. */}
              {!vencido && (
                <div className="mt-8">
                  <OpinionVote offerId={oferta.id} />
                </div>
              )}

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
                  className="flex h-16 w-full items-center justify-between rounded-2xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-8 font-black uppercase tracking-wider text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[var(--ov-10)] disabled:opacity-60"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {hasItem(`oferta-${oferta.id}`) ? "En el changuito" : "Sumar al changuito"}
                  {hasItem(`oferta-${oferta.id}`) ? <Check className="h-6 w-6 text-[var(--place)]" /> : <ShoppingBasket className="h-6 w-6 text-[var(--place)]" />}
                </button>
                {/* Mi Barata: lista de compras planificada (persistente,
                    multi-negocio). Distinto del changuito, que es checkout. */}
                <button
                  onClick={async () => {
                    if (!user) {
                      router.push("/login?redirect=/oferta/" + oferta.id);
                      return;
                    }
                    const res = await sumarAMiBarata(user.id, oferta.id);
                    if (res === "agregada") show("🧺 Sumada a Mi Barata. Mirá tu vuelta en /mi-barata", "success");
                    else if (res === "ya-estaba") show("Ya estaba en tu barata", "info");
                    else show("❌ No se pudo sumar. Probá de nuevo.", "error");
                  }}
                  className="flex h-14 w-full items-center justify-between rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-8 text-sm font-black uppercase tracking-wider text-[var(--accent)] transition hover:bg-[var(--accent)]/15"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Sumar a Mi Barata
                  <BasketIcon className="h-5 w-5" />
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

            {/* Tarjeta del comercio -- logo, nombre, plan real, rating/reseñas
                reales (columnas de businesses), Seguir + Ver perfil. */}
            <div className="mt-6 rounded-[2.5rem] border border-[var(--line)] bg-[var(--surface)] p-7 transition-all duration-500 hover:border-[var(--accent)]/50">
              <Link href={`/negocio/${negocio.slug}`} className="flex items-center gap-5">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--accent)]/25 to-[#861642]/25 text-xl font-black">
                  {negocio.logo_url ? <Image src={negocio.logo_url} alt={negocio.name} width={64} height={64} className="h-full w-full object-cover" /> : negocio.name[0]}
                  {negocio.status === "verificado" && (
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-sky-500">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-display text-xl uppercase tracking-wide">{negocio.name}</h3>
                    {plan.name !== "Gratis" && (
                      <span className="shrink-0 rounded-lg bg-sky-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-sky-400">{plan.name}</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs font-bold text-[var(--muted2)]">
                    {negocio.rating > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-[var(--warn)] text-[var(--warn)]" /> {Number(negocio.rating).toFixed(1)} · {negocio.reviews || 0} reseñas</span>}
                    {negocio.address && <span className="truncate">{negocio.address}</span>}
                  </div>
                </div>
              </Link>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <FollowButton businessId={negocio.id} />
                <Link href={`/negocio/${negocio.slug}`}
                  className="flex items-center justify-center rounded-full border border-[var(--line-strong)] px-3 py-1 text-xs font-black uppercase tracking-widest text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                  Ver perfil →
                </Link>
              </div>
            </div>

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
        <div className="fixed inset-x-0 bottom-14 z-40 border-t border-[var(--line-strong)] bg-[var(--bg)]/95 p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
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
