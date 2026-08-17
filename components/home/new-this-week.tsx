"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import RankedAvatar from "@/components/ui/ranked-avatar";

type Nuevo = { id: string; name: string; slug: string; category: string; description: string | null; logo_url: string | null };

export default function NewThisWeek() {
  const [negocios, setNegocios] = useState<Nuevo[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    (async () => {
      const desde7 = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data } = await supabase()
        .from("businesses")
        .select("id, name, slug, category, description, logo_url")
        .in("status", ["verificado", "reclamado"])
        .eq("activo", true)
        .gte("created_at", desde7)
        .order("created_at", { ascending: false })
        .limit(6);
      setNegocios(data || []);
    })();
  }, []);

  // Rota entre los negocios reales nuevos de la semana -- si solo hay
  // uno, se queda fijo (no tiene sentido "rotar" un solo elemento).
  useEffect(() => {
    if (negocios.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % negocios.length), 6000);
    return () => clearInterval(t);
  }, [negocios.length]);

  // Sin negocios nuevos esta semana: no se muestra nada -- nunca se
  // rellena con datos viejos disfrazados de "nuevo".
  if (negocios.length === 0) return null;
  const n = negocios[idx];

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <Link href={`/negocio/${n.slug}`} key={n.id}
        className="group block rounded-[1.75rem] border border-emerald-400/25 bg-gradient-to-r from-emerald-500/[.08] to-cyan-500/[.04] p-1.5 transition-all duration-500">
        <div className="flex items-center gap-4 rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)] sm:p-6">
          <RankedAvatar slug={n.slug} name={n.name} categoria={n.category} photoUrl={n.logo_url} size={56} />
          <div className="min-w-0 flex-1">
            <p className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
              <Sparkles className="h-3 w-3" /> Nuevo esta semana
            </p>
            <p className="truncate text-lg font-black text-[var(--text)]">{n.name}</p>
            <p className="truncate text-sm capitalize text-[var(--muted)]">{n.category}{n.description ? ` · ${n.description}` : ""}</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-emerald-400 transition duration-300 group-hover:translate-x-1" />
        </div>
      </Link>
      {negocios.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {negocios.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-5 bg-emerald-400" : "w-1.5 bg-[var(--ov-15)]"}`} />
          ))}
        </div>
      )}
    </section>
  );
}
