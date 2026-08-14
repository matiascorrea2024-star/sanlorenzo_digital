"use client";
import LevelUpCard from "@/components/ui/level-up-card";
import DivisionFrame from "@/components/ui/division-frame";

import ReportButton from "@/components/business/report-button";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import { MapPin, Clock, Phone, MessageCircle, Share2, Heart, ArrowLeft, ExternalLink, Flame, Tag, Star } from "lucide-react";
import Badge from "@/components/ui/badge";
import BusinessMap from "@/components/business/map";
import ReviewsSection from "@/components/business/reviews-section";
import Chat from "@/components/business/chat";
import FollowButton from "@/components/business/follow-button";
import NotifyMeButton from "@/components/offers/notify-me-button";
import FavoriteButton from "@/components/ui/favorite-button";
import LevelBadge from "@/components/business/level-badge";

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

export default function NegocioPage({ initialNegocio = null, initialOfertas = [], initialProductos = [], initialResenas = [] }: {
  initialNegocio?: any;
  initialOfertas?: any[];
  initialProductos?: any[];
  initialResenas?: any[];
}) {
  const { trackViewBusiness, trackClickWhatsApp, trackClickMap } = useAnalytics();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // El server component (page.tsx) ya trajo todo esto en el primer render
  // (SSR, bueno para SEO). Antes este cliente volvía a pedir todo de cero
  // acá, duplicando el fetch y agregando un parpadeo de loading evitable.
  const [negocio] = useState<any>(() => initialNegocio);
  const [ofertas] = useState<any[]>(() => {
    const hoy = new Date().toISOString().slice(0, 10);
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
  const catsProductos = Array.from(new Set(productos.map((p) => p.category).filter(Boolean))) as string[];
  const [loading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      setUser(user);
    })();
  }, [slug]);

  useEffect(() => {
    if (!negocio) return;
    const key = `sld-view-${negocio.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business_id: negocio.id, path: window.location.pathname }) }).catch(() => {});
  }, [negocio]);

  useEffect(() => {
    if (negocio) trackViewBusiness(negocio.id);
  }, [negocio]);

  const share = async () => {
    const url = window.location.href;
    const text = `🔥 ${negocio.name} en La Gran Barata Digital\n📍 ${negocio.address || "San Lorenzo"}\n⭐ ${negocio.rating || 0} (${negocio.reviews || 0} reseñas)`;
    if (navigator.share) {
      try { await navigator.share({ title: negocio.name, text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert("¡Link copiado!");
    }
  };

  if (loading) {
    return (
      <main className="bg-[#0a0710] min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-orange-500"></div>
          <p className="mt-4 text-white/60">Cargando negocio...</p>
        </div>
      </main>
    );
  }

  if (!negocio) {
    return (
      <main className="bg-[#0a0710] min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <p className="mb-4 text-5xl">🔍</p>
          <h1 className="text-2xl font-black">Negocio no encontrado</h1>
          <Link href="/" className="mt-4 inline-block text-orange-400 hover:text-orange-300">← Volver al inicio</Link>
        </div>
      </main>
    );
  }

  const portada = negocio.portada_url || CATEGORY_IMAGES[negocio.category] || CATEGORY_IMAGES.gastronomia;

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
    <main className="bg-[#0a0710] min-h-screen pb-24 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* HERO a medida: altura consistente */}
      <section className="relative h-64 md:h-80">
        <img src={portada} alt={negocio.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0710] via-[#0a0710]/60 to-transparent" />

        <button onClick={() => router.back()} className="absolute left-4 top-4 rounded-full bg-black/50 p-2 backdrop-blur-md hover:bg-black/70">
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-start gap-4">
              {negocio.logo_url ? (
                <DivisionFrame puntos={negocio.puntos || 0} size={72} categoria={negocio.category}>
                  <img src={negocio.logo_url} alt={negocio.name} className="h-20 w-20 rounded-2xl border-4 border-[#0a0710] object-cover shadow-2xl" />
                </DivisionFrame>
              ) : (
                <DivisionFrame puntos={negocio.puntos || 0} size={80} categoria={negocio.category} showLabel>
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-[#0a0710] bg-gradient-to-br from-orange-500 to-pink-500 text-3xl font-black shadow-2xl">
                    {negocio.name[0]}
                  </div>
                </DivisionFrame>
              )}
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {negocio.status === "verificado" && <Badge variant="success" size="sm">✓ Verificado</Badge>}
                  {negocio.open !== undefined && (
                    <Badge variant={negocio.open ? "success" : "danger"} size="sm">
                      {negocio.open ? "● Abierto ahora" : "● Cerrado"}
                    </Badge>
                  )}
                </div>
                <h1 className="truncate text-2xl font-black md:text-4xl">{negocio.name}</h1>
                <p className="mt-1 truncate text-sm capitalize text-white/70">{negocio.category}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <FollowButton businessId={negocio.id} />
                  <LevelBadge slug={negocio.slug} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* ALERTA: te avisamos de ofertas nuevas */}
        <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-orange-400/30 bg-gradient-to-r from-orange-500/10 to-pink-500/10 p-5 md:flex-row">
          <div>
            <p className="font-black">🔔 No te pierdas nada de {negocio.name}</p>
            <p className="text-sm text-white/60">Te avisamos cuando publiquen ofertas nuevas.</p>
          </div>
          <NotifyMeButton businessId={String(negocio.id)} productName={negocio.name} />
        </div>

        {negocio.open === false && (
          <div className="mb-6 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-center">
            <p className="font-black text-red-300">🔴 Cerrado ahora</p>
            <p className="mt-1 text-sm text-white/60">
              {negocio.schedule ? `Horario: ${negocio.schedule}` : "Consultá el horario antes de ir."}
            </p>
          </div>
        )}

        {/* ACCIONES RÁPIDAS: 4 tarjetas limpias */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {negocio.whatsapp && (
            <a
              onClick={() => trackClickWhatsApp(negocio.id)}
              href={`https://wa.me/${String(negocio.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, vi ${negocio.name} en La Gran Barata Digital`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-2xl border border-green-400/30 bg-green-500/10 p-4 transition hover:bg-green-500/20"
            >
              <MessageCircle className="h-6 w-6 text-green-400" />
              <span className="text-sm font-bold">WhatsApp</span>
            </a>
          )}
          {negocio.address && (
            <a
              onClick={() => trackClickMap(negocio.id)}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
            >
              <MapPin className="h-6 w-6 text-orange-400" />
              <span className="text-sm font-bold">Cómo llegar</span>
            </a>
          )}
          <button onClick={share} className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
            <Share2 className="h-6 w-6 text-sky-400" />
            <span className="text-sm font-bold">Compartir</span>
          </button>
          <FavoriteButton itemType="business" itemId={negocio.id} />
        </div>

        {/* INFO + MAPA */}
        <div className="mb-8 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-xl font-black">📞 Información</h2>
            <div className="space-y-3">
              {negocio.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
                  <div>
                    <p className="text-sm font-bold">Dirección</p>
                    <p className="text-sm text-white/70">{negocio.address}</p>
                  </div>
                </div>
              )}
              {negocio.schedule && (
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
                  <div>
                    <p className="text-sm font-bold">Horarios</p>
                    <p className="text-sm text-white/70">{negocio.schedule}</p>
                  </div>
                </div>
              )}
              {negocio.whatsapp && (
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
                  <div>
                    <p className="text-sm font-bold">WhatsApp</p>
                    <p className="text-sm text-white/70">{negocio.whatsapp}</p>
                  </div>
                </div>
              )}
              {negocio.instagram && (
                <div className="flex items-start gap-3">
                  <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
                  <div>
                    <p className="text-sm font-bold">Instagram</p>
                    <a href={`https://instagram.com/${negocio.instagram}`} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-400 hover:text-orange-300">@{negocio.instagram}</a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {negocio.latitude && negocio.longitude && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-xl font-black">📍 Ubicación</h2>
              <BusinessMap latitude={negocio.latitude} longitude={negocio.longitude} address={negocio.address} />
            </div>
          )}
        </div>

        {negocio.description && (
          <div className="mb-8">
            <h2 className="mb-3 text-xl font-black">Sobre el negocio</h2>
            <p className="leading-relaxed text-white/80">{negocio.description}</p>
          </div>
        )}

        {/* OFERTAS ACTIVAS: tarjetas compactas horizontales */}
        {ofertas.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-black">🔥 Ofertas activas ({ofertas.length})</h2>
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
                    className="group flex gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:border-orange-400/40 hover:bg-white/[.07]"
                  >
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28">
                      <img
                        src={o.image_url || portada}
                        alt={o.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                      {o.discount_percent > 0 && (
                        <span className="absolute left-1 top-1 rounded-md bg-gradient-to-r from-red-500 to-orange-500 px-1.5 py-0.5 text-[10px] font-black text-white shadow">
                          -{o.discount_percent}%
                        </span>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        {dias === 0 && <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-black text-red-300">VENCE HOY</span>}
                        {dias !== null && dias > 0 && dias <= 3 && <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black text-amber-300">En {dias} días</span>}
                      </div>
                      <h3 className="line-clamp-2 text-sm font-black leading-snug sm:text-base">{o.title}</h3>
                      <div className="mt-auto flex items-end justify-between gap-2 pt-1">
                        <div>
                          {o.old_price && <p className="text-[11px] text-white/40 line-through">{fmt(Number(o.old_price))}</p>}
                          {o.offer_price && <p className="text-lg font-black text-orange-400">{fmt(Number(o.offer_price))}</p>}
                        </div>
                        {ahorro && ahorro > 0 && (
                          <span className="rounded bg-green-500/15 px-2 py-1 text-[11px] font-black text-green-300">
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

        {/* PRODUCTOS */}
        {productos.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-black">🛍️ Productos ({productos.length})</h2>
            {catsProductos.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                <button onClick={() => setCatProd(null)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${!catProd ? "bg-gradient-to-r from-orange-500 to-pink-500" : "border border-white/15 bg-white/5 text-white/70"}`}>
                  Todos
                </button>
                {catsProductos.map((c) => (
                  <button key={c} onClick={() => setCatProd(c)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize transition ${catProd === c ? "bg-gradient-to-r from-orange-500 to-pink-500" : "border border-white/15 bg-white/5 text-white/70"}`}>
                    {c}
                  </button>
                ))}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {productos.filter((p) => !catProd || p.category === catProd).map((p) => (
                <div key={p.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  {Array.isArray(p.images) && p.images[0] && (
                    <img src={p.images[0]} alt={p.name} className="h-40 w-full object-cover" />
                  )}
                  <div className="p-4">
                    <p className="font-bold flex items-center gap-1.5">
                      {p.name}
                      {p.featured && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
                    </p>
                    {p.description && <p className="mt-1 line-clamp-2 text-xs text-white/60">{p.description}</p>}
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        {p.old_price && <p className="text-xs text-white/40 line-through">${Number(p.old_price).toLocaleString("es-AR")}</p>}
                        <p className="text-xl font-black text-orange-400">${Number(p.price).toLocaleString("es-AR")}</p>
                      </div>
                      {p.stock && <span className="text-[10px] text-white/50">Stock: {p.stock}</span>}
                    </div>
                    {negocio.whatsapp && (
                      <a
                        href={`https://wa.me/${String(negocio.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, te consulto por "${p.name}" que vi en La Gran Barata Digital`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-green-400/30 bg-green-500/10 py-2 text-xs font-bold text-green-300 hover:bg-green-500/20"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Consultar por WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ReviewsSection businessId={negocio.id} baseRating={Number(negocio.rating || 0)} baseCount={Number(negocio.reviews || 0)} />
        <Chat businessId={negocio.id} ownerId={negocio.owner_id} businessName={negocio.name} businessSlug={negocio.slug} />
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-10 text-center">
        {negocio && <ReportButton businessId={negocio.id} businessName={negocio.name} />}
      </div>
      <div className="mx-auto max-w-4xl px-4 pb-8">
        <LevelUpCard slug={slug} />
      </div>
    </main>
  );
}
