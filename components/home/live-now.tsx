"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import SectionTitle from "@/components/ui/section-title";

export default function LiveNow() {
  const [streams, setStreams] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase()
        .from("live_streams")
        .select("id, title, cover_url, businesses(name, slug, plan)")
        .eq("status", "live")
        .order("started_at", { ascending: false })
        .limit(8);
      setStreams(data || []);
    })();
  }, []);

  // No hay transmisiones ahora: no mostramos ningún bloque, ni siquiera
  // un estado vacío -- este teaser solo tiene sentido cuando hay algo real.
  if (streams.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
      <SectionTitle
        eyebrow="En este momento"
        title="🔴 En vivo ahora"
        subtitle={`${streams.length} ${streams.length === 1 ? "comercio está transmitiendo" : "comercios están transmitiendo"}`}
        action={
          <Link href="/en-vivo" className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--text)]">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <div role="region" aria-label="Transmisiones en vivo, scroll horizontal" tabIndex={0}
        className="sld-no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {streams.map((s) => (
          <Link key={s.id} href={`/en-vivo/${s.id}`}
            className="group w-56 shrink-0 rounded-[1.5rem] border border-red-400/20 bg-[var(--ov-02)] p-1.5 transition-all duration-300 hover:-translate-y-0.5">
            <div className="overflow-hidden rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] transition-colors group-hover:border-red-400/40">
              <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-red-500/20 to-[#861642]/20">
                {s.cover_url && (
                  <Image src={s.cover_url} alt={s.title} fill sizes="224px" quality={85}
                    className="object-cover transition duration-500 group-hover:scale-105" />
                )}
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> En vivo
                </span>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-bold">{s.title}</p>
                <p className="truncate text-xs text-[var(--muted)]">{s.businesses?.name}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
