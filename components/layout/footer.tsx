"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, MessageCircle } from "lucide-react";
import { usePlatformSetting } from "@/lib/hooks/use-platform-settings";

const COLS = [
  {
    t: "Explorá",
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
    t: "Comunidad",
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
    t: "Negocios",
    links: [
      { href: "/para-negocios", l: "Publicar mi negocio" },
      { href: "/dashboard", l: "Panel del comerciante" },
      { href: "/planes", l: "Planes y precios" },
      { href: "/mensajes", l: "Mensajes" },
      { href: "/asistente", l: "Asistente IA" },
    ],
  },
];

// En desktop las columnas se muestran siempre abiertas (grid de las
// maquetas); en mobile cada una es una solapa que se abre con un clic,
// así el pie entra en una sola mirada.
export default function Footer() {
  const whatsapp = usePlatformSetting("whatsapp_contacto");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <footer className="site-footer border-t border-[var(--line)] bg-black pb-24 text-[var(--text)] md:pb-8">
      <div className="mx-auto max-w-[1700px] px-4 py-12 sm:px-6 md:py-16">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr_1fr] md:gap-10">
          <div>
            <Link href="/" className="group inline-flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent)] transition-all duration-300 group-hover:rotate-6 group-hover:scale-110">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-display text-xl tracking-tight">LA GRAN BARATA</span>
                <span className="mt-1 text-[9px] font-bold uppercase leading-none tracking-[0.3em] text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>World Class · Digital</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm italic leading-relaxed text-[var(--muted)]">
              Todas las ofertas y negocios de San Lorenzo en un solo lugar.
            </p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-[var(--muted2)]" style={{ fontFamily: "var(--font-display)" }}>Hecho en San Lorenzo · Santa Fe · Argentina</p>
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-[var(--ok)] transition hover:border-emerald-400/50 hover:bg-emerald-500/20"
                style={{ fontFamily: "var(--font-display)" }}>
                <MessageCircle className="h-4 w-4" /> WhatsApp de la plataforma
              </a>
            )}
          </div>

          {COLS.map((col) => {
            const isOpen = !!open[col.t];
            return (
              <div key={col.t} className="border-b border-[var(--line)] pb-3 md:border-0 md:pb-0">
                <button type="button" onClick={() => setOpen((o) => ({ ...o, [col.t]: !o[col.t] }))}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-2 py-1 text-left md:pointer-events-none md:cursor-default">
                  <h3 className="font-display text-lg uppercase italic tracking-wide text-[var(--accent-ink)]">{col.t}</h3>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--muted2)] transition-transform md:hidden ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <ul className={`mt-4 space-y-2.5 ${isOpen ? "block" : "hidden"} md:block`}>
                  {col.links.map((li) => (
                    <li key={li.href}>
                      <Link href={li.href} className="text-[13px] font-semibold text-[var(--muted)] transition hover:text-[var(--accent-ink)]">
                        {li.l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-6 text-xs text-[var(--muted)]">
          <p>© 2026 La Gran Barata Digital · San Lorenzo, Santa Fe</p>
          <div className="flex gap-4">
            <Link href="/privacidad" className="hover:text-[var(--accent-ink)]">Política de Privacidad</Link>
            <Link href="/terminos" className="hover:text-[var(--accent-ink)]">Términos y Condiciones</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
