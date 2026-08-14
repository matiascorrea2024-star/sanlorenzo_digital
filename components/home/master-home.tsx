"use client";
import RankBadge from "@/components/ui/rank-badge";
import HeroMedia from "@/components/home/hero-media";
import DivisionFrame from "@/components/ui/division-frame";


import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import CercaTuyo from "./cerca-tuyo";
import { useAllBusinesses } from "@/lib/use-businesses";
import OfferCard from "@/components/ui/offer-card";
import Badge from "@/components/ui/badge";
import {
  Flame, Store, Zap, MapPin, Star, TrendingUp,
  ShoppingBag, Scissors, Wrench, Briefcase, Car, Laptop, Shirt, Footprints,
  Check, Sparkles, ArrowRight, Trophy, Heart,
  Home, HardHat, GraduationCap, Dumbbell, PawPrint, PartyPopper, Building2,
  Truck, Package, Sprout, Factory, Cog, Anchor, Ship
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  calzado: Footprints, gastronomia: ShoppingBag, ferreteria: Wrench,
  belleza: Scissors, ropa: Shirt, automotor: Car,
  profesionales: Briefcase, tecnologia: Laptop,
  salud: Heart, hogar: Home, construccion: HardHat,
  educacion: GraduationCap, deportes: Dumbbell, mascotas: PawPrint,
  eventos: PartyPopper, inmobiliarias: Building2, transporte: Truck,
  logistica: Package, agro: Sprout, industria: Factory,
  "servicios-industriales": Cog, portuario: Anchor,
  "comercio-exterior": Ship, b2b: Briefcase,
};

const FALLBACK = "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85";

type Oferta = {
  id: string; negocio: string; slug: string; producto: string; cat: string;
  vence?: string; descuento?: number; discountTxt?: string;
  antes?: number; ahora?: number; real?: boolean;
  portada_url?: string; logo_url?: string;
  latitude?: number; longitude?: number;
};


