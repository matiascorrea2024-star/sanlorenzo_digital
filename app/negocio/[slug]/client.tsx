"use client";
import LevelUpCard from "@/components/ui/level-up-card";
import DivisionFrame from "@/components/ui/division-frame";

import ReportButton from "@/components/business/report-button";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import { MapPin, Clock, Phone, MessageCircle, Star, Share2, Heart, ArrowLeft, ExternalLink } from "lucide-react";
import Badge from "@/components/ui/badge";
import OfferCard from "@/components/ui/offer-card";
import BusinessMap from "@/components/business/map";
import ReviewsSection from "@/components/business/reviews-section";
import Chat from "@/components/business/chat";
import FollowButton from "@/components/business/follow-button";
import NotifyMeButton from "@/components/offers/notify-me-button";
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
  const [negocio, setNegocio] = useState<any>(null);
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      setUser(user);

      // Cargar negocio
      const { data: biz } = await supabase()
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .single();

      if (biz) {
        setNegocio(biz);

        // Cargar ofertas activas
        const { data: offers } = await supabase()
          .from("offers")
          .select("*")
          .eq("business_id", biz.id)
          .eq("active", true)
          .order("created_at", { ascending: false });

        if (offers) {
          const hoy = new Date().toISOString().slice(0, 10);
          const activas = offers.filter((o: any) => !o.valid_until || o.valid_until >= hoy);
          // Cargar productos
        const { data: prods } = await supabase()
          .from("products")
          .select("*")
          .eq("business_id", biz.id)
          .eq("active", true)
          .order("created_at", { ascending: false });
        if (prods) setProductos(prods);

        setOfertas(activas.map((o: any) => ({
            id: o.id,
            negocio: biz.name,
            slug: biz.slug,
            producto: o.title,
            cat: biz.category,
            vence: o.valid_until,
            descuento: o.discount_percent,
            antes: o.old_price ? Number(o.old_price) : undefined,
            ahora: o.offer_price ? Number(o.offer_price) : undefined,
            portada_url: o.image_url || biz.portada_url,
            latitude: biz.latitude,
            longitude: biz.longitude,
          })));
        }
      }
      setLoading(false);
    })();
  }, [slug]);

  // Registrar visita (una vez por sesión)
  useEffect(() => {
    if (!negocio) return;
    const key = `sld-view-${negocio.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase().from("page_views").insert({ business_id: negocio.id });
  }, [negocio]);

  // Track vista del negocio
  useEffect(() => {
    if (negocio) trackViewBusiness(negocio.id);
  }, [negocio]);

  const share = async () => {
    const url = window.location.href;
    const text = `🔥 ${negocio.name} en San Lorenzo Digital\n📍 ${negocio.address}\n⭐ ${negocio.rating} (${negocio.reviews} reseñas)`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: negocio.name, text, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert("¡Link copiado! Compartilo donde quieras.");
    }
  };

  if (loading) {
    return (
      <main className="bg-[#0a0710] min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-white/60">Cargando negocio...</p>
        </div>
      </main>
    );
  }

  if (!negocio) {
    return (
      <main className="bg-[#0a0710] min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="text-2xl font-black">Negocio no encontrado</h1>
          <Link href="/" className="mt-4 inline-block text-orange-400 hover:text-orange-300">← Volver al inicio</Link>
        </div>
      </main>
    );
  }

  const portada = negocio.portada_url || CATEGORY_IMAGES[negocio.category] || CATEGORY_IMAGES.gastronomia;

  // Schema.org LocalBusiness (SEO nivel pro: estrellas en Google, mapa, horarios)
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
    geo: negocio.latitude
      ? { "@type": "GeoCoordinates", latitude: Number(negocio.latitude), longitude: Number(negocio.longitude) }
      : undefined,
    openingHours: negocio.schedule || undefined,
    aggregateRating: negocio.reviews
      ? { "@type": "AggregateRating", ratingValue: negocio.rating || 0, reviewCount: negocio.reviews || 0 }
      : undefined,
  };

  return (
    <main className="bg-[#0a0710] min-h-screen text-white pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* HERO CON PORTADA */}
      <section className="relative h-64 md:h-80">
        <img src={portada} alt={negocio.name} className="h-56 w-full object-cover md:h-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0710] via-[#0a0710]/60 to-transparent" />
        
        <button onClick={() => router.back()} className="absolute left-4 top-4 rounded-full bg-black/50 p-2 backdrop-blur-md hover:bg-black/70">
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-start gap-4">
              {negocio.logo_url ? (
                <DivisionFrame puntos={negocio.puntos || 0} size={72} categoria={negocio.category}><img src={negocio.logo_url} alt={negocio.name} className="h-20 w-20 rounded-2xl border-4 border-[#0a0710] object-cover shadow-2xl" /></DivisionFrame>
              ) : (
                <DivisionFrame puntos={negocio.puntos || 0} size={80} categoria={negocio.category} showLabel><div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-[#0a0710] bg-gradient-to-br from-orange-500 to-pink-500 text-3xl font-black shadow-2xl">
                  {negocio.name[0]}
                </div></DivisionFrame>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {negocio.status === "verificado" && (
                    <Badge variant="success" size="sm">✓ Verificado</Badge>
                  )}
                  {negocio.open !== undefined && (
                    <Badge variant={negocio.open ? "success" : "danger"} size="sm">
                      {negocio.open ? "● Abierto ahora" : "● Cerrado"}
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-black md:text-4xl">{negocio.name}</h1>
                <p className="mt-1 text-sm capitalize text-white/70">{negocio.category}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <FollowButton businessId={negocio.id} />
                  <LevelBadge businessId={negocio.id} verificado={negocio.status === "verificado"} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* ACCIONES RÁPIDAS */}
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {negocio.whatsapp && (
            <a onClick={() => trackClickWhatsApp(negocio.id)} href={`https://wa.me/${negocio.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, vi ${negocio.name} en San Lorenzo Digital`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-2xl border border-green-400/30 bg-green-500/10 p-4 hover:bg-green-500/20 transition">
              <MessageCircle className="h-6 w-6 text-green-400" />
              <span className="text-sm font-bold">WhatsApp</span>
            </a>
          )}
          {negocio.address && (
            <a onClick={() => trackClickMap(negocio.id)} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.address)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition">
              <MapPin className="h-6 w-6 text-orange-400" />
              <span className="text-sm font-bold">Cómo llegar</span>
            </a>
          )}
          <button onClick={share}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition">
            <Share2 className="h-6 w-6 text-sky-400" />
            <span className="text-sm font-bold">Compartir</span>
          </button>
          <Link href={`/negocio/${negocio.slug}/favorito`}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition">
            <Heart className="h-6 w-6 text-red-400" />
            <span className="text-sm font-bold">Guardar</span>
          </Link>
        </div>

        {/* INFO DEL NEGOCIO */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-black mb-4">📞 Información</h2>
            <div className="space-y-3">
              {negocio.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">Dirección</p>
                    <p className="text-sm text-white/70">{negocio.address}</p>
                  </div>
                </div>
              )}
              {negocio.schedule && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">Horarios</p>
                    <p className="text-sm text-white/70">{negocio.schedule}</p>
                  </div>
                </div>
              )}
              {negocio.whatsapp && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">WhatsApp</p>
                    <p className="text-sm text-white/70">{negocio.whatsapp}</p>
                  </div>
                </div>
              )}
              {negocio.instagram && (
                <div className="flex items-start gap-3">
                  <ExternalLink className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">Instagram</p>
                    <a href={`https://instagram.com/${negocio.instagram}`} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-orange-400 hover:text-orange-300">@{negocio.instagram}</a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MAPA */}
          {negocio.latitude && negocio.longitude && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-black mb-4">📍 Ubicación</h2>
              <BusinessMap latitude={negocio.latitude} longitude={negocio.longitude} address={negocio.address} />
            </div>
          )}
        </div>

        {/* DESCRIPCIÓN */}
        {negocio.description && (
          <div className="mb-8">
            <h2 className="text-xl font-black mb-3">Sobre el negocio</h2>
            <p className="text-white/80 leading-relaxed">{negocio.description}</p>
          </div>
        )}

        {/* OFERTAS ACTIVAS */}
        {ofertas.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-black mb-4">🔥 Ofertas activas ({ofertas.length})</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {ofertas.map((o) => (
                <OfferCard key={o.id} o={o} />
              ))}
            </div>
          </div>
        )}

        {/* PRODUCTOS */}
        {productos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-black mb-4">🛍️ Productos ({productos.length})</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {productos.map(p => (
                <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-bold">{p.name}</p>
                  {p.description && <p className="text-xs text-white/60 mt-1 line-clamp-2">{p.description}</p>}
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      {p.old_price && <p className="text-xs text-white/40 line-through">${Number(p.old_price).toLocaleString("es-AR")}</p>}
                      <p className="text-xl font-black text-orange-400">${Number(p.price).toLocaleString("es-AR")}</p>
                    </div>
                    {p.stock && <span className="text-[10px] text-white/50">Stock: {p.stock}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESEÑAS */}
        <ReviewsSection businessId={negocio.id} baseRating={Number(negocio.rating || 0)} baseCount={Number(negocio.reviews || 0)} />

        {/* CHAT */}
        <Chat businessId={negocio.id} ownerId={negocio.owner_id} businessName={negocio.name} businessSlug={negocio.slug} />
      </div>
    <div className="mx-auto max-w-4xl px-4 pb-10 text-center">
        {negocio && <ReportButton businessId={negocio.id} businessName={negocio.name} />}
      </div>
    <div className="mx-auto max-w-4xl px-4 pb-8"><LevelUpCard slug={slug} /></div>
    </main>
  );
}