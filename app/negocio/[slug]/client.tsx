"use client";
import LevelUpCard from "@/components/ui/level-up-card";
import DivisionFrame from "@/components/ui/division-frame";
import CategoryCover from "@/components/ui/category-cover";

import ReportButton from "@/components/business/report-button";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import { useLiveViewers } from "@/lib/hooks/use-live-viewers";
import { track } from "@/lib/track";
import { useToast } from "@/components/ui/toast";
import { estaAbiertoAhora } from "@/lib/horarios";
import { safeJsonLd } from "@/lib/json-ld";
import { MapPin, Clock, Phone, MessageCircle, Share2, ArrowLeft, ExternalLink, Flame, Star, Search, Truck, Navigation, Package, ShoppingBasket, Check, Tv } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import Badge from "@/components/ui/badge";
import BusinessMap from "@/components/business/map";
import ReviewsSection from "@/components/business/reviews-section";
import Chat from "@/components/business/chat";
import FollowButton from "@/components/business/follow-button";
import NotifyMeButton from "@/components/offers/notify-me-button";
import FavoriteButton from "@/components/ui/favorite-button";
import LevelBadge from "@/components/business/level-badge";
import BusinessLiveBadge from "@/components/business/live-badge";
import { planDe } from "@/lib/plans";
import { generarImagenNegocio } from "@/lib/share-image";
import ResponseBadge from "@/components/business/response-badge";
import LoyaltyCard from "@/components/business/loyalty-card";
import BookingWidget from "@/components/business/booking-widget";
import { hoyArgentina } from "@/lib/fecha-ar";
import { getTrackedShareUrl } from "@/lib/tracked-link";
import { relativeTime } from "@/lib/relative-time";

const CATEGORY_IMAGES: Record<string, string> = {
  calzado: "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=1200&q=85",
  gastronomia: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85",
  ferreteria: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1200&q=85",
  belleza: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85",
  ropa: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=85",
  automotor: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85",
  profesionales: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85",
  tecnologia: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=85",
};

const fmt = (n: number) => "$" + n.toLocaleString("es-AR");

