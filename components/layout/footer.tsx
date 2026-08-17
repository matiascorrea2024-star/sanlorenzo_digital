"use client";
import Link from "next/link";
import { usePlatformSetting } from "@/lib/hooks/use-platform-settings";

const COLS = [
  {
    t: "🔍 Explorá",
    links: [
      { href: "/pulso", l: "Pulso de la ciudad" },
      { href: "/negocios", l: "Negocios" },
      { href: "/particulares", l: "Venta entre vecinos" },
      { href: "/promociones", l: "Ofertas activas" },
      { href: "/ofertas-finalizadas", l: "Ofertas finalizadas" },
      { href: "/mapa", l: "Mapa de la ciudad" },
      { href: "/buscar", l: "Buscador inteligente" },
      { href: "/radar", l: "Radar de ofertas" },
      { href: "/comparar", l: "Comparador" },
    ],
  },
  {
    t: "👥 Comunidad",
    links: [
      { href: "/comunidad", l: "Chat de la ciudad" },
      { href: "/reels", l: "Reels" },
      { href: "/feed", l: "Muro en vivo" },
      { href: "/ranking", l: "Ranking de negocios" },
      { href: "/vecinos", l: "Ranking de vecinos" },
      { href: "/perfil", l: "Tu perfil y misiones" },
      { href: "/favoritos", l: "Tus favoritos" },
      { href: "/blog", l: "Blog" },
    ],
  },
  {
    t: "🏪 Negocios",
    links: [
      { href: "/para-negocios", l: "Publicar mi negocio" },
      { href: "/dashboard", l: "Panel del comerciante" },
      { href: "/planes", l: "Planes y precios" },
      { href: "/mensajes", l: "Mensajes" },
      { href: "/asistente", l: "Asistente IA" },
    ],
  },
];

export default function Footer() {
  const whatsapp = usePlatformSetting("whatsapp_contacto");
  return (
    <footer className="border-t border-white/10 bg-[#0c0a0b] pb-24 md:pb-8">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <p className="text-lg font-black">🛍️ LA GRAN <span className="text-orange-400">BARATA</span> DIGITAL</p>
            <p className="mt-2 text-sm text-white/50">
              Todas las ofertas y negocios de San Lorenzo en un solo lugar.
            </p>
            <p className="mt-3 text-xs text-white/55">Hecho en San Lorenzo, Santa Fe · Argentina 🇦🇷</p>
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20">💬 WhatsApp de la plataforma</a>
            )}
          </div>
          {COLS.map((col) => (
            <div key={col.t}>
              <p className="text-sm font-black text-white/80">{col.t}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((li) => (
                  <li key={li.href}>
                    <Link href={li.href} className="text-sm text-white/50 hover:text-orange-400 transition">
                      {li.l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/55">
          <p>© 2026 La Gran Barata Digital · San Lorenzo, Santa Fe</p>
          <div className="flex gap-4">
            <Link href="/privacidad" className="hover:text-orange-400">Política de Privacidad</Link>
            <Link href="/terminos" className="hover:text-orange-400">Términos y Condiciones</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
