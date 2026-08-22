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
    if (value === true) return <Check className="h-5 w-5 text-orange-500" />;
    if (value === false) return <X className="h-5 w-5 text-[var(--muted2)]" />;
    if (value === -1) return <span className="text-sm font-bold text-orange-500">Ilimitado</span>;
    return <span className="text-sm font-bold">{value}</span>;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
      <h2 className="mb-4 text-center text-3xl font-black sm:text-4xl">
        Compará los planes
      </h2>
      <p className="mb-12 text-center text-[var(--muted)]">
        Elegí el que mejor se adapte a tu negocio
      </p>

      {/* Desktop Table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-[var(--line)] md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--surface2)]">
              <th className="p-4 text-left font-bold">Característica</th>
              {plans.map((plan) => (
                <th key={plan.name} className="p-4 text-center font-bold">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURES_TO_COMPARE.map((feature) => (
              <tr key={feature.key} className="border-b border-[var(--ov-05)] hover:bg-[var(--ov-02)]">
                <td className="p-4 text-sm font-semibold">{feature.label}</td>
                {plans.map((plan) => (
                  <td key={plan.name} className="p-4 text-center">
                    {getValue(plan, feature.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="grid gap-6 md:hidden">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl border p-6 ${
              plan.name === "Destacado Semanal"
                ? "border-orange-500/50 bg-gradient-to-br from-orange-600/10 to-red-600/10"
                : "border-[var(--line)] bg-[var(--surface2)]"
            }`}
          >
            <h3 className="mb-4 font-bold text-orange-500">{plan.name}</h3>
            <div className="space-y-3">
              {FEATURES_TO_COMPARE.map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between text-sm"
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
