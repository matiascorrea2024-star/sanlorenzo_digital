"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PageHero({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(true), []);

  return (
    <section className="relative">
      {/* overflow-hidden va en la capa de decoración, no en la section,
          para que cualquier dropdown/popover dentro de children pueda
          desbordar el alto del hero sin recortarse. */}
      {/* Misma identidad que la Home: naranja (energía) + cian de río
          (lugar), sin blobs difuminados ni grilla de puntos genérica. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 12% -10%, rgba(249,115,22,.10), transparent 26rem), radial-gradient(circle at 96% 30%, rgba(34,211,238,.06), transparent 22rem)",
        }}
      ></div>
      <div className="absolute top-10 right-10 w-16 h-16 border border-orange-500/20 rounded-full animate-float pointer-events-none"></div>
      <div className="absolute bottom-6 left-8 w-12 h-12 border border-cyan-400/20 rounded-lg rotate-45 animate-float-delayed pointer-events-none"></div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6 md:pb-10 md:pt-16">
        <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <Link href="/" className="text-sm text-orange-400 hover:text-orange-300">← Volver al inicio</Link>
          <h1 className="mt-3 text-4xl font-bold leading-[0.95] tracking-tight md:text-6xl" style={{ fontFamily: "var(--font-space)" }}>
            {typeof title === "string" ? (() => {
              const m = title.match(/^(\p{Extended_Pictographic}\uFE0F?)\s*(.*)$/u);
              return m ? (
                <>
                  <span className="mr-3">{m[1]}</span>
                  <span className="bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent">{m[2]}</span>
                </>
              ) : (
                <span className="bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent">{title}</span>
              );
            })() : title}
          </h1>
          {subtitle && <p className="mt-3 max-w-xl text-lg text-white/50">{subtitle}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}
