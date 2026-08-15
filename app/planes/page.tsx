"use client";
import Link from "next/link";
import { Check, X, Zap, Rocket, Crown } from "lucide-react";
import Badge from "@/components/ui/badge";
import { usePlatformSetting } from "@/lib/hooks/use-platform-settings";
import { MAX_DESTACADOS_SEMANALES } from "@/lib/plans";

const PLANES = [
  {
    nombre: "Gratis",
    precio: "$0",
    periodo: "para siempre",
    icon: Zap,
    color: "border-white/15",
    desc: "Para empezar a vender en San Lorenzo",
    features: [
      { t: "Perfil de negocio completo", ok: true },
      { t: "3 ofertas activas", ok: true },
      { t: "Chat con clientes", ok: true },
      { t: "Aparecer en mapa y búsqueda", ok: true },
      { t: "Estadísticas básicas", ok: false },
      { t: "Negocio destacado", ok: false },
      { t: "Ofertas ilimitadas", ok: false },
    ],
    cta: "Crear cuenta gratis",
    href: "/registro",
  },
  {
    nombre: "PRO Comerciante",
    precio: "$9.900",
    periodo: "por mes",
    icon: Rocket,
    color: "border-orange-400/60",
    destacado: true,
    desc: "Para comercios que quieren crecer",
    features: [
      { t: "Todo lo del plan Gratis", ok: true },
      { t: "Ofertas ilimitadas", ok: true },
      { t: "Estadísticas completas", ok: true },
      { t: "Historias 24h con fotos", ok: true },
      { t: "Responder reseñas", ok: true },
      { t: "Cupones ilimitados", ok: true },
      { t: "Posición destacada fija", ok: false },
    ],
    cta: "Quiero PRO Comerciante",
    href: "/dashboard/planes",
  },
  {
    nombre: "Destacado Semanal",
    precio: "$19.900",
    periodo: `7 días · cupo de ${MAX_DESTACADOS_SEMANALES} negocios`,
    icon: Crown,
    color: "border-yellow-400/50",
    desc: "Posición destacada fija por una semana",
    features: [
      { t: "Todo lo de PRO Comerciante", ok: true },
      { t: "Posición destacada fija 7 días", ok: true },
      { t: "Badge de destacado", ok: true },
      { t: "Cupo limitado (solo 5 negocios a la vez)", ok: true },
      { t: "Se renueva cada semana, sin permanencia", ok: true },
    ],
    cta: "Quiero Destacado Semanal",
    href: "/dashboard/planes",
  },
];

import PageHero from "@/components/ui/page-hero";

export default function PlanesPage() {
  const whatsapp = usePlatformSetting("whatsapp_contacto");
  return (
    <main className="bg-[#0a0710] min-h-screen text-white pb-24">
      <PageHero title="💎 Planes y precios" subtitle="Elegí el plan que mejor se adapte a tu negocio" />
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="text-center">
          <Badge variant="warning" size="sm">Planes para comercios</Badge>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">
            Hacé crecer tu negocio en{" "}
            <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">San Lorenzo</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-white/60">
            Elegí el plan que se adapte a tu comercio. Sin permanencia, cancelás cuando quieras.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANES.map(p => (
            <div key={p.nombre}
              className={`relative flex flex-col rounded-3xl border-2 bg-white/[0.03] p-6 ${p.color} ${
                p.destacado ? "shadow-[0_0_40px_-10px_rgba(249,115,22,0.4)] md:-translate-y-3" : ""
              }`}>
              {p.destacado && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-1 text-xs font-black">
                  ⭐ MÁS ELEGIDO
                </span>
              )}
              <p.icon className={`h-8 w-8 ${p.destacado ? "text-orange-400" : "text-white/60"}`} />
              <h2 className="mt-3 text-xl font-black">{p.nombre}</h2>
              <p className="text-sm text-white/50">{p.desc}</p>
              <p className="mt-4">
                <span className="text-4xl font-black">{p.precio}</span>
                <span className="ml-1 text-sm text-white/50">/{p.periodo}</span>
              </p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map(f => (
                  <li key={f.t} className={`flex items-center gap-2 text-sm ${f.ok ? "text-white/80" : "text-white/30 line-through"}`}>
                    {f.ok ? <Check className="h-4 w-4 shrink-0 text-green-400" /> : <X className="h-4 w-4 shrink-0 text-white/20" />}
                    {f.t}
                  </li>
                ))}
              </ul>

              <Link href={p.href}
                className={`mt-6 rounded-xl py-3 text-center text-sm font-black transition ${
                  p.destacado
                    ? "bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90"
                    : "border border-white/20 hover:bg-white/10"
                }`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-xl text-center text-sm text-white/50">
          <p>
            Los planes pagos se activan por transferencia: subís el comprobante desde tu panel y un admin lo
            revisa y te lo activa. Pago automático con Mercado Pago: <span className="text-white/70">próximamente</span>.
          </p>
          {whatsapp && (
            <p className="mt-2">
              ¿Dudas? Escribinos por WhatsApp y te asesoramos sin cargo →{" "}
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="font-bold text-orange-400">
                Contactar
              </a>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