export default function MasterHome() {
  const router = useRouter();
  const [ofertasReales, setOfertasReales] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "hoy" | "30" | "50">("todas");
  const [filtroAbierto, setFiltroAbierto] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const todos = useAllBusinesses();

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  // Geolocalización
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  // Cargar ofertas reales de Supabase
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase()
          .from("offers_with_business")
          .select("*").order("created_at", { ascending: false }).limit(50);
        if (data) {
          const hoy = new Date().toISOString().slice(0, 10);
          const reales: Oferta[] = data
            .filter((o: any) => o.active && (!o.valid_until || o.valid_until >= hoy))
            .map((o: any) => ({
              id: o.id, negocio: o.business_name, slug: o.business_slug,
              producto: o.title, cat: o.business_category || "",
              vence: o.valid_until, descuento: o.discount_percent,
              discountTxt: o.discount_percent ? `${o.discount_percent}% OFF` : "OFERTA",
              antes: o.old_price ? Number(o.old_price) : undefined,
              ahora: o.offer_price ? Number(o.offer_price) : undefined,
              real: true, portada_url: o.business_portada, logo_url: o.business_logo,
              latitude: o.business_latitude, longitude: o.business_longitude,
            }));
          setOfertasReales(reales);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const ofertas = ofertasReales;

  // Recomendaciones basadas en búsquedas recientes (localStorage), sobre ofertas reales
  const recomendaciones = useMemo(() => {
    try {
      const recent: string[] = JSON.parse(localStorage.getItem("sld-recent") || "[]");
      if (!recent.length) return [];
      const term = recent[0].toLowerCase();
      return ofertas.filter(o =>
        o.producto.toLowerCase().includes(term) || o.cat.includes(term) || o.negocio.toLowerCase().includes(term)
      ).slice(0, 4);
    } catch {
      return [];
    }
  }, [ofertas]);


  // Ofertas urgentes: vencen hoy o mañana, o con descuento alto
  const urgentes = useMemo(() => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return ofertas
      .filter(o => {
        if (!o.vence) return false;
        const d = Math.round((new Date(o.vence + "T00:00:00").getTime() - hoy.getTime()) / 86400000);
        return d <= 1 || (o.descuento || 0) >= 40;
      })
      .slice(0, 4);
  }, [ofertas]);

  // Filtros
  const ofertasFiltradas = ofertas.filter((o) => {
    if (filtro === "hoy") {
      if (!o.vence) return false;
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const v = new Date(o.vence + "T00:00:00");
      if (Math.round((v.getTime() - hoy.getTime()) / 86400000) !== 0) return false;
    }
    if (filtro === "30" && (o.descuento || 0) < 30) return false;
    if (filtro === "50" && (o.descuento || 0) < 50) return false;
    return true;
  });

  const stats = {
    promos: ofertas.length,
    negocios: todos.length,
    terminan: ofertas.filter((o) => {
      if (!o.vence) return false;
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      return Math.round((new Date(o.vence + "T23:59:59").getTime() - hoy.getTime()) / 86400000) <= 3;
    }).length,
  };

  const destacados = [...todos]
    .filter(b => !filtroAbierto || b.open)
    .sort((a: any, b: any) => ((b.plan === "premium" ? 1 : 0) - (a.plan === "premium" ? 1 : 0)) || ((b.destacado ? 1 : 0) - (a.destacado ? 1 : 0)) || ((b.status === "verificado" ? 1 : 0) - (a.status === "verificado" ? 1 : 0)))
    .slice(0, 4);

  return (
    <main className="bg-[#0a0710] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <HeroMedia />
        {/* Gradiente de blending inferior */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0710] to-transparent" />
        {/* Overlay centrado encima de la imagen completa */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="fade-up mb-3 rounded-full border border-orange-400/40 bg-black/50 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300 backdrop-blur-md">
            🛍️ El lugar de compras de San Lorenzo
          </span>
          <h1 className="fade-up text-3xl font-black leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] md:text-5xl lg:text-6xl">
            Encontrá{" "}
            <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-orange-400 bg-clip-text text-transparent text-shimmer">
              ofertas reales
            </span>
            <br />
            en 3 segundos
          </h1>
          <p className="fade-up-2 mt-3 max-w-xl text-sm text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] md:text-base">
            Todas las promociones, negocios y descuentos de San Lorenzo.
            <br className="hidden md:block" /> Sin vueltas, sin mentiras.
          </p>
        </div>
        {/* Partículas flotantes */}
        <span className="floaty pointer-events-none absolute left-[6%] top-[18%] z-10 text-3xl opacity-70 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]">🛍️</span>
        <span className="floaty2 pointer-events-none absolute right-[8%] top-[26%] z-10 text-3xl opacity-70 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]">🔥</span>
        <span className="floaty3 pointer-events-none absolute bottom-[28%] left-[16%] z-10 text-2xl opacity-60 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">✦</span>
        <span className="floaty2 pointer-events-none absolute bottom-[34%] right-[20%] z-10 text-2xl opacity-60 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]">💸</span>
      </section>

      {/* CATEGORÍAS */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <Badge variant="warning" size="sm">Explorá</Badge>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">¿Qué buscás hoy?</h2>
          </div>
          <Link href="/negocios" className="text-sm font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1">
            Ver todo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {CATEGORIES.map((c) => {
            const Icon = ICON_MAP[c.id] || ShoppingBag;
            const count = todos.filter((b) => b.category === c.id).length;
            return (
              <Link key={c.id} href={"/negocios?cat=" + c.id}
                className="group relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-orange-400/50 hover:bg-white/[0.06]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-pink-500/20">
                  <Icon className="h-6 w-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold">{c.name}</p>
                  <p className="text-xs text-white/50">{count} {count === 1 ? "negocio" : "negocios"}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* LA GRAN BARATA */}
      <section className="border-y border-white/5 bg-gradient-to-b from-[#0d0815] via-[#0a0710] to-[#0a0710] py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Badge variant="danger" size="sm" pulse>
                <Flame className="h-3 w-3" /> Ofertas del momento
              </Badge>
              <h2 className="mt-2 text-3xl font-black md:text-4xl">La Gran Barata</h2>
              <p className="text-sm text-white/60">Publicadas por comercios reales de San Lorenzo</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { k: "todas", l: "Todas" },
                { k: "hoy", l: "🔥 Vence hoy" },
                { k: "30", l: "30%+ OFF" },
                { k: "50", l: "50%+ OFF" },
              ].map((f) => (
                <button key={f.k} onClick={() => setFiltro(f.k as any)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    filtro === f.k
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                      : "border border-white/15 bg-white/5 text-white/70 hover:border-orange-400/50"
                  }`}>
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              ))}
            </div>
          ) : ofertasFiltradas.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ofertasFiltradas.slice(0, 8).map((o) => <OfferCard key={o.id} o={o} userCoords={coords} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
              <p className="text-lg font-bold">No hay ofertas con este filtro</p>
              <p className="mt-1 text-sm text-white/50">Probá con otro filtro o mirá todas las ofertas.</p>
            </div>
          )}

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/radar"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-6 py-3 text-sm font-black hover:opacity-90 transition">
              <Zap className="h-4 w-4" /> Ver radar (terminan hoy)
            </Link>
            <Link href="/promociones"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-bold transition hover:border-orange-400 hover:bg-orange-500/10">
              Ver todas las ofertas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* NEGOCIOS DESTACADOS */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge variant="info" size="sm">
              <Trophy className="h-3 w-3" /> Recomendados
            </Badge>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">Negocios destacados</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFiltroAbierto(!filtroAbierto)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                filtroAbierto ? "bg-green-500 text-white" : "border border-white/15 bg-white/5 text-white/70 hover:border-green-400/50"
              }`}>
              🟢 Abierto ahora
            </button>
            <Link href="/mapa" className="text-sm font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1">
              Ver en el mapa <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {destacados.map((b: any) => (
            <Link key={b.id} href={"/negocio/" + b.slug}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-orange-400/50">
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <img src={b.portada_url || "/banner.png"} onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/banner.png"; }} alt={b.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                  {b.plan === "premium" && (
                    <Badge variant="warning" size="sm">⭐ Premium</Badge>
                  )}
                  {b.status === "verificado" && (
                    <Badge variant="success" size="sm">
                      <Check className="h-3 w-3" /> Verificado
                    </Badge>
                  )}
                </div>
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70">
                  <Heart className="h-4 w-4 text-white" />
                </button>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-1 text-xs text-white/60">
                  <MapPin className="h-3 w-3" />
                  <span className="capitalize">{b.category}</span>
                  {b.open !== undefined && (
                    <>
                      <span className="text-white/20">·</span>
                      <span className={b.open ? "text-green-400" : "text-red-400"}>
                        {b.open ? "● Abierto" : "● Cerrado"}
                      </span>
                    </>
                  )}
                </div>
                <h3 className="mt-1 font-black">{b.name}</h3>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{(b.rating || 0).toFixed(1)}</span>
                    <span className="text-white/40">({b.reviews || 0})</span>
                  </div>
                  <span className="text-xs font-bold text-orange-400">Ver →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      
      {/* RECOMENDACIONES PERSONALIZADAS */}
      {recomendaciones.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-4">
            <Badge variant="info" size="sm">✨ Para vos</Badge>
            <h2 className="mt-2 text-2xl font-black">Podría interesarte</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recomendaciones.map((o) => <OfferCard key={o.id} o={o} userCoords={coords} />)}
          </div>
        </section>
      )}

      
      {/* PARA EMPRESAS — B2B + PORTUARIO */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <Badge size="sm" className="bg-indigo-500/15 border-indigo-400/40 text-indigo-200">
            💼 Para empresas
          </Badge>
          <h2 className="mt-2 text-2xl font-black md:text-3xl">Ecosistema industrial y portuario</h2>
          <p className="text-sm text-white/60 mt-1">El cordón industrial más importante del Paraná, en un solo lugar.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Link href="/b2b"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 hover:border-indigo-400/50 transition">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15">
                <Factory className="h-7 w-7 text-indigo-300" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-black">🏭 Industria y B2B</p>
                <p className="text-sm text-white/60">Proveedores, servicios industriales y empresas</p>
              </div>
              <ArrowRight className="h-5 w-5 text-indigo-400 transition group-hover:translate-x-1" />
            </div>
          </Link>
          <Link href="/portuario"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 hover:border-cyan-400/50 transition">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15">
                <Anchor className="h-7 w-7 text-cyan-300" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-black">⚓ Portuario</p>
                <p className="text-sm text-white/60">Terminales, logística fluvial y comercio exterior</p>
              </div>
              <ArrowRight className="h-5 w-5 text-cyan-400 transition group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </section>

      
      {/* ÚLTIMAS OPORTUNIDADES */}
      {urgentes.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-3xl border border-red-400/40 bg-gradient-to-br from-red-900/20 via-[#0a0710] to-orange-900/20 p-6 md:p-8">
            <div className="flex items-end justify-between mb-6">
              <div>
                <Badge variant="danger" size="md" pulse>
                  <Flame className="h-3 w-3" /> Últimas oportunidades
                </Badge>
                <h2 className="mt-2 text-2xl font-black md:text-3xl">
                  Se acaban hoy
                </h2>
                <p className="text-sm text-white/60 mt-1">Ofertas con countdown activo</p>
              </div>
              <Link href="/radar"
                className="rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 text-sm font-black hover:opacity-90 transition">
                Ver radar completo →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {urgentes.map((o) => <OfferCard key={o.id} o={o} userCoords={coords} />)}
            </div>
          </div>
        </section>
      )}

      <CercaTuyo />

      {/* CIUDADES ACTIVAS */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <Badge variant="info" size="sm">🏙️ Ciudades</Badge>
          <h2 className="mt-2 text-2xl font-black md:text-3xl">Explorá por ciudad</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <Link href="/san-lorenzo"
            className="rounded-2xl border border-orange-400/40 bg-gradient-to-br from-orange-500/10 to-pink-500/10 p-5 hover:border-orange-400 transition">
            <p className="font-black text-lg">San Lorenzo</p>
            <p className="text-xs text-white/60 mt-1">8 negocios activos</p>
            <p className="text-xs text-orange-400 mt-2 font-bold">Explorar →</p>
          </Link>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 opacity-50">
            <p className="font-bold">Puerto San Martín</p>
            <p className="text-xs text-white/50 mt-1">Próximamente</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 opacity-50">
            <p className="font-bold">Rosario</p>
            <p className="text-xs text-white/50 mt-1">Próximamente</p>
          </div>
        </div>
      </section>

      {/* CTA COMERCIAL */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-red-500 to-pink-600 p-8 md:p-14">
          <div className="relative z-10 grid gap-4 md:grid-cols-2 md:items-center">
            <div>
              <Badge size="sm" className="bg-white/20 border-white/30 text-white">
                <TrendingUp className="h-3 w-3" /> Para comerciantes
              </Badge>
              <h2 className="mt-3 text-3xl font-black md:text-4xl">
                Hacé crecer tu negocio en San Lorenzo
              </h2>
              <p className="mt-2 text-sm text-white/90 md:text-base">
                Llegá a nuevos clientes de San Lorenzo publicando ofertas, productos y promociones 
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["🔥 Ofertas", "🛍️ Productos", "📸 Fotos", "📍 Ubicación", "💬 Chat"].map((t) => (
                  <span key={t} className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">{t}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Link href="/para-negocios"
                className="rounded-xl bg-white px-8 py-4 text-base font-black text-red-600 shadow-xl transition hover:bg-orange-50">
                Quiero publicar mi negocio →
              </Link>
              <Link href="/login"
                className="rounded-xl border-2 border-white/60 px-8 py-4 text-sm font-black hover:bg-white/10">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}