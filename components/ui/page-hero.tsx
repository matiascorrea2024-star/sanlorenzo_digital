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
      <div className="absolute inset-0 overflow-hidden opacity-25 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-red-600 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-orange-600 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-pink-600 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      <div
        className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      ></div>
      <div className="absolute top-10 right-10 w-16 h-16 border border-orange-500/20 rounded-full animate-float pointer-events-none"></div>
      <div className="absolute bottom-6 left-8 w-12 h-12 border border-pink-500/20 rounded-lg rotate-45 animate-float-delayed pointer-events-none"></div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <Link href="/" className="text-sm text-orange-400 hover:text-orange-300">← Volver al inicio</Link>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
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
          {subtitle && <p className="mt-2 text-white/60 md:text-lg">{subtitle}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}
