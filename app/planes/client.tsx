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
      orange: "text-[var(--accent-ink)]",
      red: "text-[var(--accent-ink)]",
    };
    return colors[color] || "text-[var(--accent-ink)]";
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
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Header */}
      <div className="relative mx-auto max-w-6xl overflow-hidden px-4 py-14 text-center sm:py-20">
        <div className="pointer-events-none absolute left-[-10%] top-[-20%] h-[70%] w-[70%] rounded-full bg-[#d12f68] opacity-[0.08] blur-[180px]" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-[-50%] right-[-10%] h-[60%] w-[60%] rounded-full bg-[#d12f68] opacity-[0.06] blur-[140px]" aria-hidden="true" />
        <span className="relative inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>
          <Sparkles className="h-3.5 w-3.5" /> Crecé con tu comunidad
        </span>
        <h1 className="relative mx-auto mb-4 mt-5 max-w-2xl font-display text-4xl leading-[0.95] tracking-tight sm:text-6xl">
          Más visibilidad. Más clientes locales.
        </h1>
        <p className="relative mx-auto mb-2 max-w-xl text-lg text-[var(--muted)]">
          Elegí el plan que acompañe el momento de tu negocio.
        </p>
        <p className="relative text-sm text-[var(--muted2)]">
          Todos incluyen acceso a San Lorenzo Digital sin comisión de ventas
        </p>
      </div>

      {/* Payment Status Messages */}
      {paymentStatus === "exito" && (
        <div className="mx-auto mb-8 max-w-2xl rounded-xl border border-[var(--ok)]/30 bg-[var(--ok)]/10 p-4 text-center text-sm">
          ✅ ¡Pago exitoso! Tu plan se activó correctamente.
        </div>
      )}
      {paymentStatus === "error" && (
        <div className="mx-auto mb-8 max-w-2xl rounded-xl border border-[var(--bad)]/30 bg-[var(--bad)]/10 p-4 text-center text-sm">
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
                className={`relative flex h-full flex-col rounded-[2rem] border p-7 transition-all duration-300 hover:-translate-y-1 ${
                  key === "premium"
                    ? "border-[var(--accent)]/60 bg-gradient-to-br from-[var(--accent)]/[.12] to-transparent shadow-[0_0_40px_rgba(209,47,104,.08)]"
                    : "border-[var(--line)] bg-[var(--surface)]"
                }`}
              >
                {key === "premium" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 animate-pulse rounded-lg bg-[var(--accent)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                    MÁS POPULAR
                  </div>
                )}

                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--muted2)]" style={{ fontFamily: "var(--font-display)" }}>{key === "gratis" ? "Para empezar" : key === "premium" ? "Máxima exposición" : "Para crecer"}</p>
                    <h3 className="font-display text-2xl tracking-tight">{plan.name}</h3>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)]">
                    <Icon className={`h-5 w-5 ${getPlanIcon(color)}`} />
                  </span>
                </div>

                <div className="mb-6 flex items-end gap-1.5 border-b border-[var(--line)] pb-6">
                  <span className="font-display text-5xl leading-none tracking-tight text-[var(--accent-ink)] magenta-glow">
                    ${plan.precioARS ? plan.precioARS.toLocaleString("es-AR") : "Gratis"}
                  </span>
                  {plan.precioARS > 0 && (
                    <span className="pb-0.5 text-sm font-bold text-[var(--muted)]">/mes</span>
                  )}
                </div>

                {/* Features */}
                <ul className="mb-7 flex-1 space-y-3 pt-6 text-sm">
                  {plan.maxOfertas !== -1 && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[var(--ok)]" />
                      <span className="text-[var(--muted)]">{plan.maxOfertas} ofertas activas</span>
                    </li>
                  )}
                  {plan.maxOfertas === -1 && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[var(--ok)]" />
                      <span className="text-[var(--muted)]">Ofertas ilimitadas</span>
                    </li>
                  )}
                  {plan.stats && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[var(--ok)]" />
                      <span className="text-[var(--muted)]">Estadísticas</span>
                    </li>
                  )}
                  {plan.historias && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[var(--ok)]" />
                      <span className="text-[var(--muted)]">Historias</span>
                    </li>
                  )}
                  {plan.cupones && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[var(--ok)]" />
                      <span className="text-[var(--muted)]">Cupones exclusivos</span>
                    </li>
                  )}
                  {plan.campanas && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[var(--ok)]" />
                      <span className="text-[var(--muted)]">Campañas segmentadas</span>
                    </li>
                  )}
                  {plan.vivoProductos && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[var(--ok)]" />
                      <span className="text-[var(--muted)]">En Vivo con productos</span>
                    </li>
                  )}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(key)}
                  disabled={key === "gratis"}
                  className={`group inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest transition ${
                    key === "premium"
                      ? "btn-hard bg-[var(--accent)] text-white"
                      : "border border-[var(--line-strong)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent-ink)] disabled:opacity-50"
                  } disabled:opacity-50`}
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {key === "gratis"
                    ? "Ya estás usando"
                    : <>Elegir plan <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></>}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 h-px max-w-16 bg-[var(--accent)]/60" />
            <h2 className="font-display text-2xl tracking-tight md:text-3xl">Preguntas frecuentes</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7">
              <h3 className="mb-3 font-display text-base tracking-tight text-[var(--text)]">¿Puedo cambiar de plan?</h3>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                Sí, cuando quieras. Los cambios son inmediatos, sin penalidades.
              </p>
            </div>
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7">
              <h3 className="mb-3 font-display text-base tracking-tight text-[var(--text)]">¿Hay compromiso?</h3>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                No. Cancelá cuando quieras, sin permanencia mínima.
              </p>
            </div>
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7">
              <h3 className="mb-3 font-display text-base tracking-tight text-[var(--text)]">¿Cuál es la diferencia?</h3>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                Los planes Pro incluyen estadísticas avanzadas, cupones y campañas. Destacado semanal aparece primero en el app.
              </p>
            </div>
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7">
              <h3 className="mb-3 font-display text-base tracking-tight text-[var(--text)]">¿Qué es &quot;Destacado&quot;?</h3>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                Tu negocio aparece primero durante 7 días, con marca especial y notificación a vecinos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
