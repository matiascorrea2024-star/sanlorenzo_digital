"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Calendar } from "lucide-react";
import { hoyArgentina } from "@/lib/fecha-ar";

type FechaClave = { fecha: string; nombre: string; tip: string };

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

function nthWeekdayISO(y: number, mes: number, weekday: number, n: number): string {
  const primero = new Date(Date.UTC(y, mes - 1, 1));
  const offset = (weekday - primero.getUTCDay() + 7) % 7;
  return iso(y, mes, 1 + offset + (n - 1) * 7);
}

function lastWeekdayISO(y: number, mes: number, weekday: number): string {
  const ultimo = new Date(Date.UTC(y, mes, 0));
  const offset = (ultimo.getUTCDay() - weekday + 7) % 7;
  return iso(y, mes, ultimo.getUTCDate() - offset);
}

function fechasDeAnio(y: number): FechaClave[] {
  return [
    { fecha: nthWeekdayISO(y, 5, 1, 1), nombre: "Hot Sale", tip: 'Semana previa: subí ofertas con descuento real y etiquetalas "Hot Sale".' },
    { fecha: nthWeekdayISO(y, 6, 0, 3), nombre: "Día del Padre", tip: "Semana previa: armá combos regalo y destacalos en tu ficha." },
    { fecha: iso(y, 7, 20), nombre: "Día del Amigo", tip: "Semana previa: promociones 2x1 o por grupo; el amigo trae amigo." },
    { fecha: nthWeekdayISO(y, 8, 0, 2), nombre: "Día del Niño", tip: "Semana previa: subí ofertas de juguetes/golosinas con -20% y etiquetalas 'pre-Día del Niño'." },
    { fecha: lastWeekdayISO(y, 11, 5), nombre: "Black Friday", tip: 'Semana previa: subí ofertas con -20% y etiquetalas "pre-Black".' },
    { fecha: iso(y, 12, 25), nombre: "Navidad", tip: "Primeras semanas de diciembre: lanzá promociones navideñas antes de que se sature todo." },
  ];
}

function proximas(cantidad: number): Array<FechaClave & { dias: number; fechaFmt: string }> {
  const hoy = hoyArgentina();
  const y = Number(hoy.slice(0, 4));
  const [hy, hm, hd] = hoy.split("-").map(Number);
  const hoyMs = Date.UTC(hy, hm - 1, hd);
  return [...fechasDeAnio(y), ...fechasDeAnio(y + 1)]
    .filter((f) => f.fecha >= hoy)
    .slice(0, cantidad)
    .map((f) => {
      const [yy, mm, dd] = f.fecha.split("-").map(Number);
      const dias = Math.round((Date.UTC(yy, mm - 1, dd) - hoyMs) / 86400000);
      const fechaFmt = new Date(Date.UTC(yy, mm - 1, dd)).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "short" });
      return { ...f, dias, fechaFmt };
    });
}

export default function CommercialCalendar() {
  const [eventos, setEventos] = useState<Array<FechaClave & { dias: number; fechaFmt: string }> | null>(null);

  useEffect(() => {
    setEventos(proximas(4));
  }, []);

  if (!eventos) return null;

  return (
    <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6">
      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>
        <Calendar className="h-3.5 w-3.5 shrink-0" /> Calendario comercial
      </p>
      <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">Fechas que venden</h2>
      <p className="mt-1 text-xs text-[var(--muted)]">Las próximas fechas clave de Argentina. El que llega antes, vende más.</p>

      <ul className="mt-4 space-y-2">
        {eventos.map((e) => (
          <li key={`${e.nombre}-${e.fecha}`} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--ov-02)] p-3">
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--accent)]/10 text-center">
              <span className="font-display text-xl leading-none text-[var(--accent-ink)]">{e.fechaFmt.split(" ")[0]}</span>
              <span className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">{e.fechaFmt.split(" ")[1]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-sm uppercase tracking-tight">{e.nombre}</h3>
                <span className="rounded-lg bg-[var(--ov-05)] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">
                  {e.dias === 0 ? "Es hoy" : e.dias === 1 ? "Mañana" : `En ${e.dias} días`}
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-snug text-[var(--muted)]">{e.tip}</p>
            </div>
            <Link href="/dashboard/ofertas/nueva" className="btn-hard ml-auto shrink-0 self-center rounded-xl bg-[var(--accent)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }} title="Crear oferta para esta fecha">
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
