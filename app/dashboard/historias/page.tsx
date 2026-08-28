"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import { postActivity } from "@/lib/activity";
import { planDe } from "@/lib/plans";
import { Lock } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

const FONDOS = [
  "from-[var(--accent)] to-[var(--accent2)]",
  "from-green-500 to-teal-500",
  "from-blue-500 to-purple-500",
  "from-red-500 to-[#861642]",
];

export default function HistoriasPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { show } = useToast();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [text, setText] = useState("");
  const [background, setBackground] = useState(FONDOS[0]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      supabase().from("businesses").select("*").eq("owner_id", user.id).then(({ data }) => {
        if (data) { setBusinesses(data); if (data[0]) setBusinessId(data[0].id); }
      });
    }
  }, [user]);

  const publicar = async () => {
    setLoading(true);
    let image_url: string | null = null;
    if (file) {
      const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error: upErr } = await supabase().storage.from("stories").upload(path, file, { upsert: true });
      if (upErr) {
        show(`❌ ${friendlyError(upErr, "No se pudo subir la imagen. Probá de nuevo.")}`, "error");
        setLoading(false);
        return;
      }
      image_url = supabase().storage.from("stories").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase().from("business_stories").insert({
      business_id: businessId, text, background, image_url,
      expires_at: new Date(Date.now() + 24*3600*1000).toISOString(),
    });
    if (error) {
      show(`❌ ${friendlyError(error, "No se pudo publicar la historia. Probá de nuevo.")}`, "error");
    } else {
      const b = businesses.find(x => x.id === businessId);
      await postActivity({ type: "story_posted", businessId, title: `📸 ${b?.name} publicó una historia` });
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const negocioSel = businesses.find(b => b.id === businessId);
  const planActual = planDe(negocioSel);
  const sinPlan = businesses.length > 0 && !planActual.historias;

  return (
    <main className="bg-[var(--bg)] min-h-screen text-[var(--text)]">
      <div className="mx-auto max-w-2xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <Link href="/dashboard" className="text-sm font-bold text-[var(--accent-ink)] hover:text-[var(--accent-ink)]">← Volver</Link>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[.4em] text-[var(--accent-ink)]">Historia 24h</p>
        <h1 className="mt-2 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-space)" }}>Publicar historia</h1>
        <p className="mt-3 text-[var(--muted)]">Desaparece automáticamente en 24 horas.</p>

        {businesses.length === 0 ? (
          <div className="mt-6 rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
            <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-8 text-center text-[var(--muted)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              Necesitás un negocio para publicar historias.
            </div>
          </div>
        ) : sinPlan ? (
          <div className="mt-6 rounded-[1.75rem] border border-[var(--accent)]/25 bg-gradient-to-br from-[var(--accent)]/[.08] to-[var(--accent2)]/[.04] p-1.5">
            <div className="rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] p-8 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <Lock className="mx-auto mb-3 h-8 w-8 text-[var(--accent-ink)]" />
              <p className="font-black">Las Historias 24h son de Plan PRO</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--muted)]">
                Con PRO Comerciante podés publicar historias que aparecen 24 horas en la plataforma, como Instagram.
              </p>
              <Link href="/dashboard/planes" className="mt-5 inline-block rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-black hover:opacity-90">Mejorar a PRO →</Link>
            </div>
          </div>
        ) : (
        <div className="mt-6 rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
        <div className="space-y-4 rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
          <select value={businessId} onChange={e => setBusinessId(e.target.value)}
            className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-3">
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
            placeholder="Ej: 🔥 HOY 20% OFF en todo el local"
            className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-3" />

          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-[var(--text)]/70 file:mr-3 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-[var(--accent)] file:to-[var(--accent2)] file:px-4 file:py-2 file:text-sm file:font-black file:text-[var(--text)]" />

          <div className="flex gap-2">
            {FONDOS.map(f => (
              <button key={f} onClick={() => setBackground(f)}
                className={`h-10 w-10 rounded-full bg-gradient-to-br ${f} ${background === f ? "ring-2 ring-white" : ""}`} />
            ))}
          </div>

          <div className={`rounded-3xl bg-gradient-to-br ${background} p-8 text-center`}>
            <p className="text-xl font-black whitespace-pre-wrap">{text || "Vista previa"}</p>
          </div>

          <button onClick={publicar} disabled={loading || !text || !businessId}
            className="w-full rounded-full bg-[var(--accent)] py-3 font-black disabled:opacity-50">
            {loading ? "Publicando..." : "Publicar Historia"}
          </button>
        </div>
        </div>
        )}
      </div>
    </main>
  );
}
