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
    <section className="relative bg-[var(--bg)] text-[var(--text)]">
      {/* overflow-hidden va en la capa de decoración, no en la section,
          para que cualquier dropdown/popover dentro de children pueda
          desbordar el alto del hero sin recortarse. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Identidad LA GRAN BARATA: fondo negro con orbs magenta difusos. */}
        <div className="absolute left-[-10%] top-[-15%] h-[70%] w-[70%] rounded-full bg-[#d12f68] opacity-[0.08] blur-[180px]" aria-hidden="true" />
        <div className="absolute bottom-[-40%] right-[-5%] h-[55%] w-[55%] rounded-full bg-[#d12f68] opacity-[0.06] blur-[140px]" aria-hidden="true" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 md:pb-14 md:pt-20">
        <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] transition hover:text-[var(--accent-ink)]">← Volver al inicio</Link>
          <p className="mb-5 mt-6 text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>
            San Lorenzo Digital
          </p>
          <h1 className="font-display text-4xl leading-[0.95] tracking-tight md:text-6xl">
            {typeof title === "string" ? (() => {
              const m = title.match(/^(\p{Extended_Pictographic}\uFE0F?)\s*(.*)$/u);
              return m ? (
                <>
                  <span className="mr-3">{m[1]}</span>
                  <span className="bg-gradient-to-r from-[var(--text)] via-[var(--accent)] to-[var(--accent2)] bg-clip-text text-transparent">{m[2]}</span>
                </>
              ) : (
                <span className="bg-gradient-to-r from-[var(--text)] via-[var(--accent)] to-[var(--accent2)] bg-clip-text text-transparent">{title}</span>
              );
            })() : title}
          </h1>
          {subtitle && <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)] md:text-lg">{subtitle}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}
