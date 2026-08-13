"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, createBusiness, type NewBusiness } from "@/lib/supabase";

const CATEGORIES = [
  { id: "calzado", name: "Calzado", icon: "👟", type: "comercio", accent: "#C8A15A" },
  { id: "gastronomia", name: "Gastronomía", icon: "🍽️", type: "restaurante", accent: "#22D3EE" },
  { id: "ferreteria", name: "Ferreterías", icon: "🔧", type: "ferreteria", accent: "#F59E0B" },
  { id: "belleza", name: "Belleza", icon: "💈", type: "peluqueria", accent: "#8B5CF6" },
  { id: "ropa", name: "Ropa", icon: "👕", type: "comercio", accent: "#34D399" },
  { id: "automotor", name: "Automotor", icon: "🚗", type: "automotor", accent: "#F87171" },
  { id: "profesionales", name: "Profesionales", icon: "💼", type: "profesional", accent: "#60A5FA" },
  { id: "tecnologia", name: "Tecnología", icon: "💻", type: "comercio", accent: "#A78BFA" },
];

const STEPS = ["Rubro", "Nombre y descripción", "Ubicación", "Contacto", "Primer producto"];

export default function Nuevo() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<NewBusiness & { categoryObj?: typeof CATEGORIES[0] }>({
    name: "",
    category: "",
    type: "comercio",
    description: "",
    address: "",
    whatsapp: "",
    instagram: "",
    accent: "#8B5CF6",
    schedule: "",
    first_item: "",
  });

  const initials = form.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "??";

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const canNext =
    (step === 0 && form.category) ||
    (step === 1 && form.name.trim() && form.description.trim()) ||
    (step === 2 && form.address.trim()) ||
    (step === 3) ||
    (step === 4);

  const selectCategory = (c: typeof CATEGORIES[0]) => {
    setForm({ ...form, category: c.id, type: c.type, accent: c.accent, categoryObj: c });
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) {
        router.push("/login");
        return;
      }
      await createBusiness(form, user.user.id);
      router.push("/dashboard/mis-negocios");
    } catch (e: any) {
      setError(e.message || "Error al crear la miniweb");
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>
          Creá tu miniweb
        </h1>
        <span className="text-sm text-[var(--muted)]">
          Paso {step + 1} de {STEPS.length}
        </span>
      </div>

      <div className="mb-8 h-1 overflow-hidden rounded-full bg-[var(--surface)]">
        <div
          className="h-full bg-[var(--accent)] transition-all"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          {step === 0 && (
            <>
              <h2 className="mb-1 text-lg font-semibold">¿Qué tipo de negocio tenés?</h2>
              <p className="mb-6 text-sm text-[var(--muted)]">Elegí el rubro más cercano.</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectCategory(c)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                      form.category === c.id
                        ? "border-[var(--accent)] bg-[var(--surface2)] text-white"
                        : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-white"
                    }`}
                  >
                    <span className="text-3xl">{c.icon}</span>
                    <span className="text-sm">{c.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="mb-1 text-lg font-semibold">Contá sobre tu negocio</h2>
              <p className="mb-6 text-sm text-[var(--muted)]">Este texto aparece en tu miniweb.</p>
              <label className="mb-4 block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Nombre
                </span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Ferretería San Lorenzo"
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Descripción breve
                </span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ej: Herramientas y materiales para tu hogar. Asesoramiento personalizado."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="mb-1 text-lg font-semibold">¿Dónde estás?</h2>
              <p className="mb-6 text-sm text-[var(--muted)]">Dirección en San Lorenzo.</p>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Dirección
                </span>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Ej: Av. San Martín 1200, San Lorenzo"
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Horarios (opcional)
                </span>
                <input
                  value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  placeholder="Ej: Lun a Vie 9–18 · Sáb 9–13"
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="mb-1 text-lg font-semibold">¿Cómo te contactan?</h2>
              <p className="mb-6 text-sm text-[var(--muted)]">Para que los clientes te escriban directo.</p>
              <label className="mb-4 block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  WhatsApp (con código país, sin +)
                </span>
                <input
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, "") })}
                  placeholder="Ej: 5493476637294"
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Instagram (opcional)
                </span>
                <input
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value.replace(/^@/, "") })}
                  placeholder="Ej: mi_negocio"
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="mb-1 text-lg font-semibold">Tu primer producto o servicio</h2>
              <p className="mb-6 text-sm text-[var(--muted)]">
                Uno solo para empezar. Podés cargar más después.
              </p>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Nombre
                </span>
                <input
                  value={form.first_item}
                  onChange={(e) => setForm({ ...form, first_item: e.target.value })}
                  placeholder={
                    form.type === "restaurante"
                      ? "Ej: Brunch completo"
                      : form.type === "peluqueria"
                      ? "Ej: Corte + barba"
                      : "Ej: Zapatillas urbanas"
                  }
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
            </>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={prev}
              disabled={step === 0}
              className="rounded-lg px-4 py-2 text-sm text-[var(--muted)] hover:text-white disabled:opacity-30"
            >
              ← Atrás
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                disabled={!canNext}
                className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={loading || !canNext}
                className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                {loading ? "Creando…" : "Publicar mi miniweb ✨"}
              </button>
            )}
          </div>
          {error && <p className="mt-4 text-center text-sm text-[var(--bad)]">{error}</p>}
        </div>

        <aside className="hidden lg:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Así se ve tu miniweb
          </p>
          <div className="sticky top-20 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg)]">
            <div className="h-24 opacity-40" style={{ background: `linear-gradient(135deg, ${form.accent}, transparent 70%)` }} />
            <div className="-mt-8 px-4 pb-5">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-xl border-4 border-[var(--bg)] text-lg font-bold text-black"
                style={{ background: form.accent }}
              >
                {initials}
              </span>
              <h3 className="mt-2 text-lg font-bold" style={{ fontFamily: "var(--font-space)" }}>
                {form.name || "Tu negocio"}
              </h3>
              <p className="text-xs capitalize text-[var(--muted)]">
                {form.categoryObj?.name || "Rubro"} · 🟢 Abierto
              </p>
              <p className="mt-3 text-xs text-[var(--muted)]">
                {form.description || "Tu descripción aparece acá…"}
              </p>
              {form.address && <p className="mt-2 text-xs">📍 {form.address}</p>}
              {form.first_item && (
                <div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 text-xs">
                  <p className="font-medium">{form.first_item}</p>
                  <p className="text-[var(--accent2)]">Consultar</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
