"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import { Ticket, Save, CheckCircle2, Stamp } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

export default function SellosPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [negocio, setNegocio] = useState<any>(null);
  const [programa, setPrograma] = useState<any>(null);
  const [meta, setMeta] = useState("10");
  const [premio, setPremio] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [validando, setValidando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: biz } = await supabase().from("businesses").select("id, name").eq("owner_id", user.id).order("name").limit(1).maybeSingle();
      if (biz) {
        setNegocio(biz);
        const { data: prog } = await supabase().from("loyalty_programs").select("*").eq("business_id", biz.id).maybeSingle();
        if (prog) {
          setPrograma(prog);
          setMeta(String(prog.meta));
          setPremio(prog.premio);
          setActive(prog.active);
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const guardar = async () => {
    if (!negocio || !premio.trim() || Number(meta) < 2) return;
    setGuardando(true);
    const { data, error } = await supabase().from("loyalty_programs")
      .upsert({ business_id: negocio.id, meta: Number(meta), premio: premio.trim(), active }, { onConflict: "business_id" })
      .select().single();
    if (data && !error) {
      setPrograma(data);
      show("✅ Tarjeta de sellitos guardada", "success");
    } else {
      show(`❌ ${friendlyError(error, "No se pudo guardar.")}`, "error");
    }
    setGuardando(false);
  };

  const validar = async () => {
    if (!negocio || codigo.trim().length < 4) return;
    setValidando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/loyalty/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: negocio.id, code: codigo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        show(`❌ ${data.error}`, "error");
      } else {
        setResultado(data);
        setCodigo("");
        show(data.ganado ? `🎉 ¡Completó la tarjeta! Le toca: ${data.premio}` : `✅ Sello sumado (${data.progreso}/${data.meta})`, "success");
      }
    } catch {
      show("❌ No se pudo validar el código, probá de nuevo.", "error");
    }
    setValidando(false);
  };

  if (loading) return <main className="mx-auto max-w-4xl px-4 py-24 text-center text-[var(--muted)]">Cargando...</main>;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <DashboardNav />
      <div className="mb-8 flex items-center gap-3">
        <Ticket className="h-8 w-8 text-orange-400" />
        <div>
          <h1 className="text-3xl font-black" style={{ fontFamily: "var(--font-space)" }}>Sellitos digitales</h1>
          <p className="text-sm text-[var(--muted)]">
            Una tarjeta de fidelidad sin plástico: definí cuántos sellos hacen falta y qué se gana. El cliente genera un código en tu ficha y se lo muestra en el local -- vos lo cargás acá abajo.
          </p>
        </div>
      </div>

      {!negocio ? (
        <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
          <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-8 text-center text-[var(--muted)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
            Primero necesitás tener un negocio creado.
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
            <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <h2 className="mb-4 font-black">Configurar tarjeta</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">Sellos necesarios</label>
                  <input type="number" min={2} max={30} value={meta} onChange={(e) => setMeta(e.target.value)}
                    className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-2.5 outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">Premio</label>
                  <input type="text" value={premio} onChange={(e) => setPremio(e.target.value)}
                    placeholder="Ej: Un café gratis" maxLength={80}
                    className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-2.5 outline-none focus:border-orange-400" />
                </div>
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm text-[var(--text)]/70">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
                Tarjeta activa (visible en mi ficha)
              </label>
              <button onClick={guardar} disabled={guardando || !premio.trim() || Number(meta) < 2}
                className="mt-5 flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-black disabled:opacity-50">
                <Save className="h-4 w-4" /> {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>

          {programa && (
            <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
              <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                <h2 className="mb-4 flex items-center gap-2 font-black">
                  <Stamp className="h-5 w-5 text-[var(--place)]" /> Dar un sello
                </h2>
                <p className="mb-4 text-xs text-[var(--muted)]">El cliente te muestra un código de 6 caracteres desde el celular. Cargalo acá para sumarle el sello.</p>
                <div className="flex flex-wrap gap-3">
                  <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="Ej: 7K3M9P" maxLength={6}
                    className="w-40 rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-2.5 text-center font-black tracking-widest outline-none focus:border-orange-400" />
                  <button onClick={validar} disabled={validando || codigo.trim().length < 4}
                    className="flex items-center gap-2 rounded-full bg-sky-500/20 border border-sky-400/40 px-5 py-2.5 text-sm font-black text-[var(--place)] hover:bg-sky-500/30 disabled:opacity-50">
                    <CheckCircle2 className="h-4 w-4" /> {validando ? "Validando..." : "Sumar sello"}
                  </button>
                </div>
                {resultado && (
                  <p className="mt-4 text-sm text-[var(--text)]/70">
                    {resultado.ganado ? `🎉 ¡Completó la tarjeta! Le toca: ${resultado.premio}` : `Progreso: ${resultado.progreso}/${resultado.meta}`}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