export default function NegocioPage({ initialNegocio = null, initialOfertas = [], initialProductos = [] }: {
  initialNegocio?: any;
  initialOfertas?: any[];
  initialProductos?: any[];
}) {
  const { trackViewBusiness, trackClickWhatsApp, trackClickMap, trackShareBusiness } = useAnalytics();
  const { show } = useToast();
  const { addItem, hasItem } = useCart();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // El server component (page.tsx) ya trajo todo esto en el primer render
  // (SSR, bueno para SEO). Antes este cliente volvía a pedir todo de cero
  // acá, duplicando el fetch y agregando un parpadeo de loading evitable.
  const [negocio] = useState<any>(() => initialNegocio);
  const viendo = useLiveViewers(negocio?.id);
  const [ofertas] = useState<any[]>(() => {
    const hoy = hoyArgentina();
    return (initialOfertas || [])
      .filter((o: any) => !o.valid_until || o.valid_until >= hoy)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((o: any) => ({
        id: o.id,
        title: o.title,
        description: o.description,
        old_price: o.old_price ? Number(o.old_price) : null,
        offer_price: o.offer_price ? Number(o.offer_price) : null,
        discount_percent: o.discount_percent,
        valid_until: o.valid_until,
        image_url: o.image_url || initialNegocio?.portada_url,
      }));
  });
  const [productos] = useState<any[]>(() =>
    [...(initialProductos || [])].sort((a: any, b: any) => {
      if (!!b.featured !== !!a.featured) return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
  );
  const [catProd, setCatProd] = useState<string | null>(null);
  const [qProd, setQProd] = useState("");
  // Al entrar se ve primero lo que tenga contenido real: catálogo si hay
  // productos cargados, si no ofertas. Si el negocio tiene las dos cosas,
  // se muestran como pestañas (catálogo primero, es lo que pediste).
  const [seccion, setSeccion] = useState<"catalogo" | "ofertas">(() =>
    productos.length === 0 && ofertas.length > 0 ? "ofertas" : "catalogo"
  );
  // Info/Reseñas/Chat competían por atención apiladas una debajo de la
  // otra en una sola pantalla larguísima -- agrupadas en pestañas queda
  // todo junto y el visitante no se pierde scrolleando.
  const [detalle, setDetalle] = useState<"info" | "resenas" | "chat">("info");
  const catsProductos = Array.from(new Set(productos.map((p) => p.category).filter(Boolean))) as string[];
  const [loading] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);
  // "Abierto ahora": si hay horarios estructurados se calcula en hora
  // argentina; si no, cae al booleano manual. En useEffect (no render)
  // para no desincronizar la hidratación server/cliente.
  const [abierto, setAbierto] = useState<boolean | null>(null);
  useEffect(() => {
    if (!negocio) return;
    const porHorario = estaAbiertoAhora(negocio.schedule_json);
    setAbierto(porHorario === null ? (negocio.open ?? null) : porHorario);
  }, [negocio]);

  useEffect(() => {
    if (!negocio) return;
    const key = `sld-view-${negocio.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business_id: negocio.id, path: window.location.pathname }) }).catch(() => {});
  }, [negocio]);

  useEffect(() => {
    if (negocio) {
      const params = new URLSearchParams(window.location.search);
      const sourceCode = params.get("src") || undefined;
      trackViewBusiness(negocio.id, sourceCode ? "tracked_link" : undefined, sourceCode);
    }
  }, [negocio, trackViewBusiness]);

  const share = async () => {
    const url = await getTrackedShareUrl({
      businessId: negocio.id,
      source: "share",
      fallback: window.location.href,
    });
    const text = `🔥 ${negocio.name} en La Gran Barata Digital\n📍 ${negocio.address || "San Lorenzo"}\n⭐ ${negocio.rating || 0} (${negocio.reviews || 0} reseñas)\n\n#LaGranBarataSanLorenzo`;

    // Igual que en la ficha de oferta: preferimos compartir una imagen
    // lista para Instagram Story / WhatsApp Status cuando el navegador
    // lo permite -- publicidad gratis del negocio completo, no solo texto.
    setCompartiendo(true);
    let file: File | null = null;
    try {
      const blob = await generarImagenNegocio(negocio);
      file = new File([blob], "negocio.png", { type: "image/png" });
    } catch {
      file = null;
    }
    setCompartiendo(false);

    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: negocio.name, text });
        track(negocio.id, "share");
        trackShareBusiness(negocio.id);
        show("📤 ¡Compartido! +10 pts para tu perfil de vecino", "success");
      } catch {
        // Usuario canceló -- no reintentamos con un segundo cartel de texto.
      }
      return;
    }

    if (navigator.share) {
      try { await navigator.share({ title: negocio.name, text, url }); } catch { return; }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
    }
    track(negocio.id, "share");
    trackShareBusiness(negocio.id);
    show("📤 ¡Compartido! +10 pts para tu perfil de vecino", "success");
  };

  if (loading) {
    return (
      <main className="bg-[var(--bg)] min-h-screen flex items-center justify-center text-[var(--text)]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-orange-500"></div>
          <p className="mt-4 text-[var(--muted)]">Cargando negocio...</p>
        </div>
      </main>
    );
  }

  if (!negocio) {
    return (
      <main className="bg-[var(--bg)] min-h-screen flex items-center justify-center text-[var(--text)]">
        <div className="text-center">
          <p className="mb-4 text-5xl">🔍</p>
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-space)" }}>Negocio no encontrado</h1>
          <Link href="/" className="mt-4 inline-block text-orange-400 hover:text-orange-300">← Volver al inicio</Link>
        </div>
      </main>
    );
  }

  const portada = negocio.portada_url || CATEGORY_IMAGES[negocio.category] || CATEGORY_IMAGES.gastronomia;
  const waDestacado = negocio.whatsapp && planDe(negocio).whatsappDestacado;
  const actualizado = relativeTime(negocio.updated_at);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: negocio.name,
    description: negocio.description || "",
    image: portada,
    url: `https://sanlorenzodigital.vercel.app/negocio/${negocio.slug}`,
    telephone: negocio.whatsapp || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: negocio.address || "",
      addressLocality: "San Lorenzo",
      addressRegion: "Santa Fe",
      addressCountry: "AR",
    },
    geo: negocio.latitude ? { "@type": "GeoCoordinates", latitude: Number(negocio.latitude), longitude: Number(negocio.longitude) } : undefined,
    openingHours: negocio.schedule || undefined,
    aggregateRating: negocio.reviews ? { "@type": "AggregateRating", ratingValue: negocio.rating || 0, reviewCount: negocio.reviews || 0 } : undefined,
  };

  return (
    <main className="bg-[var(--bg)] min-h-screen pb-24 text-[var(--text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* HERO editorial: foto grande con esquinas muy redondeadas y las
          badges reales flotando sobre ella (tal cual el mockup aprobado),
          la ficha de perfil (logo/nombre/acciones) se monta encima con
          margen negativo, no debajo en flujo normal. */}
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        {/* La relación panorámica 21/9 recién funciona sin recortar
            cuando hay ancho de sobra -- combinada con una altura mínima
            en mobile, el aspect-ratio ganaba y forzaba el ancho del box
            por ENCIMA del viewport (overflow horizontal real, no cosmético).
            Por eso en mobile usa una relación más vertical y sin mínimo. */}
        <section className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] border border-[var(--line)] shadow-2xl shadow-black/50 sm:aspect-[16/9] md:aspect-[21/8]">
          {negocio.portada_url ? (
            <Image src={negocio.portada_url} alt={negocio.name} fill priority quality={92}
              sizes="100vw" className="object-cover" />
          ) : (
            <CategoryCover category={negocio.category} seed={negocio.id || negocio.slug} className="absolute inset-0 h-full w-full" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a0b] via-[#0c0a0b]/10 to-transparent" />
          <button onClick={() => router.back()} className="absolute left-4 top-4 rounded-full bg-black/50 p-2 backdrop-blur-md transition hover:scale-110 hover:bg-black/70">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="absolute left-4 right-4 top-4 ml-14 flex flex-wrap gap-2 sm:left-6 sm:right-6 sm:ml-16">
            <BusinessLiveBadge businessId={negocio.id} />
            {negocio.status === "verificado" && <Badge variant="success" size="sm">✓ Verificado</Badge>}
            {abierto !== null && (
              <Badge variant={abierto ? "success" : "danger"} size="sm">
                {abierto ? "● Abierto ahora" : "● Cerrado"}
              </Badge>
            )}
            {negocio.type && negocio.type !== "comercio" && (
              <Badge variant="info" size="sm">
                {negocio.type === "particular" ? "🙋 Vendedor particular" : negocio.type === "servicio" ? "🔧 Servicio" : "💼 Profesional"}
              </Badge>
            )}
            {negocio.hace_envios && <Badge variant="info" size="sm">🚚 Hace envíos</Badge>}
            <ResponseBadge businessId={negocio.id} />
          </div>
        </section>

        <div className="relative z-10 -mt-10 flex flex-col items-start gap-4 px-2 sm:-mt-14 sm:flex-row sm:items-end sm:px-4">
          {negocio.logo_url ? (
            <DivisionFrame puntos={negocio.puntos || 0} size={104} categoria={negocio.category}>
              <Image src={negocio.logo_url} alt={negocio.name} width={112} height={112} quality={92} className="h-28 w-28 rounded-3xl border-[6px] border-[var(--bg)] object-cover shadow-2xl" />
            </DivisionFrame>
          ) : (
            <DivisionFrame puntos={negocio.puntos || 0} size={112} categoria={negocio.category} showLabel mostrarProgreso={false}>
              <div className="flex h-28 w-28 items-center justify-center rounded-3xl border-[6px] border-[var(--bg)] bg-gradient-to-br from-orange-500 to-red-600 text-4xl font-black shadow-2xl">
                {negocio.name[0]}
              </div>
            </DivisionFrame>
          )}
          <div className="min-w-0 flex-1 pb-1">
            <p className="text-[10px] font-black uppercase tracking-[.35em] text-[var(--muted2)]">{negocio.category}</p>
            <h1 className="truncate text-3xl font-bold leading-tight md:text-5xl" style={{ fontFamily: "var(--font-space)" }}>{negocio.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {Number(negocio.reviews) > 0 && (
                <span className="flex items-center gap-1.5 text-[var(--warn)]">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-black leading-none" style={{ fontFamily: "var(--font-ticket)" }}>{Number(negocio.rating).toFixed(1)}</span>
                  <span className="text-xs font-normal text-[var(--muted2)]">({negocio.reviews} reseñas)</span>
                </span>
              )}
              {viendo >= 2 && (
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-orange-300">
                  <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" /></span>
                  {viendo} viendo esto ahora
                </span>
              )}
              <LevelBadge slug={negocio.slug} mostrarProgreso={false} />
              {actualizado && <span className="text-[11px] font-semibold text-[var(--muted2)]">Actualizado {actualizado}</span>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 pb-1">
            <FollowButton businessId={negocio.id} />
            <FavoriteButton itemType="business" itemId={negocio.id} variant="card" size={24} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* ALERTA: solo cuando tiene sentido ("avisame si vuelve" en un
            negocio activo con ofertas vigentes confundía: ¿volver de dónde?).
            Con el negocio abierto y ofertas activas, el CTA útil es WhatsApp. */}
        {(abierto === false || ofertas.length === 0) && (
          <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-orange-400/30 bg-gradient-to-r from-orange-500/10 to-red-600/10 p-5 md:flex-row">
            <div>
              <p className="font-black">🔔 Avisame cuando {negocio.name} publique ofertas</p>
              <p className="text-sm text-[var(--muted)]">
                {abierto === false ? "Está cerrado ahora. Te avisamos cuando vuelva con novedades." : "Todavía no tiene ofertas activas."}
              </p>
            </div>
            <NotifyMeButton businessId={String(negocio.id)} productName={negocio.name} />
          </div>
        )}

        {abierto === false && (
          <div className="mb-6 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-center">
            <p className="font-black text-[var(--bad)]">🔴 Cerrado ahora</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {negocio.schedule ? `Horario: ${negocio.schedule}` : "Consultá el horario antes de ir."}
            </p>
          </div>
        )}

        {/* WhatsApp destacado (Plan Plus+): CTA propia, más grande, arriba
            de la grilla en vez de compartir espacio con las demás. */}
        {waDestacado && (
          <a
            onClick={() => trackClickWhatsApp(negocio.id)}
            href={`https://wa.me/${String(negocio.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, vi ${negocio.name} en La Gran Barata Digital`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white shadow-lg shadow-green-500/20 transition hover:opacity-90"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="text-base font-black">Escribir por WhatsApp</span>
          </a>
        )}

        {/* ACCIONES RÁPIDAS: tarjetas de doble borde, tal cual el mockup
            (Favoritos ya se movió al header de la ficha, junto a Seguir). */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {negocio.whatsapp && !waDestacado && (
            <a
              onClick={() => trackClickWhatsApp(negocio.id)}
              href={`https://wa.me/${String(negocio.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, vi ${negocio.name} en La Gran Barata Digital`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5 transition hover:-translate-y-1"
            >
              <div className="flex flex-col items-center gap-2 rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                <MessageCircle className="h-6 w-6 text-[var(--ok)]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--text)]/80">WhatsApp</span>
              </div>
            </a>
          )}
          {negocio.address && (
            <a
              onClick={() => trackClickMap(negocio.id)}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5 transition hover:-translate-y-1"
            >
              <div className="flex flex-col items-center gap-2 rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                <MapPin className="h-6 w-6 text-orange-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--text)]/80">Mapa</span>
              </div>
            </a>
          )}
          <button onClick={share} disabled={compartiendo}
            className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5 transition hover:-translate-y-1 disabled:opacity-60">
            <div className="flex flex-col items-center gap-2 rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <Share2 className={`h-6 w-6 text-[var(--place)] ${compartiendo ? "animate-pulse" : ""}`} />
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--text)]/80">{compartiendo ? "Generando..." : "Compartir"}</span>
            </div>
          </button>
          <a
            href={`/negocio/${slug}/tv`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5 transition hover:-translate-y-1"
          >
            <div className="flex flex-col items-center gap-2 rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <Tv className="h-6 w-6 text-[var(--accent)]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--text)]/80">Modo TV</span>
            </div>
          </a>
        </div>

        {negocio.description && (
          <div className="mb-8">
            <h2 className="mb-3 text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Sobre el negocio</h2>
            <p className="leading-relaxed text-[var(--text)]/80">{negocio.description}</p>
          </div>
        )}

        <BookingWidget businessId={negocio.id} businessName={negocio.name} />
        <LoyaltyCard businessId={negocio.id} businessName={negocio.name} />

        {/* Catálogo y ofertas activas: si el negocio tiene las dos cosas,
            se muestran como pestañas (catálogo primero por default). Si
            solo tiene una, se muestra directo sin pestañas de más. */}
        {productos.length > 0 && ofertas.length > 0 && (
          <div className="mb-5 flex gap-2 rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-1.5">
            <button
              onClick={() => setSeccion("catalogo")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${seccion === "catalogo" ? "bg-gradient-to-r from-orange-500 to-red-600 text-white" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
            >
              <Package className="h-4 w-4" /> Catálogo ({productos.length})
            </button>
            <button
              onClick={() => setSeccion("ofertas")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${seccion === "ofertas" ? "bg-gradient-to-r from-orange-500 to-red-600 text-white" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
            >
              <Flame className="h-4 w-4" /> Ofertas ({ofertas.length})
            </button>
          </div>
        )}

        {/* OFERTAS ACTIVAS: tarjetas compactas horizontales */}
        {ofertas.length > 0 && (productos.length === 0 || seccion === "ofertas") && (
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Ofertas activas ({ofertas.length})</h2>
            <div className="space-y-3">
              {ofertas.map((o) => {
                const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
                const vence = o.valid_until ? new Date(o.valid_until + "T00:00:00") : null;
                const dias = vence ? Math.round((vence.getTime() - hoy.getTime()) / 86400000) : null;
                const ahorro = o.old_price && o.offer_price ? Number(o.old_price) - Number(o.offer_price) : null;
                return (
                  <Link
                    key={o.id}
                    href={`/oferta/${o.id}`}
                    className="group flex gap-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-3 transition hover:border-orange-400/40 hover:bg-[var(--ov-08)]"
                  >
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28">
                      <Image
                        src={o.image_url || portada}
                        alt={o.title}
                        fill
                        quality={88}
                        sizes="112px"
                        className="object-cover transition group-hover:scale-105"
                      />
                      {o.discount_percent > 0 && (
                        <span className="absolute left-1 top-1 rounded-md bg-gradient-to-r from-red-500 to-orange-500 px-1.5 py-0.5 text-[10px] font-black text-white shadow">
                          -{o.discount_percent}%
                        </span>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        {dias === 0 && <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-black text-[var(--bad)]">VENCE HOY</span>}
                        {dias !== null && dias > 0 && dias <= 3 && <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black text-[var(--warn)]">En {dias} días</span>}
                      </div>
                      <h3 className="line-clamp-2 text-sm font-black leading-snug sm:text-base">{o.title}</h3>
                      <div className="mt-auto flex items-end justify-between gap-2 pt-1">
                        <div>
                          {o.old_price && <p className="text-[11px] text-[var(--muted2)] line-through">{fmt(Number(o.old_price))}</p>}
                          {o.offer_price && <p className="text-lg font-black text-orange-400">{fmt(Number(o.offer_price))}</p>}
                        </div>
                        {ahorro && ahorro > 0 && (
                          <span className="rounded bg-green-500/15 px-2 py-1 text-[11px] font-black text-[var(--ok)]">
                            -{fmt(ahorro)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* PRODUCTOS / CATÁLOGO */}
        {productos.length > 0 && (ofertas.length === 0 || seccion === "catalogo") && (
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Catálogo ({productos.length})</h2>
            {productos.length > 6 && (
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted2)]" />
                <input value={qProd} onChange={(e) => setQProd(e.target.value)}
                  placeholder="Buscar en el catálogo..."
                  className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] py-2.5 pl-9 pr-4 text-sm outline-none focus:border-orange-400" />
              </div>
            )}
            {catsProductos.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                <button onClick={() => setCatProd(null)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${!catProd ? "bg-gradient-to-r from-orange-500 to-red-600" : "border border-[var(--line-strong)] bg-[var(--ov-05)] text-[var(--muted)]"}`}>
                  Todos
                </button>
                {catsProductos.map((c) => (
                  <button key={c} onClick={() => setCatProd(c)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize transition ${catProd === c ? "bg-gradient-to-r from-orange-500 to-red-600" : "border border-[var(--line-strong)] bg-[var(--ov-05)] text-[var(--muted)]"}`}>
                    {c}
                  </button>
                ))}
              </div>
            )}
            {(() => {
              const t = qProd.trim().toLowerCase();
              const visibles = productos
                .filter((p) => !catProd || p.category === catProd)
                .filter((p) => !t || `${p.name} ${p.description || ""}`.toLowerCase().includes(t));
              if (visibles.length === 0) {
                return (
                  <p className="rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-8 text-center text-sm text-[var(--muted)]">
                    No encontramos productos con esa búsqueda.
                  </p>
                );
              }
              return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibles.map((p) => {
                const esNuevo = p.created_at && (Date.now() - new Date(p.created_at).getTime()) < 7 * 86400000;
                const enOferta = p.old_price && Number(p.old_price) > Number(p.price);
                const ultimasUnidades = p.stock != null && p.stock > 0 && p.stock <= 3;
                return (
                <div key={p.id} className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5 hover:border-orange-400/30 hover:shadow-xl hover:shadow-orange-500/10">
                <div className="overflow-hidden rounded-[1.375rem] border border-[var(--ov-06)] bg-gradient-to-b from-[var(--ov-05)] to-[var(--ov-02)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                  <div className="relative h-40 w-full overflow-hidden">
                    {Array.isArray(p.images) && p.images[0] && (
                      <Image src={p.images[0]} alt={p.name} fill quality={90}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover" />
                    )}
                    {(enOferta || esNuevo || ultimasUnidades || p.featured) && (
                      <div className="absolute left-2 top-2 flex flex-col gap-1">
                        {p.featured && <span className="rounded-full bg-yellow-500/90 px-2 py-0.5 text-[9px] font-black text-black">⭐ Destacado</span>}
                        {enOferta && <span className="rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-2 py-0.5 text-[9px] font-black text-white">🔥 Oferta</span>}
                        {esNuevo && <span className="rounded-full bg-sky-500/90 px-2 py-0.5 text-[9px] font-black text-white">🆕 Nuevo</span>}
                        {ultimasUnidades && <span className="rounded-full bg-red-600/90 px-2 py-0.5 text-[9px] font-black text-white">⚡ Últimas unidades</span>}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-bold flex items-center gap-1.5">
                      {p.name}
                    </p>
                    {p.description && <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{p.description}</p>}
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        {p.old_price && <p className="text-xs text-[var(--muted2)] line-through">${Number(p.old_price).toLocaleString("es-AR")}</p>}
                        <p className="text-2xl text-orange-400" style={{ fontFamily: "var(--font-ticket)", fontWeight: 700 }}>${Number(p.price).toLocaleString("es-AR")}</p>
                      </div>
                      {p.stock && <span className="text-[10px] text-[var(--muted)]">Stock: {p.stock}</span>}
                    </div>
                    <div className="mt-3 flex gap-1.5">
                      {negocio.whatsapp && (
                        <a
                          onClick={() => track(negocio.id, "whatsapp")}
                          href={`https://wa.me/${String(negocio.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, te consulto por "${p.name}" que vi en La Gran Barata Digital`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-green-400/30 bg-green-500/10 py-2 text-xs font-bold text-[var(--ok)] hover:bg-green-500/20"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Consultar
                        </a>
                      )}
                      <button
                        onClick={() => addItem({
                          id: `producto-${p.id}`, tipo: "producto", refId: p.id, title: p.name,
                          price: p.price ? Number(p.price) : undefined, image: Array.isArray(p.images) ? p.images[0] : undefined,
                          businessId: negocio.id, businessName: negocio.name, businessSlug: negocio.slug, businessWhatsapp: negocio.whatsapp,
                        })}
                        disabled={hasItem(`producto-${p.id}`)}
                        aria-label={hasItem(`producto-${p.id}`) ? "Ya está en el changuito" : "Agregar al changuito"}
                        className="flex shrink-0 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-xs font-bold text-[var(--place)] hover:bg-sky-500/20 disabled:opacity-60"
                      >
                        {hasItem(`producto-${p.id}`) ? <Check className="h-3.5 w-3.5" /> : <ShoppingBasket className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
                </div>
                );
              })}
            </div>
              );
            })()}
          </div>
        )}

        {/* Info, reseñas y chat agrupados en pestañas -- antes se apilaban
            uno debajo del otro, ahora está todo junto y elegible. */}
        <div className="mb-5 flex gap-2 rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-1.5">
          {([
            { key: "info" as const, label: "Info y mapa", icon: MapPin },
            { key: "resenas" as const, label: `Reseñas${negocio.reviews ? ` (${negocio.reviews})` : ""}`, icon: Star },
            { key: "chat" as const, label: "Chat", icon: MessageCircle },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setDetalle(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${detalle === key ? "bg-gradient-to-r from-orange-500 to-red-600 text-white" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {detalle === "info" && (
          <div className="mb-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
              <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)] sm:p-8">
                <p className="mb-5 text-[10px] font-black uppercase tracking-[.35em] text-[var(--muted2)]">Información</p>
                <div className="space-y-5">
                  {negocio.address && (
                    <div className="flex items-start gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10"><MapPin className="h-4 w-4 text-orange-400" /></span>
                      <div className="min-w-0">
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]">Dirección</p>
                        <p className="text-sm text-[var(--text)]/90">{negocio.address}</p>
                      </div>
                    </div>
                  )}
                  {negocio.schedule && (
                    <div className="flex items-start gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10"><Clock className="h-4 w-4 text-orange-400" /></span>
                      <div className="min-w-0">
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]">Horarios</p>
                        <p className="text-sm text-[var(--text)]/90">{negocio.schedule}</p>
                      </div>
                    </div>
                  )}
                  {negocio.whatsapp && (
                    <div className="flex items-start gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10"><Phone className="h-4 w-4 text-orange-400" /></span>
                      <div className="min-w-0">
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]">WhatsApp</p>
                        <p className="text-sm font-bold text-[var(--text)]/90">{negocio.whatsapp}</p>
                      </div>
                    </div>
                  )}
                  {negocio.instagram && (
                    <div className="flex items-start gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10"><ExternalLink className="h-4 w-4 text-orange-400" /></span>
                      <div className="min-w-0">
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]">Instagram</p>
                        <a href={`https://instagram.com/${negocio.instagram}`} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-400 hover:text-orange-300">@{negocio.instagram}</a>
                      </div>
                    </div>
                  )}
                  {negocio.hace_envios && (
                    <div className="flex items-start gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10"><Truck className="h-4 w-4 text-[var(--place)]" /></span>
                      <div className="min-w-0">
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--place)]/70">Envíos</p>
                        <p className="text-sm text-[var(--text)]/90">
                          {negocio.envio_gratis ? "Envío gratis" : negocio.costo_envio ? `Envío: $${Number(negocio.costo_envio).toLocaleString("es-AR")}` : "Hace envíos"}
                          {negocio.zona_cobertura && ` · ${negocio.zona_cobertura}`}
                        </p>
                        {negocio.retiro_en_local && <p className="text-xs text-[var(--muted)]">También hay retiro {negocio.type === "comercio" ? "en el local" : "acordado"}.</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {negocio.latitude && negocio.longitude && (
              <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
                <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)] sm:p-8">
                  <p className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.35em] text-[var(--muted2)]">
                    <Navigation className="h-3.5 w-3.5 text-[var(--place)]" /> Ubicación
                  </p>
                  <BusinessMap latitude={negocio.latitude} longitude={negocio.longitude} address={negocio.address} />
                </div>
              </div>
            )}
          </div>
        )}

        {detalle === "resenas" && (
          <ReviewsSection businessId={negocio.id} baseRating={Number(negocio.rating || 0)} baseCount={Number(negocio.reviews || 0)} />
        )}

        {detalle === "chat" && (
          <Chat businessId={negocio.id} ownerId={negocio.owner_id} businessName={negocio.name} businessSlug={negocio.slug} />
        )}
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-10 text-center">
        {negocio && <ReportButton businessId={negocio.id} businessName={negocio.name} />}
      </div>
      <div className="mx-auto max-w-4xl px-4 pb-8">
        <LevelUpCard slug={slug} ownerId={negocio.owner_id} />
      </div>
      {negocio.whatsapp && (
        <div className="fixed inset-x-0 bottom-14 z-40 border-t border-[var(--line-strong)] bg-[var(--bg)]/95 p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
          <a
            onClick={() => trackClickWhatsApp(negocio.id)}
            href={`https://wa.me/${String(negocio.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, vi ${negocio.name} en La Gran Barata Digital`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 w-full items-center justify-center gap-2 bg-green-600 px-4 py-3 text-sm font-black text-white"
          >
            <MessageCircle className="h-5 w-5" /> Escribir por WhatsApp
          </a>
        </div>
      )}
    </main>
  );
}
