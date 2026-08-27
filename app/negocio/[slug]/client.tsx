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
import styles from "./negocio.module.css";

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
        created_at: o.created_at,
        precio_prometido: o.precio_prometido,
        impulsada: o.impulsada,
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
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--accent)]"></div>
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
          <h1 className="font-display text-2xl uppercase tracking-tight">Negocio no encontrado</h1>
          <Link href="/" className="mt-4 inline-block text-[var(--accent)] hover:underline">← Volver al inicio</Link>
        </div>
      </main>
    );
  }

  const waDestacado = negocio.whatsapp && planDe(negocio).whatsappDestacado;
  const actualizado = relativeTime(negocio.updated_at);

  return (
    <main className="bg-[var(--bg)] min-h-screen pb-24 text-[var(--text)]">
      {/* Glow ambiental de marca, mismo lenguaje que el resto del sitio. */}
      <div className="aurora-bg -z-10" style={{ position: "fixed" }} aria-hidden="true"><span /><span /><span /></div>
      {/* COVER cinematográfico -- misma estructura que la vista previa que
          se le mostró a Matías: tapa a sangre completa, viñeta, avatar
          flotante, nombre en Fraunces itálica, meta real, acciones. */}
      <section className={styles.cover}>
        <div className={styles.coverShot}>
          {negocio.portada_url ? (
            <Image src={negocio.portada_url} alt={negocio.name} fill priority quality={92} sizes="100vw" className="object-cover" />
          ) : (
            <CategoryCover category={negocio.category} seed={negocio.id || negocio.slug} className="absolute inset-0" />
          )}
        </div>
        <div className={styles.coverVignette} aria-hidden="true" />
        <div className={styles.coverRim} aria-hidden="true" />

        <button onClick={() => router.back()} aria-label="Volver" className={`${styles.backBtn} ${styles.iconBtn}`}>
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className={styles.badgeRow}>
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

        <div className={`${styles.wrap} ${styles.coverContent} px-4 sm:px-6`}>
          <div className={styles.coverBottom}>
            <div className={styles.logoFloat}>
              {negocio.logo_url ? (
                <DivisionFrame puntos={negocio.puntos || 0} size={96} categoria={negocio.category}>
                  <Image src={negocio.logo_url} alt={negocio.name} width={96} height={96} quality={92} className="h-24 w-24 rounded-full border-4 border-[var(--bg)] object-cover shadow-2xl" />
                </DivisionFrame>
              ) : (
                <DivisionFrame puntos={negocio.puntos || 0} size={96} categoria={negocio.category} showLabel mostrarProgreso={false}>
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[var(--bg)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] text-4xl font-black text-white shadow-2xl">
                    {negocio.name[0]}
                  </div>
                </DivisionFrame>
              )}
            </div>
            <div className={styles.coverInfo}>
              <h1 className={styles.coverName}>{negocio.name}</h1>
              <div className={styles.coverMeta}>
                {Number(negocio.reviews) > 0 && <span>⭐ {Number(negocio.rating).toFixed(1)} · {negocio.reviews} reseñas</span>}
                {negocio.address && <span>📍 {negocio.address}</span>}
                {negocio.category && <span>{negocio.category}</span>}
                <LevelBadge slug={negocio.slug} mostrarProgreso={false} />
                {viendo >= 2 && <span>🔴 {viendo} viendo esto ahora</span>}
              </div>
            </div>
            <div className={styles.coverActions}>
              {negocio.whatsapp && (
                <a
                  onClick={() => trackClickWhatsApp(negocio.id)}
                  href={`https://wa.me/${String(negocio.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, vi ${negocio.name} en La Gran Barata Digital`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className={styles.iconBtn}
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-[18px] w-[18px]" />
                </a>
              )}
              <div className={styles.iconBtn}><FavoriteButton itemType="business" itemId={negocio.id} variant="card" size={18} /></div>
              <button onClick={share} disabled={compartiendo} aria-label="Compartir" className={styles.iconBtn}>
                <Share2 className={`h-[18px] w-[18px] ${compartiendo ? "animate-pulse" : ""}`} />
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <FollowButton businessId={negocio.id} size="lg" />
            {negocio.website && (
              <a href={negocio.website} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--line-strong)] px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                Visitar <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <button onClick={() => { setDetalle("chat"); document.getElementById("detalle-ficha")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--line-strong)] px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
              Contactar <MessageCircle className="h-4 w-4" />
            </button>
            {actualizado && <p className="text-xs font-semibold text-[var(--muted2)]">Actualizado {actualizado}</p>}
          </div>

          {Array.isArray(negocio.tags) && negocio.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {negocio.tags.map((tag: string) => (
                <span key={tag} className="rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.15em] text-[var(--muted)]">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className={`${styles.wrap} px-4 pt-8 sm:px-6`}>
        {/* ALERTA: solo cuando tiene sentido ("avisame si vuelve" en un
            negocio activo con ofertas vigentes confundía: ¿volver de dónde?).
            Con el negocio abierto y ofertas activas, el CTA útil es WhatsApp. */}
        {(abierto === false || ofertas.length === 0) && (
          <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-5 md:flex-row">
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
          <div className="mb-6 rounded-2xl border border-[var(--bad)]/40 bg-[var(--bad)]/10 p-4 text-center">
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
            className="mb-6 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white shadow-lg shadow-green-500/20 transition hover:opacity-90"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="text-base font-black">Escribir por WhatsApp</span>
          </a>
        )}

        {/* ACCIONES RÁPIDAS: mapa / compartir / modo TV. WhatsApp e
            Instagram ya viven arriba, en la tapa. */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {negocio.address && (
            <a
              onClick={() => trackClickMap(negocio.id)}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5 transition hover:-translate-y-1"
            >
              <div className="flex flex-col items-center gap-2 rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                <MapPin className="h-6 w-6 text-[var(--accent)]" />
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
            <h2 className="mb-3 font-display text-2xl uppercase tracking-tight">Sobre el negocio</h2>
            <p className="leading-relaxed text-[var(--text)]/80">{negocio.description}</p>
          </div>
        )}

        <BookingWidget businessId={negocio.id} businessName={negocio.name} />
        <LoyaltyCard businessId={negocio.id} businessName={negocio.name} />

        <section className={styles.lay}>
          <div>
            {/* Catálogo y ofertas activas: si el negocio tiene las dos cosas,
                se muestran como pestañas (catálogo primero por default). Si
                solo tiene una, se muestra directo sin pestañas de más. */}
            {productos.length > 0 && ofertas.length > 0 && (
              <div className="mb-5 flex gap-2 rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-1.5">
                <button
                  onClick={() => setSeccion("catalogo")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${seccion === "catalogo" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
                >
                  <Package className="h-4 w-4" /> Catálogo ({productos.length})
                </button>
                <button
                  onClick={() => setSeccion("ofertas")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${seccion === "ofertas" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
                >
                  <Flame className="h-4 w-4" /> Ofertas ({ofertas.length})
                </button>
              </div>
            )}

            {/* OFERTAS ACTIVAS: tarjetas propias de esta ficha (misma
                onda cards2 del resto del sitio), en vez de la OfferCard
                genérica que quedaba visualmente descolgada acá. */}
            {ofertas.length > 0 && (productos.length === 0 || seccion === "ofertas") && (
              <section className={styles.block}>
                <div className={styles.secHead}>
                  <h2>Ofertas activas ({ofertas.length})</h2>
                </div>
                <div className={styles.cards2}>
                  {ofertas.map((o) => (
                    <Link key={o.id} href={`/oferta/${o.id}`} className={styles.pcard}>
                      <div className={styles.pcardShot}>
                        {o.image_url ? (
                          <Image src={o.image_url} alt={o.title} fill sizes="120px" className="object-cover" />
                        ) : (
                          <CategoryCover category={negocio.category} seed={String(o.id)} className="absolute inset-0" />
                        )}
                        {o.discount_percent ? <span className={styles.pcardBadge}>-{o.discount_percent}%</span> : null}
                      </div>
                      <div className={styles.pcardBody}>
                        <div className={styles.pcardName}>{o.title}</div>
                        <div>
                          {o.offer_price && <span className={styles.pcardPrice}>{fmt(o.offer_price)}</span>}
                          {o.old_price && <span className={styles.pcardOld}>{fmt(o.old_price)}</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* PRODUCTOS / CATÁLOGO */}
            {productos.length > 0 && (ofertas.length === 0 || seccion === "catalogo") && (
              <section className={styles.block}>
                <div className={styles.secHead}>
                  <h2>Catálogo ({productos.length})</h2>
                </div>
                {productos.length > 6 && (
                  <div className="relative mb-4">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted2)]" />
                    <input value={qProd} onChange={(e) => setQProd(e.target.value)}
                      placeholder="Buscar en el catálogo..."
                      className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[var(--accent)]" />
                  </div>
                )}
                {catsProductos.length > 1 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    <button onClick={() => setCatProd(null)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${!catProd ? "bg-[var(--accent)]" : "border border-[var(--line-strong)] bg-[var(--ov-05)] text-[var(--muted)]"}`}>
                      Todos
                    </button>
                    {catsProductos.map((c) => (
                      <button key={c} onClick={() => setCatProd(c)}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize transition ${catProd === c ? "bg-[var(--accent)]" : "border border-[var(--line-strong)] bg-[var(--ov-05)] text-[var(--muted)]"}`}>
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
                <div className="grid gap-4 sm:grid-cols-2">
                  {visibles.map((p) => {
                    const esNuevo = p.created_at && (Date.now() - new Date(p.created_at).getTime()) < 7 * 86400000;
                    const enOferta = p.old_price && Number(p.old_price) > Number(p.price);
                    const ultimasUnidades = p.stock != null && p.stock > 0 && p.stock <= 3;
                    return (
                    <div key={p.id} className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5 hover:border-[var(--accent)]/30 hover:shadow-xl hover:shadow-[var(--accent)]/10">
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
                            {enOferta && <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[9px] font-black text-white">🔥 Oferta</span>}
                            {esNuevo && <span className="rounded-full bg-sky-500/90 px-2 py-0.5 text-[9px] font-black text-white">🆕 Nuevo</span>}
                            {ultimasUnidades && <span className="rounded-full bg-[var(--bad)]/90 px-2 py-0.5 text-[9px] font-black text-white">⚡ Últimas unidades</span>}
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
                            <p className="text-2xl text-[var(--accent)]" style={{ fontFamily: "var(--font-ticket)", fontWeight: 700 }}>${Number(p.price).toLocaleString("es-AR")}</p>
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
                            className="flex shrink-0 items-center justify-center rounded-lg border border-[var(--place)]/30 bg-[var(--place)]/10 px-3 py-2 text-xs font-bold text-[var(--place)] hover:bg-[var(--place)]/20 disabled:opacity-60"
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
              </section>
            )}
          </div>

          {/* "Subí en el ranking": upsell real de Plan PRO/Destacado, sin
              inventar un ranking de vecinos -- eso quedó fuera porque no
              existe todavía un cálculo real de posiciones entre comercios. */}
          <aside>
            <div className={`${styles.widget} ${styles.upsell}`}>
              <h3>Subí en el ranking</h3>
              <p>Con Plan PRO o el Destacado del Mes, tu negocio gana más lugar en la home y en las búsquedas del barrio — no vendemos tus productos, vendemos que te vean.</p>
              <ul>
                <li>Posición fija en la home</li>
                <li>Insignia destacada en tus ofertas</li>
                <li>Estadísticas de quién te ve</li>
              </ul>
              <Link href="/planes" className={styles.btnGlow}>Ver Plan PRO →</Link>
            </div>
          </aside>
        </section>

        {/* Info, reseñas y chat agrupados en pestañas -- antes se apilaban
            uno debajo del otro, ahora está todo junto y elegible. */}
        <div id="detalle-ficha" className="mb-5 flex scroll-mt-24 gap-2 rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-1.5">
          {([
            { key: "info" as const, label: "Info y mapa", icon: MapPin },
            { key: "resenas" as const, label: `Reseñas${negocio.reviews ? ` (${negocio.reviews})` : ""}`, icon: Star },
            { key: "chat" as const, label: "Chat", icon: MessageCircle },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setDetalle(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${detalle === key ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
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
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10"><MapPin className="h-4 w-4 text-[var(--accent)]" /></span>
                      <div className="min-w-0">
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]">Dirección</p>
                        <p className="text-sm text-[var(--text)]/90">{negocio.address}</p>
                      </div>
                    </div>
                  )}
                  {negocio.schedule && (
                    <div className="flex items-start gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10"><Clock className="h-4 w-4 text-[var(--accent)]" /></span>
                      <div className="min-w-0">
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]">Horarios</p>
                        <p className="text-sm text-[var(--text)]/90">{negocio.schedule}</p>
                      </div>
                    </div>
                  )}
                  {negocio.whatsapp && (
                    <div className="flex items-start gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10"><Phone className="h-4 w-4 text-[var(--accent)]" /></span>
                      <div className="min-w-0">
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]">WhatsApp</p>
                        <p className="text-sm font-bold text-[var(--text)]/90">{negocio.whatsapp}</p>
                      </div>
                    </div>
                  )}
                  {negocio.instagram && (
                    <div className="flex items-start gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10"><ExternalLink className="h-4 w-4 text-[var(--accent)]" /></span>
                      <div className="min-w-0">
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]">Instagram</p>
                        <a href={`https://instagram.com/${negocio.instagram}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] hover:text-[var(--accent2)]">@{negocio.instagram}</a>
                      </div>
                    </div>
                  )}
                  {negocio.hace_envios && (
                    <div className="flex items-start gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--place)]/10"><Truck className="h-4 w-4 text-[var(--place)]" /></span>
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
