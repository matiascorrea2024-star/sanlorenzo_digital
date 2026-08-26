"use client";
import { Check, X } from "lucide-react";
import { PLANES } from "@/lib/plans";

const FEATURES_TO_COMPARE = [
  { category: "Ofertas", key: "maxOfertas", label: "Ofertas simultáneas" },
  { category: "Ofertas", key: "ofertasNuevasPorDia", label: "Ofertas/día" },
  { category: "Catálogo", key: "maxProductos", label: "Productos" },
  { category: "Catálogo", key: "destacarCatalogo", label: "Destacar productos" },
  { category: "Analítica", key: "stats", label: "Estadísticas básicas" },
  { category: "Analítica", key: "statsAvanzadas", label: "Análisis avanzado" },
  { category: "Marketing", key: "historias", label: "Historias" },
  { category: "Marketing", key: "cupones", label: "Cupones exclusivos" },
  { category: "Marketing", key: "campanas", label: "Campañas segmentadas" },
  { category: "En Vivo", key: "maxVivosPorMes", label: "Transmisiones/mes" },
  { category: "En Vivo", key: "vivoProductos", label: "Vender en vivo" },
];

export default function PlanComparison() {
  const planKeys = ["gratis", "plus", "profesional", "premium"] as const;
  const plans = planKeys.map((key) => PLANES[key]);

  const getValue = (plan: typeof PLANES["gratis"], key: string) => {
    const value = (plan as Record<string, any>)[key];
    if (value === true) return <Check className="h-5 w-5 text-[var(--ok)]" />;
    if (value === false) return <X className="h-5 w-5 text-[var(--muted2)]" />;
    if (value === -1) return <span className="text-sm font-bold text-[var(--accent)]">Ilimitado</span>;
    return <span className="text-sm font-bold text-white">{value}</span>;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
      <h2 className="mb-4 text-center font-display text-3xl tracking-tight sm:text-5xl">
        Compará los planes
      </h2>
      <p className="mb-12 text-center text-[var(--muted)]">
        Elegí el que mejor se adapte a tu negocio
      </p>

      {/* Desktop Table */}
      <div className="hidden overflow-x-auto rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--ov-05)]">
              <th className="p-4 text-left text-[11px] font-black uppercase tracking-widest text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>Característica</th>
              {plans.map((plan) => (
                <th key={plan.name} className={`p-4 text-center font-display text-base tracking-tight ${plan.name === "Destacado Semanal" ? "text-[var(--accent)]" : "text-white"}`}>
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURES_TO_COMPARE.map((feature) => (
              <tr key={feature.key} className="border-b border-[var(--line)] transition-colors last:border-b-0 hover:bg-[var(--ov-03)]">
                <td className="p-4 text-sm font-semibold text-[#c4b5a5]">{feature.label}</td>
                {plans.map((plan) => (
                  <td key={plan.name} className={`p-4 text-center ${plan.name === "Destacado Semanal" ? "bg-[var(--accent)]/5" : ""}`}>
                    {getValue(plan, feature.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="grid gap-5 md:hidden">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-[2rem] border p-7 ${
              plan.name === "Destacado Semanal"
                ? "border-[var(--accent)]/60 bg-gradient-to-br from-[var(--accent)]/[.12] to-transparent"
                : "border-[var(--line)] bg-[var(--surface)]"
            }`}
          >
            <h3 className={`mb-4 font-display text-xl tracking-tight ${plan.name === "Destacado Semanal" ? "text-[var(--accent)]" : ""}`}>{plan.name}</h3>
            <div className="space-y-3 border-t border-[var(--line)] pt-5">
              {FEATURES_TO_COMPARE.map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-[var(--muted)]">{feature.label}</span>
                  <div>{getValue(plan, feature.key)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
