"use client";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Juan González",
    business: "Juan's Pizza",
    image: "🍕",
    rating: 5,
    text: "Con San Lorenzo Digital mis ventas crecieron 40%. Sin comisión, sin burocracia.",
  },
  {
    name: "María López",
    business: "La Boutique",
    image: "👗",
    rating: 5,
    text: "Finalmente puedo vender en línea sin complicaciones. Mis clientes me encuentran al instante.",
  },
  {
    name: "Carlos Martínez",
    business: "Ferretería Central",
    image: "🔧",
    rating: 5,
    text: "El plan Pro me permitió llegar a 3 barrios. Conversión directa en ventas.",
  },
  {
    name: "Ana Silva",
    business: "Peluquería",
    image: "💇‍♀️",
    rating: 5,
    text: "Mis turnos se llenan automáticamente. Es lo mejor que hice para mi negocio.",
  },
];

const STATS = [
  { number: "12,547", label: "Negocios activos" },
  { number: "2.3M", label: "Ofertas publicadas" },
  { number: "+87%", label: "Aumento en visitas" },
  { number: "24/7", label: "Soporte disponible" },
];

export default function SocialProof() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      {/* Stats Row */}
      <div className="mb-20 grid grid-cols-2 gap-6 sm:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[var(--line)] bg-[var(--surface2)] p-6 text-center"
          >
            <div className="text-2xl font-black text-orange-500 sm:text-3xl">
              {stat.number}
            </div>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div>
        <h2 className="mb-4 text-center text-3xl font-black sm:text-4xl">
          Qué dicen nuestros usuarios
        </h2>
        <p className="mb-12 text-center text-[var(--muted)]">
          Comercios reales con resultados reales
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.name}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface2)] p-6 transition hover:border-orange-500/50"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{testimonial.image}</span>
                  <div>
                    <p className="font-bold text-[var(--text)]">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {testimonial.business}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-orange-500 text-orange-500"
                  />
                ))}
              </div>

              <p className="text-sm leading-relaxed text-[var(--muted)]">
                &ldquo;{testimonial.text}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-20 rounded-2xl border border-[var(--line)] bg-[var(--surface2)] p-8 text-center">
        <h3 className="mb-6 text-xl font-bold">Confianza verificada</h3>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-black text-orange-500">✓</p>
            <p className="text-xs text-[var(--muted)]">Verificado</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-orange-500">🔒</p>
            <p className="text-xs text-[var(--muted)]">Seguro</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-orange-500">⚡</p>
            <p className="text-xs text-[var(--muted)]">Rápido</p>
          </div>
        </div>
      </div>
    </section>
  );
}
