"use client";
import Link from "next/link";
import { CheckCircle2, Circle, TrendingUp } from "lucide-react";

type Props = { business: any; ofertasActivas: number; respuestaMedia?: number | null };

type Item = {
  key: string;
  label: string;
  ok: boolean;
  tip: string;
  cta: string;
  href: string;
};

export default function GrowthCenter({ business, ofertasActivas, respuestaMedia }: Props) {
  const editar = `/dashboard/editar/${business.slug}`;
  const nuevaOferta = "/dashboard/ofertas/nueva";

  const items: Item[] = [
    {
      key: "portada", label: "Portada", ok: !!business.portada_url,
      tip: "Sin portada tu ficha se ve vacía al lado de la competencia.",
      cta: "Subir portada", href: editar,
    },
    {
      key: "logo", label: "Logo", ok: !!business.logo_url,
      tip: "Sin logo no te reconocen en el mapa ni en el ranking.",
      cta: "Subir logo", href: editar,
    },
    {
      key: "descripcion", label: "Descripción", ok: !!(business.description && business.description.trim().length >= 30),
      tip: "Una línea de 5 palabras no alcanza: contá qué vendés y por qué elegirte.",
      cta: "Completar descripción", href: editar,
    },
    {
      key: "horario", label: "Horario", ok: !!(business.schedule && business.schedule.trim()),
      tip: "Sin horario cargado: el vecino no sabe si está abierto.",
      cta: "Cargar horario", href: editar,
    },
    {
      key: "whatsapp", label: "WhatsApp", ok: !!(business.whatsapp && String(business.whatsapp).trim()),
      tip: "Sin WhatsApp perdés el cliente que quiso preguntar y se fue.",
      cta: "Agregar WhatsApp", href: editar,
    },
    {
      key: "direccion", label: "Dirección", ok: !!(business.address && String(business.address).trim()),
      tip: "Sin dirección nadie puede encontrarte: solo aparecés con nombre suelto.",
      cta: "Cargar dirección", href: editar,
    },
    {
      key: "ofertas", label: "Ofertas activas", ok: ofertasActivas > 0,
      tip: `Tenés ${ofertasActivas === 1 ? "una oferta" : `${ofertasActivas} ofertas`} activa${ofertasActivas === 1 ? "" : "s"}. Publicá una y aparecé en la home.`,
      cta: "Crear oferta", href: nuevaOferta,
    },
    {
      key: "respuesta", label: "Respuesta media", ok: respuestaMedia != null,
      tip: "Todavía no tenés respuestas medibles a reseñas. Respondé una y sumá confianza.",
      cta: "Ver reseñas", href: "/dashboard/resenas",
    },
  ];

  const okCount = items.filter((i) => i.ok).length;
  const pct = Math.round((okCount / items.length) * 100);
  const pctColor = pct < 50 ? "text-[var(--bad)]" : pct < 80 ? "text-[var(--warn)]" : "text-[var(--ok)]";
  const barColor = pct < 50 ? "bg-[var(--bad)]" : pct < 80 ? "bg-[var(--warn)]" : "bg-[var(--ok)]";
  const pendientes = items.filter((i) => !i.ok);

  return (
    <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6">
      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>
        <TrendingUp className="h-3.5 w-3.5 shrink-0" /> Centro de crecimiento
      </p>
      <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">
        Tu perfil está al <span className={pctColor}>{pct}%</span>
      </h2>
      <p className="mt-1 text-xs text-[var(--muted)]">Checklist real de {business.name}: cada punto que falta es plata que no entra.</p>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--ov-05)]">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>

      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {items.map((i) => (
          <li key={i.key} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${i.ok ? "bg-[var(--ov-03)] text-[var(--text)]" : "bg-[var(--ov-03)] text-[var(--muted)]"}`}>
            {i.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--ok)]" /> : <Circle className="h-4 w-4 shrink-0 text-[var(--muted2)]" />}
            <span className="truncate">{i.label}</span>
            {!i.ok && (
              <Link href={i.href} className="ml-auto shrink-0 text-[9px] font-black uppercase tracking-widest text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-2">
                Arreglar
              </Link>
            )}
          </li>
        ))}
      </ul>

      {pendientes.length > 0 ? (
        <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--muted2)]" style={{ fontFamily: "var(--font-display)" }}>Lo que falta, sin vueltas</p>
          {pendientes.map((i) => (
            <div key={i.key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--ov-02)] px-3 py-2.5">
              <p className="min-w-0 flex-1 text-xs text-[var(--muted)]">{i.tip}</p>
              <Link href={i.href} className="btn-hard shrink-0 rounded-xl bg-[var(--accent)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
                {i.cta} →
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-[var(--ok)]/30 bg-[var(--ok)]/10 px-3 py-2.5 text-xs font-bold text-[var(--ok)]">Perfil completo. Ahora a empujar ofertas y reseñas.</p>
      )}
    </section>
  );
}
