"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Share2, MessageCircle, Truck, ShoppingBasket, ShoppingBasket as BasketIcon, Check, Flame, Star, Clock, ShieldCheck, Eye, Globe, MapPin } from "lucide-react";
import CountdownTimer from "@/components/ui/countdown-timer";
import CouponButton from "@/components/offers/coupon-button";
import FavoriteButton from "@/components/ui/favorite-button";
import NotifyMeButton from "@/components/offers/notify-me-button";
import FollowButton from "@/components/business/follow-button";
import ReviewsSection from "@/components/business/reviews-section";
import OpinionVote from "@/components/offers/opinion-vote";
import CategoryCover from "@/components/ui/category-cover";
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
import styles from "./oferta.module.css";

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
  const [relacionadas, setRelacionadas] = useState<any[]>([]);
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
        // Otras ofertas activas del mismo comercio -- 100% reales (mismo
        // business_id, activas, sin contar esta), nunca una grilla
        // rellenada con datos de otro negocio para "que se vea lleno".
        const { data: rel } = await supabase().from("offers").select("*")
          .eq("business_id", offer.business_id).eq("active", true)
          .neq("id", offer.id).order("created_at", { ascending: false }).limit(3);
        if (rel) setRelacionadas(rel);
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
  const plan = planDe(negocio);

  return (
    <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
      {/* Glow ambiental de marca, mismo lenguaje que el resto del sitio. */}
      <div className="aurora-bg -z-10" style={{ position: "fixed" }} aria-hidden="true"><span /><span /><span /></div>

      {/* HERO cinematográfico -- misma estructura que la vista previa que
          se le mostró a Matías: foto a sangre completa, viñeta, breadcrumb,
          badges reales, título en Fraunces itálica, precio abajo. */}
      <section className={styles.hero}>
        <div className={styles.heroShot}>
          {img ? (
            <Image src={img} alt={oferta.title} fill priority quality={92} sizes="100vw" className="object-cover" />
          ) : (
            <CategoryCover category={negocio.category} seed={String(negocio.id)} className="absolute inset-0" />
          )}
        </div>
        <div className={styles.heroVignette} aria-hidden="true" />
        <div className={styles.heroRim} aria-hidden="true" />

        <button onClick={() => router.back()} aria-label="Volver" className={`${styles.backBtn} ${styles.iconBtn} sm:hidden`}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className={styles.topActions}>
          <div className={styles.iconBtn}><FavoriteButton itemType="offer" itemId={oferta.id} /></div>
          <button onClick={share} disabled={compartiendo} aria-label="Compartir" className={styles.iconBtn}>
            <Share2 className={`h-[18px] w-[18px] ${compartiendo ? "animate-pulse" : ""}`} />
          </button>
        </div>

        <div className={`${styles.wrap} ${styles.heroContent} px-4 sm:px-6`}>
          <div className={styles.crumbRow}>
            <Link href="/">Inicio</Link>
            <span className={styles.sep}>/</span>
            <Link href={`/negocio/${negocio.slug}`}>{negocio.name}</Link>
            <span className={styles.sep}>/</span>
            <span className={styles.cur}>{oferta.title}</span>
          </div>

          <div className={styles.badgeRow}>
            {oferta.discount_percent ? (
              <span className={styles.badge}>-{oferta.discount_percent}% OFF</span>
            ) : oferta.precio_prometido ? (
              <span className={styles.badge}>🔒 Precio prometido</span>
            ) : null}
            {viendo >= 2 && <span className={styles.badgeLive}>● {viendo} vecinos viendo ahora</span>}
            {venceHoy && <span className={styles.badge}><Flame className="h-3 w-3" style={{ display: "inline", marginRight: 4 }} />Vence hoy</span>}
            {esTop && !venceHoy && <span className={styles.badgeGhost}>⭐ Top de la semana</span>}
          </div>

          <h1 className={styles.heroTitle}>{oferta.title}</h1>
          {publicado && <p className={styles.heroPublished}>Publicado {publicado}</p>}

          <div className={styles.heroBottom}>
            <div className={styles.priceBlock}>
              {oferta.old_price && <span className={styles.priceOld}>{fmt(Number(oferta.old_price))}</span>}
              {oferta.offer_price && <span className={styles.priceNow}>{fmt(Number(oferta.offer_price))}</span>}
              {ahorro && ahorro > 0 && <span className={styles.savedPill}>Ahorrás {fmt(ahorro)}</span>}
            </div>
            {!vencido && dias !== null && dias <= 2 && oferta.valid_until && <CountdownTimer expiresAt={oferta.valid_until} compact />}
            {!vencido && dias !== null && dias > 2 && <span className={styles.vencePill}>Vence en {dias} días</span>}
          </div>
        </div>
      </section>

      <div className={`${styles.wrap} px-4 pt-10 sm:px-6`}>
        {vencido && (
          <div className="mb-10 rounded-3xl border border-[var(--line-strong)] bg-[var(--surface)] p-6 text-center">
            <p className="text-2xl">⏰</p>
            <p className="mt-1 font-display text-xl uppercase tracking-wide">Esta oferta ya finalizó</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Mirá el negocio para ver sus ofertas activas.</p>
          </div>
        )}

        <section className={styles.lay}>
          {/* IZQUIERDA: comercio + descripción + acciones reales */}
          <div>
            <Link href={`/negocio/${negocio.slug}`} className={styles.shopCard}>
              <div className={styles.shopAva}>
                {negocio.logo_url ? <Image src={negocio.logo_url} alt={negocio.name} width={52} height={52} className="h-full w-full rounded-[.9rem] object-cover" /> : negocio.name[0]}
              </div>
              <div className={styles.shopInfo}>
                <div className={styles.shopName}>
                  {negocio.name}
                  {negocio.status === "verificado" && <Check className="h-3.5 w-3.5" />}
                  {plan.name !== "Gratis" && (
                    <span className="shrink-0 rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-sky-400">{plan.name}</span>
                  )}
                </div>
                <div className={styles.shopMeta}>{negocio.category || "Comercio"}{negocio.address ? ` · ${negocio.address}` : ""}</div>
              </div>
              <span className={styles.shopGo}>Ver perfil →</span>
            </Link>

            {(oferta.product || oferta.description) && (
              <p className={styles.desc}>{oferta.product || oferta.description}</p>
            )}
            {canjeados > 0 && (
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--ok)]">
                ✅ {canjeados} {canjeados === 1 ? "persona ya canjeó" : "personas ya canjearon"} esta oferta
              </p>
            )}

            <div className={styles.actionRow}>
              {negocio.whatsapp && !vencido && (
                <a
                  onClick={() => trackClickWhatsApp(negocio.id)}
                  href={`https://wa.me/${String(negocio.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, vi la oferta "${oferta.title}" en La Gran Barata Digital`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className={styles.btnGlow}
                >
                  Consultar por WhatsApp <MessageCircle className="h-4 w-4" />
                </a>
              )}
              {viendo >= 1 && <span className={styles.interestPill}>🔥 <b>{viendo}</b> {viendo === 1 ? "vecino la vio" : "vecinos la vieron"}</span>}
            </div>

            <div className={styles.actionCol}>
              <button
                onClick={() => addItem({
                  id: `oferta-${oferta.id}`, tipo: "oferta", refId: oferta.id, title: oferta.title,
                  price: oferta.offer_price ? Number(oferta.offer_price) : undefined, image: img || undefined,
                  businessId: negocio.id, businessName: negocio.name, businessSlug: negocio.slug, businessWhatsapp: negocio.whatsapp,
                })}
                disabled={hasItem(`oferta-${oferta.id}`)}
                className={styles.btnGhost}
              >
                {hasItem(`oferta-${oferta.id}`) ? "En el changuito" : "Sumar al changuito"}
                {hasItem(`oferta-${oferta.id}`) ? <Check className="h-4 w-4" /> : <ShoppingBasket className="h-4 w-4" />}
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
                className={styles.btnSoft}
              >
                Sumar a Mi Barata <BasketIcon className="h-4 w-4" />
              </button>
            </div>

            {oferta.es_grupal && oferta.meta_participantes && (
              <div className="mt-6">
                <GroupDealPanel offerId={oferta.id} metaParticipantes={oferta.meta_participantes} initialActivada={!!oferta.grupal_activada} offerTitle={oferta.title} />
              </div>
            )}

            {/* Cupón: uno solo, protagonista -- herramienta de Plan PRO, no se
                muestra el botón si el negocio no lo tiene habilitado (evita
                ofrecer algo que después falla al tocarlo). */}
            {plan.cupones && (
              <div className="mt-6">
                <CouponButton offerId={oferta.id} businessId={negocio.id} offerTitle={oferta.title} />
              </div>
            )}

            {/* Opinión real de vecinos (Sí/No, un voto por persona,
                persistente) -- no es un número inventado, es
                lib/offer_opinions con RLS real. */}
            {!vencido && (
              <div className="mt-6">
                <OpinionVote offerId={oferta.id} />
              </div>
            )}

            {/* "Avisame si vuelve" solo si la oferta ya venció: con la
                oferta activa era una contradicción (¿volver de dónde?). */}
            {vencido && (
              <div className="mt-6">
                <NotifyMeButton businessId={String(negocio.id)} offerId={String(oferta.id)} productName={oferta.title} originalPrice={oferta.offer_price ? Number(oferta.offer_price) : undefined} />
              </div>
            )}
          </div>

          {/* DERECHA: chips de info real + contacto + seguir */}
          <div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoIcon}><Clock className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className={styles.infoLabel}>Horario</p>
                  <p className={styles.infoValue}>{abierto === null ? "Consultar" : abierto ? "Abierto ahora" : "Cerrado ahora"}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoIcon}><Truck className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className={styles.infoLabel}>Envío</p>
                  <p className={styles.infoValue}>{negocio.envio_gratis ? "Gratis en la zona" : negocio.hace_envios ? "Hace envíos" : "Retirás en el local"}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoIcon}><ShieldCheck className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className={styles.infoLabel}>Comercio</p>
                  <p className={styles.infoValue}>{negocio.status === "verificado" ? "Verificado" : "En la plataforma"}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoIcon}><Eye className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className={styles.infoLabel}>Interés</p>
                  <p className={styles.infoValue}>{viendo >= 1 ? `${viendo} viendo ahora` : "Sé el primero"}</p>
                </div>
              </div>
            </div>

            {negocio.rating > 0 && (
              <a href="#resenas" className="mt-5 flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1 font-display text-xl font-black text-[var(--text)]">
                  <Star className="h-4 w-4 fill-[var(--warn)] text-[var(--warn)]" /> {Number(negocio.rating).toFixed(1)}
                </span>
                {negocio.reviews > 0 && (
                  <span className="font-bold text-[var(--muted)] underline decoration-[var(--line-strong)] underline-offset-2">{negocio.reviews} reseñas del comercio</span>
                )}
              </a>
            )}

            <div className={`${styles.contactRow} mt-5`}>
              {negocio.whatsapp && (
                <a className={styles.contactWa} href={`https://wa.me/${String(negocio.whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mb-1 h-4 w-4" style={{ display: "inline" }} /> WhatsApp
                </a>
              )}
              {negocio.instagram && (
                <a className={styles.contactLink} href={`https://instagram.com/${negocio.instagram}`} target="_blank" rel="noopener noreferrer">
                  📷 Instagram
                </a>
              )}
              {negocio.website && (
                <a className={styles.contactLink} href={negocio.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="mb-1 h-4 w-4" style={{ display: "inline" }} /> Web
                </a>
              )}
              {negocio.address && (
                <a className={styles.contactLink} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.address)}`} target="_blank" rel="noopener noreferrer">
                  <MapPin className="mb-1 h-4 w-4" style={{ display: "inline" }} /> Cómo llegar
                </a>
              )}
            </div>

            <div className="mt-5">
              <FollowButton businessId={negocio.id} />
            </div>
          </div>
        </section>

        {/* Reseñas reales del comercio -- mismo componente completo que la
            ficha (fotos, visita verificada, respuestas). */}
        <section id="resenas" className={styles.block}>
          <div className={styles.secHead}>
            <h2>Lo que dicen los vecinos</h2>
          </div>
          <ReviewsSection businessId={negocio.id} baseRating={negocio.rating || 0} baseCount={negocio.reviews || 0} />
        </section>

        {/* "Más de [negocio]" -- otras ofertas activas reales del mismo
            comercio (misma business_id). Si no hay ninguna, la sección
            no se muestra: nada de tarjetas de relleno. */}
        {relacionadas.length > 0 && (
          <section className={styles.block}>
            <div className={styles.secHead}>
              <h2>Más de {negocio.name}</h2>
              <Link href={`/negocio/${negocio.slug}`}>Ver perfil completo →</Link>
            </div>
            <div className={styles.cards3}>
              {relacionadas.map((r) => (
                <Link key={r.id} href={`/oferta/${r.id}`} className={styles.pcard}>
                  <div className={styles.pcardShot}>
                    {r.image_url ? (
                      <Image src={r.image_url} alt={r.title} fill sizes="(min-width: 860px) 33vw, 50vw" className="object-cover" />
                    ) : (
                      <CategoryCover category={negocio.category} seed={String(r.id)} className="absolute inset-0" />
                    )}
                    {r.discount_percent ? <span className={styles.pcardBadge}>-{r.discount_percent}%</span> : null}
                  </div>
                  <div className={styles.pcardBody}>
                    <div className={styles.pcardName}>{r.title}</div>
                    {r.offer_price && <span className={styles.pcardPrice}>{fmt(Number(r.offer_price))}</span>}
                    {r.old_price && <span className={styles.pcardOld}>{fmt(Number(r.old_price))}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
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
