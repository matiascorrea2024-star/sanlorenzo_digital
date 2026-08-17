"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import RankedAvatar from "@/components/ui/ranked-avatar";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

type Fila = { business_id: string; name: string; slug: string; category: string; logo_url: string | null; votos: number };

function mesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function NegocioDelMes() {
  const router = useRouter();
  const { show } = useToast();
  const [top, setTop] = useState<Fila[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [miVoto, setMiVoto] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [votando, setVotando] = useState(false);
  const [sugerencias, setSugerencias] = useState<{ id: string; name: string; slug: string }[]>([]);
  const mes = useMemo(() => mesActual(), []);

  const cargar = async () => {
    const sb = supabase();
    const { data: votos } = await sb.from("business_month_votes").select("business_id").eq("month", mes);
    if (!votos || votos.length === 0) { setTop([]); return; }
    const counts: Record<string, number> = {};
    votos.forEach((v) => { counts[v.business_id] = (counts[v.business_id] || 0) + 1; });
    const ids = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 5);
    const { data: negocios } = await sb.from("businesses").select("id, name, slug, category, logo_url").in("id", ids);
    const filas = (negocios || [])
      .map((n) => ({ business_id: n.id, name: n.name, slug: n.slug, category: n.category, logo_url: n.logo_url, votos: counts[n.id] }))
      .sort((a, b) => b.votos - a.votos);
    setTop(filas);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      setUserId(user?.id || null);
      if (user) {
        const { data } = await supabase().from("business_month_votes").select("business_id").eq("user_id", user.id).eq("month", mes).maybeSingle();
        setMiVoto(data?.business_id || null);
      }
      await cargar();
    })();

    const chan = supabase().channel(`negocio-del-mes-${mes}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "business_month_votes", filter: `month=eq.${mes}` }, () => cargar())
      .subscribe();
    return () => { supabase().removeChannel(chan); };
  }, [mes]);

  useEffect(() => {
    if (q.trim().length < 2) { setSugerencias([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase().from("businesses").select("id, name, slug")
        .in("status", ["verificado", "reclamado"]).eq("activo", true)
        .ilike("name", `%${q.trim()}%`).limit(5);
      setSugerencias(data || []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const votar = async (businessId: string) => {
    if (!userId) { router.push("/login"); return; }
    if (votando) return;
    setVotando(true);
    const { error } = await supabase().from("business_month_votes").upsert({ user_id: userId, business_id: businessId, month: mes }, { onConflict: "user_id,month" });
    setVotando(false);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo registrar tu voto.")}`, "error"); return; }
    setMiVoto(businessId);
    setQ("");
    setSugerencias([]);
  };

  const nombreMes = new Date().toLocaleDateString("es-AR", { month: "long" });

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-[1.75rem] border border-yellow-400/25 bg-gradient-to-br from-yellow-500/[.08] to-orange-500/[.03] p-1.5">
        <div className="rounded-[1.375rem] border border-white/[.06] bg-black/20 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
          <div className="mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-300">Negocio del mes de {nombreMes}</p>
          </div>

          {top.length === 0 ? (
            <p className="text-sm text-white/50">Todavía no hay votos este mes. ¡Sé el primero en votar a tu negocio favorito!</p>
          ) : (
            <div className="space-y-2">
              {top.map((f, i) => (
                <Link key={f.business_id} href={`/negocio/${f.slug}`}
                  className="group flex items-center gap-3 rounded-[1.1rem] border border-white/[.05] bg-white/[.02] p-2.5 transition hover:border-yellow-400/30">
                  <span className="w-5 shrink-0 text-center text-sm font-black text-white/40">{i + 1}</span>
                  <RankedAvatar slug={f.slug} name={f.name} categoria={f.category} photoUrl={f.logo_url} size={36} />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{f.name}</span>
                  <span className="shrink-0 text-xs font-black text-yellow-300">{f.votos} 🗳️</span>
                </Link>
              ))}
            </div>
          )}

          <div className="relative mt-4">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-white/40" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscá tu negocio favorito para votarlo..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-white/35" />
            </div>
            {sugerencias.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-white/10 bg-[#1c1819] p-1.5 shadow-2xl">
                {sugerencias.map((n) => (
                  <button key={n.id} onClick={() => votar(n.id)} disabled={votando}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm font-bold hover:bg-white/10 disabled:opacity-60">
                    {n.name}
                    {miVoto === n.id && <span className="text-xs text-yellow-300">Tu voto ✅</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          {miVoto && <p className="mt-2 text-center text-xs text-white/40">Votás una vez por mes -- podés cambiar tu voto cuando quieras.</p>}
        </div>
      </div>
    </section>
  );
}
