"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { rangoDe } from "@/lib/ranks";
import { useRank } from "@/lib/rank-cache";
import { TrendingUp } from "lucide-react";

const ACCIONES = [
  { icon: "🔥", l: "Publicar una oferta activa", pts: "+20", href: "/dashboard/ofertas/nueva" },
  { icon: "📦", l: "Agregar producto al catálogo", pts: "+10", href: "/dashboard/productos" },
  { icon: "📰", l: "Publicar en el Muro", pts: "+10", href: "/dashboard/muro" },
  { icon: "⭐", l: "Recibir una reseña", pts: "+5", href: null },
  { icon: "❤️", l: "Ganar un seguidor", pts: "+5", href: null },
];

export default function LevelUpCard({ slug, ownerId, showCtas = false }: { slug?: string; ownerId?: string | null; showCtas?: boolean }) {
  const [ownSlug, setOwnSlug] = useState<string | undefined>(slug);
  // En una página pública (ownerId informado) solo el dueño ve su panel:
  // para un visitante anónimo es instrucción interna sin sentido.
  const [esDueno, setEsDueno] = useState(ownerId == null);
  useEffect(() => {
    if (ownerId == null) return;
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      setEsDueno(user?.id === ownerId);
    })();
  }, [ownerId]);
  useEffect(() => {
    if (slug) return;
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase().from("businesses")
        .select("slug").eq("owner_id", user.id).order("name").limit(1).maybeSingle();
      if (biz) setOwnSlug(biz.slug);
    })();
  }, [slug]);
  const rank = useRank(ownSlug);
  const pts = rank?.puntos ?? 0;
  const r = rangoDe(pts);

  if (!esDueno) return null;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-gradient-to-br from-[var(--ov-05)] to-transparent p-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5" style={{ color: r.accent }} />
        <h3 className="font-black text-[var(--text)]">Subir de nivel</h3>
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {r.faltan > 0
          ? <>Te faltan <strong style={{ color: r.accent }}>{r.faltan} pts</strong> para llegar a <strong style={{ color: r.accent }}>{r.proximo}</strong>.</>
          : "¡Estás en la máxima división!"}
      </p>
      <div className="mt-3 space-y-2">
        {ACCIONES.map(a => (
          <div key={a.l} className="flex items-center gap-2 text-xs">
            <span>{a.icon}</span>
            <span className="flex-1 text-[var(--text)]/80">{a.l}</span>
            <span className="font-black text-[var(--ok)]">{a.pts}</span>
            {showCtas && a.href && (
              <Link href={a.href} className="rounded-lg bg-[var(--ov-10)] px-2 py-1 text-[10px] font-bold hover:bg-[var(--ov-20)]">
                Ir →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
