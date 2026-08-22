"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Zap, Crown, Sparkles, ArrowRight } from "lucide-react";
import { PLANES } from "@/lib/plans";
import { useAuth } from "@/components/providers/auth-provider";

export default function PlanesClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("pago");

  const plans = [
    { key: "gratis", icon: Sparkles, color: "blue" },
    { key: "plus", icon: Zap, color: "amber" },
    { key: "profesional", icon: Crown, color: "orange" },
    { key: "premium", icon: Sparkles, color: "red" },
  ];

  const getPlanIcon = (color: string) => {
    const colors: Record<string, string> = {
      blue: "text-blue-500",
      amber: "text-amber-500",
      orange: "text-orange-500",
      red: "text-red-600",
    };
    return colors[color] || "text-orange-500";
  };

  const handleSelectPlan = (planKey: string) => {
    if (!user) {
      router.push("/registro?role=business_owner&redirect=/dashboard/planes");
      return;
    }
    if (planKey === "gratis") return; // Can't upgrade to free
    router.push(`/dashboard/planes?plan=${encodeURIComponent(planKey)}`);
  };

  return (
    <main className="plans-editorial min-h-screen text-[var(--text)]">
      {/* Header */}
      <div className="relative mx-auto max-w-6xl px-4 py-12 text-center sm:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-64 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,.16),transparent_70%)]" />
        <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.25em] text-orange-300">
          <Sparkles className="h-3.5 w-3.5" /> Crecé con tu comunidad
        </span>
        <h1 className="mx-auto mb-4 mt-5 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
          Más visibilidad. Más clientes locales.
        </h1>
        <p className="mx-auto mb-2 max-w-xl text-lg text-[var(--muted)]">
          Elegí el plan que acompañe el momento de tu negocio.
        </p>
        <p className="text-sm text-[var(--muted2)]">
          Todos incluyen acceso a San Lorenzo Digital sin comisión de ventas
        </p>
      </div>

      {/* Payment Status Messages */}
      {paymentStatus === "exito" && (
        <div className="mx-auto mb-8 max-w-2xl rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm">
          ✅ ¡Pago exitoso! Tu plan se activó correctamente.
        </div>
      )}
      {paymentStatus === "error" && (
        <div className="mx-auto mb-8 max-w-2xl rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-sm">
          ❌ Hubo un problema con el pago. Intentá de nuevo.
        </div>
      )}

      {/* Plans Grid */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-4">
          {plans.map(({ key, icon: Icon, color }) => {
            const plan = PLANES[key as keyof typeof PLANES];
            if (!plan) return null;

            return (
              <div
                key={key}
                className={`relative flex h-full flex-col rounded-[1.5rem] border p-1.5 transition-all duration-300 hover:-translate-y-1 ${
                  key === "premium"
                    ? "border-orange-500/50 bg-gradient-to-br from-orange-600/10 to-red-600/10 shadow-xl shadow-orange-950/20 ring-1 ring-orange-500/20"
                    : "border-[var(--line)] bg-[var(--ov-03)]"
                }`}
              >
                {key === "premium" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-1 text-xs font-bold text-white">
                    MÁS POPULAR
                  </div>
                )}

                <div className="flex h-full flex-col rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--surface2)] p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="mb-1 text-[10px] font-black uppercase tracking-[.2em] text-[var(--muted2)]">{key === "gratis" ? "Para empezar" : key === "premium" ? "Máxima exposición" : "Para crecer"}</p>
                      <h3 className="text-xl font-black tracking-tight">{plan.name}</h3>
                    </div>
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--ov-05)]">
                      <Icon className={`h-5 w-5 ${getPlanIcon(color)}`} />
                    </span>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-black tracking-tight text-orange-500" style={{ fontFamily: "var(--font-ticket)" }}>
                      ${plan.precioARS ? plan.precioARS.toLocaleString("es-AR") : "Gratis"}
                    </span>
                    {plan.precioARS > 0 && (
                      <span className="text-sm text-[var(--muted)]">/mes</span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="mb-6 flex-1 space-y-3 text-sm">
                    {plan.maxOfertas !== -1 && (
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-orange-500" />
                        <span>{plan.maxOfertas} ofertas activas</span>
                      </li>
                    )}
                    {plan.maxOfertas === -1 && (
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-orange-500" />
                        <span>Ofertas ilimitadas</span>
                      </li>
                    )}
                    {plan.stats && (
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-orange-500" />
                        <span>Estadísticas</span>
                      </li>
                    )}
                    {plan.historias && (
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-orange-500" />
                        <span>Historias</span>
                      </li>
                    )}
                    {plan.cupones && (
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-orange-500" />
                        <span>Cupones exclusivos</span>
                      </li>
                    )}
                    {plan.campanas && (
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-orange-500" />
                        <span>Campañas segmentadas</span>
                      </li>
                    )}
                    {plan.vivoProductos && (
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-orange-500" />
                        <span>En Vivo con productos</span>
                      </li>
                    )}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(key)}
                    disabled={key === "gratis"}
                    className={`group inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-black transition ${
                      key === "premium"
                        ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-950/20 hover:brightness-110 disabled:opacity-50"
                        : "border border-[var(--line-strong)] text-[var(--text)] hover:border-orange-500 hover:bg-[var(--ov-05)] disabled:opacity-50"
                    }`}
                  >
                    {key === "gratis"
                      ? "Ya estás usando"
                      : <>Elegir plan <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 h-px max-w-16 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
            <h2 className="text-2xl font-black">Preguntas frecuentes</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="sld-card rounded-2xl p-6">
              <h3 className="mb-3 font-bold text-orange-500">¿Puedo cambiar de plan?</h3>
              <p className="text-sm text-[var(--muted)]">
                Sí, cuando quieras. Los cambios son inmediatos, sin penalidades.
              </p>
            </div>
            <div className="sld-card rounded-2xl p-6">
              <h3 className="mb-3 font-bold text-orange-500">¿Hay compromiso?</h3>
              <p className="text-sm text-[var(--muted)]">
                No. Cancelá cuando quieras, sin permanencia mínima.
              </p>
            </div>
            <div className="sld-card rounded-2xl p-6">
              <h3 className="mb-3 font-bold text-orange-500">¿Cuál es la diferencia?</h3>
              <p className="text-sm text-[var(--muted)]">
                Los planes Pro incluyen estadísticas avanzadas, cupones y campañas. Destacado semanal aparece primero en el app.
              </p>
            </div>
            <div className="sld-card rounded-2xl p-6">
              <h3 className="mb-3 font-bold text-orange-500">¿Qué es &quot;Destacado&quot;?</h3>
              <p className="text-sm text-[var(--muted)]">
                Tu negocio aparece primero durante 7 días, con marca especial y notificación a vecinos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
