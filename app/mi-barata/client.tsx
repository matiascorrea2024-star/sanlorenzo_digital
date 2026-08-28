"use client";
// Mi Barata: el vecino combina ofertas de VARIOS negocios y ve cuánto
// ahorra en total. Agrupado por negocio con WhatsApp directo, y el mismo
// set alimenta /recorrido?fuente=barata para levantar todo en un viaje.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingBasket as Basket, MessageCircle, Route, Trash2, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { getMiBarata, sacarDeMiBarata, type ItemBarata } from "@/lib/mi-barata";
import { hoyArgentina } from "@/lib/fecha-ar";

const fmt = (n: number) => "$" + n.toLocaleString("es-AR");

export default function MiBarataClient() {
  const { user, loading: authLoading } = useAuth();
  const { show } = useToast();
  const [items, setItems] = useState<ItemBarata[] | null>(null);
  const [hoy] = useState(() => hoyArgentina());

  const cargar = useCallback(async () => {
    if (!user) return;
    setItems(await getMiBarata(user.id));
  }, [user]);

  useEffect(() => { cargar(); }, [cargar]);

  const grupos = useMemo(() => {
    if (!items) return [];
    const map = new Map<string, { negocio: string; slug: string; whatsapp: string | null; items: ItemBarata[] }>();
    for (const it of items) {
      const g = map.get(it.slug) || { negocio: it.negocio, slug: it.slug, whatsapp: it.whatsapp, items: [] };
      g.items.push(it);
      map.set(it.slug, g);
    }
    return Array.from(map.values());
  }, [items]);

  const totales = useMemo(() => {
    const vigentes = (items || []).filter((i) => i.active && (!i.valid_until || i.valid_until >= hoy));
    const ahora = vigentes.reduce((a, i) => a + (i.offer_price || 0), 0);
    const antes = vigentes.reduce((a, i) => a + (i.old_price || i.offer_price || 0), 0);
    return { vigentes: vigentes.length, vencidas: (items || []).length - vigentes.length, ahora, antes, ahorro: Math.max(0, antes - ahora) };
  }, [items, hoy]);

  const whatsappDeGrupo = (g: { negocio: string; items: ItemBarata[] }) => {
    const lista = g.items.map((i) => `• ${i.title}${i.offer_price ? ` (${fmt(i.offer_price)})` : ""}`).join("\n");
    return `Hola, vengo por Mi Barata de La Gran Barata Digital. Quisiera consultar por:\n${lista}`;
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-ink)]" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
        <section className="relative overflow-hidden border-b border-[var(--line)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(209,47,104,.16),transparent_55%)]" />
          <div className="relative mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
            <Basket className="mx-auto h-14 w-14 text-[var(--accent-ink)] drop-shadow-[0_0_14px_rgba(209,47,104,.5)]" />
            <h1 className="mt-4 font-display text-4xl uppercase tracking-tight sm:text-5xl">Mi barata</h1>
            <p className="mt-3 text-base text-[var(--muted)]">Guardá ofertas de varios negocios y mirá cuánto ahorrás en una sola vuelta.</p>
            <Link href="/login" className="btn-hard mt-6 inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
              Ingresá para armar tu barata
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(209,47,104,.16),transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-8 pt-16 sm:px-6">
          <Basket className="h-10 w-10 text-[var(--accent-ink)] drop-shadow-[0_0_14px_rgba(209,47,104,.5)]" />
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>
            Tu vuelta de la semana
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase tracking-tight sm:text-6xl">
            Mi <span className="magenta-glow bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] bg-clip-text text-transparent">barata</span>
          </h1>

          {items !== null && items.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>
                {totales.vigentes} oferta{totales.vigentes !== 1 ? "s" : ""} vigente{totales.vigentes !== 1 ? "s" : ""} · {grupos.length} negocio{grupos.length !== 1 ? "s" : ""}
              </span>
              {totales.ahorro > 0 && (
                <span className="rounded-full border border-[var(--ok)]/40 bg-[var(--ok)]/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[var(--ok)]" style={{ fontFamily: "var(--font-display)" }}>
                  Ahorrás {fmt(totales.ahorro)}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {items === null ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent-ink)]" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-12 text-center">
            <Basket className="mx-auto h-16 w-16 text-[var(--muted2)]" />
            <h2 className="mt-4 font-display text-2xl uppercase tracking-tight sm:text-3xl">Tu barata está vacía</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
              Cuando veas una oferta que te sirva, tocá <strong className="text-white">“Sumar a Mi Barata”</strong> y armá tu vuelta con todo lo que necesitás.
            </p>
            <Link href="/promociones" className="btn-hard mt-6 inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
              Ver ofertas de hoy
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Totales */}
            <div className="rounded-[2rem] border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>Si comprás todo lo vigente</p>
                  <p className="mt-2 font-display text-4xl leading-none">{fmt(totales.ahora)}</p>
                  {totales.ahorro > 0 && (
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Precio regular {fmt(totales.antes)} · <strong className="text-[var(--ok)]">ahorrás {fmt(totales.ahorro)}</strong>
                    </p>
                  )}
                </div>
                <Link
                  href="/recorrido?fuente=barata"
                  className="btn-hard inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <Route className="h-4 w-4" /> Armar recorrido <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Agrupado por negocio */}
            {grupos.map((g) => (
              <section key={g.slug} className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl uppercase tracking-wide">{g.negocio}</h2>
                    <Link href={`/negocio/${g.slug}`} className="text-[11px] font-black uppercase tracking-widest text-[var(--accent-ink)] hover:underline" style={{ fontFamily: "var(--font-display)" }}>
                      Ver negocio →
                    </Link>
                  </div>
                  {g.whatsapp && (
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`https://wa.me/${String(g.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(whatsappDeGrupo(g))}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-green-500/40 bg-green-500/15 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-400 transition hover:bg-green-500/25"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Consultar todo
                    </a>
                  )}
                </div>
                <ul className="mt-4 space-y-2">
                  {g.items.map((i) => {
                    const vencida = !i.active || (i.valid_until && i.valid_until < hoy);
                    return (
                      <li key={i.item_id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${vencida ? "border-[var(--line)] bg-[var(--ov-02)] opacity-60" : "border-[var(--line)] bg-[var(--ov-03)]"}`}>
                        <Link href={`/oferta/${i.offer_id}`} className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{i.title}</p>
                          <p className="mt-0.5 text-xs text-[var(--muted)]">
                            {i.offer_price ? fmt(i.offer_price) : "A consultar"}
                            {i.old_price && i.offer_price && i.old_price > i.offer_price && (
                              <span className="ml-2 line-through">{fmt(i.old_price)}</span>
                            )}
                            {vencida && <span className="ml-2 font-black uppercase text-[var(--bad)]">· ya venció</span>}
                          </p>
                        </Link>
                        <button
                          onClick={async () => {
                            if (await sacarDeMiBarata(i.item_id)) {
                              setItems((prev) => (prev || []).filter((x) => x.item_id !== i.item_id));
                            } else {
                              show("❌ No se pudo quitar la oferta. Probá de nuevo.", "error");
                            }
                          }}
                          aria-label={`Quitar ${i.title} de Mi Barata`}
                          className="shrink-0 rounded-lg border border-[var(--bad)]/30 p-2 text-[var(--bad)] transition hover:bg-[var(--bad)]/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
