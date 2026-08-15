"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Sparkles, BadgeCheck, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import SmartSearch from "@/components/ui/smart-search";
import Skyline from "@/components/home/skyline";
import type { FullBusiness } from "@/lib/use-businesses";

if (typeof window !== "undefined") gsap.registerPlugin(useGSAP);

interface HeroProps {
  onSearch?: (query: string) => void;
  stats?: { promos: number; negocios: number; pronto: number };
  seedNegocios?: FullBusiness[];
}

const plural = (n: number, sing: string, plur: string) => (n === 1 ? sing : plur);

const TRUST: { icon: LucideIcon; label: string }[] = [
  { icon: BadgeCheck, label: "Comercios verificados" },
  { icon: Flame, label: "Ofertas reales, no humo" },
  { icon: MapPin, label: "100% San Lorenzo" },
  { icon: Sparkles, label: "Gratis para vecinos" },
];

const LINE1 = ["LA", "GRAN"];
const LINE2 = ["Barata", "Digital"];

export default function Hero({ onSearch, stats, seedNegocios }: HeroProps) {
  const targets = stats || { promos: 0, negocios: 0, pronto: 0 };
  const [display, setDisplay] = useState({ promos: 0, negocios: 0, pronto: 0 });
  const [settled, setSettled] = useState({ promos: false, negocios: false, pronto: false });

  const rootRef = useRef<HTMLElement>(null);
  const auroraRef = useRef<HTMLDivElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchBtnRef = useRef<HTMLButtonElement | null>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Entrada del wordmark: siempre corre, pero la versión con
      // prefers-reduced-motion salta directo al estado final (sin
      // desplazamiento/blur) en vez de no animar nada -- así el
      // contenido no aparece "roto" antes de tiempo en ningún caso.
      mm.add(
        {
          full: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const words = wordRefs.current.filter(Boolean) as HTMLSpanElement[];
          if (ctx.conditions?.reduced) {
            gsap.set(words, { opacity: 1, y: 0, filter: "blur(0px)" });
          } else {
            gsap.fromTo(
              words,
              { opacity: 0, y: 34, filter: "blur(10px)" },
              {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 1,
                ease: "power4.out",
                stagger: 0.09,
                delay: 0.1,
              }
            );
          }
        }
      );

      // Odómetro: tween de un objeto plano con easing premium (no el
      // setInterval + cúbica hecha a mano de antes) -- un pequeño
      // "settle" (glow breve) cuando cada contador llega a destino.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        (Object.keys(targets) as Array<keyof typeof targets>).forEach((key, i) => {
          const obj = { v: 0 };
          gsap.to(obj, {
            v: targets[key],
            duration: 1.6,
            delay: 0.3 + i * 0.12,
            ease: "power3.out",
            snap: { v: 1 },
            onUpdate: () => setDisplay((d) => ({ ...d, [key]: Math.round(obj.v) })),
            onComplete: () => setSettled((s) => ({ ...s, [key]: true })),
          });
        });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        setDisplay(targets);
        setSettled({ promos: true, negocios: true, pronto: true });
      });

      // Aurora con paridad al cursor -- solo desktop con mouse real,
      // solo transform (GPU), nunca top/left/blur recalculado por frame.
      mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const el = rootRef.current;
        const layers = auroraRef.current ? Array.from(auroraRef.current.children) as HTMLElement[] : [];
        if (!el || layers.length === 0) return;
        const moversY = layers.map((layer) => gsap.quickTo(layer, "y", { duration: 0.9, ease: "power3.out" }));
        const moversX = layers.map((layer) => gsap.quickTo(layer, "x", { duration: 0.9, ease: "power3.out" }));
        const onMove = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          layers.forEach((_, i) => {
            const depth = (i + 1) * 14;
            moversX[i](nx * depth);
            moversY[i](ny * depth);
          });
        };
        el.addEventListener("mousemove", onMove);
        return () => el.removeEventListener("mousemove", onMove);
      });

      // Botón magnético: solo desktop con mouse real.
      mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const btn = searchBtnRef.current;
        if (!btn) return;
        const moveX = gsap.quickTo(btn, "x", { duration: 0.35, ease: "power3.out" });
        const moveY = gsap.quickTo(btn, "y", { duration: 0.35, ease: "power3.out" });
        const onMove = (e: MouseEvent) => {
          const r = btn.getBoundingClientRect();
          moveX((e.clientX - r.left - r.width / 2) * 0.35);
          moveY((e.clientY - r.top - r.height / 2) * 0.35);
        };
        const onLeave = () => {
          moveX(0);
          moveY(0);
        };
        btn.addEventListener("mousemove", onMove);
        btn.addEventListener("mouseleave", onLeave);
        return () => {
          btn.removeEventListener("mousemove", onMove);
          btn.removeEventListener("mouseleave", onLeave);
        };
      });

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [targets.promos, targets.negocios, targets.pronto] }
  );

  const sugerencias = ["zapatillas", "pizza", "peluquería", "ferretería", "ofertas"];

  const addWordRef = (i: number) => (el: HTMLSpanElement | null) => {
    wordRefs.current[i] = el;
  };

  return (
    <section ref={rootRef} className="relative overflow-hidden bg-gradient-to-b from-[#120d09] via-[#1c150e] to-[#120d09]">
      {/* Aurora: mesh de marca (naranja/rosa) en 3 capas de profundidad,
          movidas por transform vía gsap.quickTo -- nunca blur/tamaño
          recalculado por frame. Reemplaza los blobs planos de antes. */}
      <div ref={auroraRef} className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
        <div className="aurora-layer">
          <div className="absolute left-[8%] top-[-10%] h-[26rem] w-[26rem] rounded-full bg-orange-500/25 blur-[90px]" />
        </div>
        <div className="aurora-layer">
          <div className="absolute right-[5%] top-[15%] h-[24rem] w-[24rem] rounded-full bg-pink-500/20 blur-[100px]" />
        </div>
        <div className="aurora-layer">
          <div className="absolute bottom-[-15%] left-[35%] h-[22rem] w-[22rem] rounded-full bg-orange-400/15 blur-[110px]" />
        </div>
      </div>

      {/* Perfil real de San Lorenzo -- esquema de línea con glow, no
          silueta plana; capas de profundidad, no decoración plana. */}
      <Skyline
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full text-[#3a2c1a] opacity-60 [mask-image:linear-gradient(to_top,black_50%,transparent_100%)] md:h-56"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 md:py-20">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-400" />
            </span>
            <span className="text-xs font-medium text-orange-300">San Lorenzo · Santa Fe, en vivo</span>
          </div>

          <h1 className="mb-5 leading-[0.92]">
            <span className="block overflow-hidden text-3xl font-bold tracking-tight text-white md:text-5xl" style={{ fontFamily: "var(--font-space)" }}>
              {LINE1.map((w, i) => (
                <span key={w} ref={addWordRef(i)} className="mr-3 inline-block will-change-transform">
                  {w}
                </span>
              ))}
            </span>
            <span className="relative mt-2 block overflow-visible text-6xl uppercase tracking-tight md:text-8xl lg:text-9xl" style={{ fontFamily: "var(--font-ticket)" }}>
              {LINE2.map((w, i) => (
                <span
                  key={w}
                  ref={addWordRef(LINE1.length + i)}
                  className="text-frame-strong mr-4 inline-block bg-gradient-to-br from-orange-300 via-orange-400 to-pink-500 bg-clip-text font-black text-transparent will-change-transform"
                  style={{ filter: "drop-shadow(0 8px 40px rgba(249,115,22,.35))" }}
                >
                  {w}
                </span>
              ))}
              <span className="absolute -right-1 -top-3 rotate-12 rounded-full border border-red-400/50 bg-red-500/90 px-2.5 py-1 text-[11px] font-black tracking-normal text-white shadow-lg md:-right-2 md:-top-4 md:px-3 md:py-1.5 md:text-sm">
                100% real
              </span>
            </span>
          </h1>

          <p className="fade-up-2 mx-auto mb-7 max-w-2xl text-base text-white/60 md:text-lg">
            Las ofertas y promos de San Lorenzo, publicadas por los comercios en tiempo real.{" "}
            <span className="font-bold text-orange-300">Que no se te escape ninguna.</span>
          </p>

          <div className="fade-up-3 mx-auto max-w-2xl">
            <div ref={searchWrapRef} className="glass-2 hero-search rounded-2xl transition-shadow duration-300">
              <div className="glass-2-inner rounded-2xl">
                <SmartSearch
                  placeholder="Buscar ofertas, negocios, productos..."
                  onPlainSearch={(term) => onSearch && onSearch(term)}
                  shortcutSlash
                  seedNegocios={seedNegocios}
                  searchBtnRef={searchBtnRef}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {sugerencias.map((sug) => (
                <button
                  key={sug}
                  onClick={() => onSearch && onSearch(sug)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 transition-all duration-300 hover:scale-105 hover:border-white/30 hover:bg-white/10 active:scale-95"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {targets.promos === 0 && targets.negocios === 0 ? (
            // Estado vacío real (plataforma recién lanzada, sin datos
            // todavía) -- en vez de mostrar "0 / 0 / 0" a secas, lo
            // convertimos en la invitación a ser de los primeros. Sigue
            // siendo 100% honesto: no se inventa ningún número.
            <div className="mt-8 flex flex-col items-center gap-3">
              <p className="text-sm text-white/50">
                🌱 San Lorenzo Digital recién arranca -- sé uno de los primeros negocios.
              </p>
              <Link
                href="/dashboard/nuevo"
                className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2 text-sm font-black transition hover:opacity-90 active:scale-95"
              >
                Publicar mi negocio gratis
              </Link>
            </div>
          ) : (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {(
              [
                ["promos", display.promos, "text-orange-400", plural(display.promos, "promoción activa", "promociones activas")],
                ["negocios", display.negocios, "text-white", plural(display.negocios, "negocio", "negocios")],
                ["pronto", display.pronto, "text-pink-400", plural(display.pronto, "termina hoy", "terminan pronto")],
              ] as const
            ).map(([key, val, color, label], i) => (
              <div key={key} className="flex items-center gap-2">
                {i > 0 && <div className="mr-4 h-6 w-px bg-white/10" />}
                <span
                  className={`tabular-nums transition-[filter] duration-500 md:text-4xl text-3xl ${color} ${settled[key] ? "drop-shadow-[0_0_18px_rgba(249,115,22,.45)]" : ""}`}
                  style={{ fontFamily: "var(--font-ticket)", fontWeight: 700 }}
                >
                  {val}
                </span>
                <span className="text-left text-[11px] leading-tight text-white/60">{label}</span>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      {/* Franja tipo talonario de ticket -- borde punteado simulando el
          desgarro, no otro panel de vidrio esmerilado. */}
      <div className="relative z-10 border-t border-dashed border-white/15 bg-black/25">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-3 md:grid-cols-4">
          {TRUST.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center justify-center gap-2 text-[11px] font-semibold text-white/45">
              <Icon className="h-3.5 w-3.5 text-orange-400/70" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
