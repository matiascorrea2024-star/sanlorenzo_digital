import type { Business } from "@/lib/data";
import Share from "./share";
const MOD_TITLE: Record<string, string> = {
  comercio: "Productos", ferreteria: "Productos", restaurante: "Menú",
  peluqueria: "Servicios", profesional: "Servicios", automotor: "Servicios",
};
export default function Miniweb({ b }: { b: Business }) {
  const nuevo = b.reviews === 0;
  return (
    <main className="mx-auto max-w-4xl px-4 pb-16">
      <div className="h-36 rounded-b-3xl opacity-30" style={{ background: `linear-gradient(135deg, ${b.accent}, transparent 70%)` }} />
      <div className="-mt-10 px-2">
        <div className="flex items-end gap-4">
          <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-[var(--bg)] text-2xl font-bold text-black" style={{ background: b.accent }}>
            {b.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </span>
          <div className="pb-1">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>{b.name}</h1>
            <p className="text-sm capitalize text-[var(--muted)]">
              {b.category} · {nuevo ? "✨ Nuevo en la plataforma" : `⭐ ${Number(b.rating || 0).toFixed(1)} (${b.reviews})`}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {b.demo ? (
            <span className="rounded-full border border-[var(--warn)] px-2 py-0.5 font-semibold uppercase tracking-wider text-[var(--warn)]">DEMO</span>
          ) : b.status === "verificado" ? (
            <span className="rounded-full border border-[var(--ok)] px-2 py-0.5 font-semibold uppercase tracking-wider text-[var(--ok)]">✓ Verificado</span>
          ) : (
            <span className="rounded-full border border-[var(--line)] px-2 py-0.5 font-semibold uppercase tracking-wider text-[var(--muted)]">No reclamado</span>
          )}
          <span className={b.open ? "text-[var(--ok)]" : "text-[var(--bad)]"}>{b.open ? "🟢 Abierto" : "🔴 Cerrado"}</span>
          <span className="text-[var(--muted)]">· Actualizado {b.updatedAt}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {b.whatsapp && (
            <a href={`https://wa.me/${b.whatsapp}?text=${encodeURIComponent(`Hola, vi ${b.name} en San Lorenzo Digital.`)}`} target="_blank"
              className="rounded-lg bg-[var(--ok)] px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90">WhatsApp</a>
          )}
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`} target="_blank"
            className="rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm hover:border-[var(--accent)]">Cómo llegar</a>
          <Share title={b.name} />
          {b.instagram && (
            <a href={`https://instagram.com/${b.instagram}`} target="_blank"
              className="rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm hover:border-[var(--accent)]">Instagram</a>
          )}
        </div>
        <p className="mt-6 text-sm leading-relaxed text-[var(--muted)]">{b.description}</p>
        <p className="mt-2 text-sm">📍 {b.address}{b.schedule ? ` · 🕒 ${b.schedule}` : ""}</p>
        {b.items.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-bold" style={{ fontFamily: "var(--font-space)" }}>{MOD_TITLE[b.type] ?? "Productos"}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {b.items.map((i) => (
                <div key={i.name} className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
                  <div>
                    <p className="text-sm font-medium">{i.name}</p>
                    {i.note && <p className="text-xs text-[var(--muted)]">{i.note}</p>}
                  </div>
                  <span className="text-sm font-semibold text-[var(--accent2)]">{i.price ?? "Consultar"}</span>
                </div>
              ))}
            </div>
          </section>
        )}
        {b.professionals && (
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-bold" style={{ fontFamily: "var(--font-space)" }}>Profesionales</h2>
            <div className="flex flex-wrap gap-2">
              {b.professionals.map((p) => <span key={p} className="rounded-full bg-[var(--surface2)] px-3 py-1.5 text-sm">💈 {p}</span>)}
            </div>
          </section>
        )}
        <div className="mt-8 flex flex-wrap gap-1">
          {b.tags.map((t) => <span key={t} className="rounded-full bg-[var(--surface2)] px-2 py-1 text-[11px] text-[var(--muted)]">#{t}</span>)}
        </div>
        {b.demo && (
          <p className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-center text-xs text-[var(--muted)]">
            Negocio DEMO de demostración. Los datos reales se cargan al registrar el comercio.
          </p>
        )}
      </div>
    </main>
  );
}
