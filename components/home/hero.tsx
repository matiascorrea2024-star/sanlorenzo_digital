"use client";
import Link from "next/link";
import SmartSearch from "@/components/ui/smart-search";
import type { FullBusiness } from "@/lib/use-businesses";

interface HeroProps {
  onSearch?: (query: string) => void;
  seedNegocios?: FullBusiness[];
}

const SUGERENCIAS = ["zapatillas", "pizza", "peluquería", "ferretería"];

export default function Hero({ onSearch, seedNegocios }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[var(--bg)]">
      {/* Fondo: mesh muy sutil + noise (el noise ya es global vía
          body::after) -- sin elementos flotantes ni decoración suelta. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, rgba(249,115,22,.08), transparent 40rem), radial-gradient(circle at 85% 30%, rgba(236,72,153,.05), transparent 34rem)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-4 py-16 md:py-20">
        <div className="fade-up text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl" style={{ fontFamily: "var(--font-space)" }}>
            Todo{" "}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">San Lorenzo</span>
            , en un solo lugar.
          </h1>
          <p className="fade-up-2 mx-auto mt-4 max-w-xl text-base text-white/60 md:text-lg">
            Descubrí negocios, ofertas y servicios reales de tu ciudad.
          </p>

          <div className="fade-up-3 mx-auto mt-8 max-w-2xl">
            <SmartSearch
              placeholder="Buscar ofertas, negocios, productos..."
              onPlainSearch={(term) => onSearch && onSearch(term)}
              shortcutSlash
              seedNegocios={seedNegocios}
            />

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGERENCIAS.map((sug) => (
                <button
                  key={sug}
                  onClick={() => onSearch && onSearch(sug)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
                >
                  {sug}
                </button>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard/nuevo"
                className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                Publicar mi negocio gratis
              </Link>
              <Link
                href="/negocios"
                className="rounded-xl border border-white/15 px-6 py-3 text-sm font-bold text-white/80 transition hover:border-white/30 hover:text-white"
              >
                Explorar negocios
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
