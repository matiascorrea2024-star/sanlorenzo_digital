"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { supabase } from "@/lib/supabase";
import SectionTitle from "@/components/ui/section-title";
import CategoryCover from "@/components/ui/category-cover";

export default function ReelsStrip() {
  const [reels, setReels] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase()
        .from("reels")
        .select("id, caption, likes_count, businesses(name, slug, category)")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(10);
      setReels(data || []);
    })();
  }, []);

  // Sin reels todavía: no mostramos la sección (igual que En Vivo) --
  // solo tiene sentido cuando hay contenido real para ver.
  if (reels.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SectionTitle
        eyebrow="Recién subidos"
        title="🎬 Reels"
        subtitle="Los negocios muestran lo que venden, en video"
        action={
          <Link href="/reels" className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-white">
            Ver todos
          </Link>
        }
      />
      <div role="region" aria-label="Reels recientes, scroll horizontal" tabIndex={0}
        className="sld-no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {reels.map((r) => (
          <Link key={r.id} href={`/reels?id=${r.id}`}
            className="group w-32 shrink-0 rounded-[1.25rem] border border-white/[.06] bg-white/[.02] p-1 transition-all duration-300 hover:-translate-y-0.5 sm:w-36">
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[.9rem] border border-white/[.05] shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
              <CategoryCover category={r.businesses?.category} seed={r.id} className="h-full w-full transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />
              <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 backdrop-blur">
                <Play className="h-3 w-3 fill-white text-white" />
              </span>
              <div className="absolute inset-x-0 bottom-0 p-2">
                <p className="truncate text-[11px] font-bold text-white">{r.businesses?.name}</p>
                {r.likes_count > 0 && <p className="text-[9px] text-white/60">❤️ {r.likes_count}</p>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
