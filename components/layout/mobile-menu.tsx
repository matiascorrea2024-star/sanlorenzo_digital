"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, MapPin, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

// El header en mobile solo muestra logo + campana + avatar -- la nav
// de rubros, el selector de ciudad y el CTA de "Publicar negocio"
// quedan escondidos detrás de `md:` porque el header de escritorio no
// entra en una pantalla chica. Sin este menú, la única forma de llegar
// a Comunidad/Reels/Particulares/etc. en mobile era scrollear hasta el
// pie de página -- la mayoría no llega tan abajo.
const SECCIONES = [
  {
    t: "Explorá",
    links: [
      { href: "/negocios", l: "Negocios" },
      { href: "/promociones", l: "Ofertas" },
      { href: "/reels", l: "Reels" },
      { href: "/feed", l: "Muro" },
      { href: "/ranking", l: "Ranking" },
      { href: "/mapa", l: "Mapa" },
      { href: "/comunidad", l: "Chat de la ciudad" },
      { href: "/particulares", l: "Venta entre vecinos" },
    ],
  },
  {
    t: "Para tu negocio",
    links: [
      { href: "/para-negocios", l: "Publicar mi negocio" },
      { href: "/dashboard/nuevo?type=particular", l: "Sumarme como particular" },
      { href: "/planes", l: "Planes y precios" },
      { href: "/blog", l: "Blog" },
    ],
  },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [ciudades, setCiudades] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    supabase().from("locations").select("name, slug").eq("type", "city").eq("status", "active").order("name")
      .then(({ data }) => setCiudades(data || []));
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Abrir menú"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:hidden">
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[300] bg-[#0c0906]/98 backdrop-blur-xl md:hidden">
          <div className="flex h-full flex-col overflow-y-auto px-5 py-5">
            <div className="flex items-center justify-between">
              <span className="text-lg font-black tracking-tight">LA GRAN BARATA</span>
              <button onClick={() => setOpen(false)} aria-label="Cerrar menú"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {ciudades.length > 1 && (
              <div className="mt-6">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white/35">
                  <MapPin className="h-3 w-3" /> Cordón industrial
                </p>
                <div className="flex flex-wrap gap-2">
                  {ciudades.map((c) => (
                    <Link key={c.slug} href={`/${c.slug}`} onClick={() => setOpen(false)}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 hover:border-orange-400/40 hover:text-white">
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {SECCIONES.map((s) => (
              <div key={s.t} className="mt-7">
                <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-white/35">{s.t}</p>
                <div className="space-y-1">
                  {s.links.map((l) => (
                    <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-3 text-base font-bold text-white/85 transition hover:bg-white/5 hover:text-orange-300">
                      {l.l}
                      <ArrowRight className="h-4 w-4 text-white/20" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <Link href="/dashboard/nuevo" onClick={() => setOpen(false)}
              className="btn-shine mt-8 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 py-3.5 text-sm font-black text-white">
              Publicar mi negocio gratis
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
