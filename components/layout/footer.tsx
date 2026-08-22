"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
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
      { href: "/pedidos", l: "¿Quién tiene esto?" },
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

// Antes las 3 columnas (23 links en total) se mostraban siempre
// abiertas, siempre -- en cualquier pantalla, en cualquier página del
// sitio. Se sentía como una pared de opciones sueltas. Ahora cada
// columna es una "solapita" que se abre con un clic; colapsadas por
// defecto, así el pie de página entra en una sola mirada y cada quien
// abre solo la sección que le interesa.
export default function Footer() {
  const whatsapp = usePlatformSetting("whatsapp_contacto");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <footer className="site-footer border-t border-white/10 bg-[#0c0a0b] pb-24 text-[#f7f3ec] md:pb-8">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-4 md:gap-8">
          <div>
            <p className="text-lg font-black">LA GRAN <span className="text-[var(--accent)]">BARATA</span> DIGITAL</p>
            <p className="mt-2 text-sm text-[#a99b86]">
              Todas las ofertas y negocios de San Lorenzo en un solo lugar.
            </p>
            <p className="mt-3 text-xs text-[#7d6f5c]">Hecho en San Lorenzo, Santa Fe · Argentina</p>
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-[var(--ok)] transition hover:bg-emerald-500/20">💬 WhatsApp de la plataforma</a>
            )}
          </div>
          {COLS.map((col) => {
            const isOpen = !!open[col.t];
            return (
              <div key={col.t} className="border-b border-[var(--line)] pb-3 md:border-0 md:pb-0">
                <button type="button" onClick={() => setOpen((o) => ({ ...o, [col.t]: !o[col.t] }))}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-2 py-1 text-left text-sm font-black text-[#f7f3ec] transition hover:text-[var(--accent)]">
                  {col.t}
                  <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--muted2)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <ul className={`mt-3 space-y-2 ${isOpen ? "block" : "hidden"}`}>
                  {col.links.map((li) => (
                    <li key={li.href}>
                      <Link href={li.href} className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition">
                        {li.l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-6 text-xs text-[var(--muted)]">
          <p>© 2026 La Gran Barata Digital · San Lorenzo, Santa Fe</p>
          <div className="flex gap-4">
            <Link href="/privacidad" className="hover:text-[var(--accent)]">Política de Privacidad</Link>
            <Link href="/terminos" className="hover:text-[var(--accent)]">Términos y Condiciones</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
