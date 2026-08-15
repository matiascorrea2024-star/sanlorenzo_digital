"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { MapPin, Store, ArrowLeft } from "lucide-react";
import Badge from "@/components/ui/badge";

export default function BarrioView() {
  const params = useParams();
  const ciudadSlug = params.ciudad as string;
  const barrioSlug = params.barrio as string;
  const [barrio, setBarrio] = useState<any>(null);
  const [ciudad, setCiudad] = useState<any>(null);
  const [negocios, setNegocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: city } = await supabase().from("locations")
        .select("*").eq("slug", ciudadSlug).eq("type", "city").maybeSingle();
      const { data: neigh } = await supabase().from("locations")
        .select("*").eq("slug", barrioSlug).eq("type", "neighborhood").maybeSingle();
      if (city && neigh) {
        setCiudad(city);
        setBarrio(neigh);
        const { data: biz } = await supabase().from("businesses")
          .select("*").eq("neighborhood_id", neigh.id).limit(20);
        setNegocios(biz || []);
      }
      setLoading(false);
    })();
  }, [ciudadSlug, barrioSlug]);

  if (loading) {
    return <main className="min-h-screen bg-[#120d09] flex items-center justify-center text-white">Cargando...</main>;
  }

  if (!barrio || !ciudad) {
    return (
      <main className="min-h-screen bg-[#120d09] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="text-2xl font-black">Barrio no encontrado</h1>
          <Link href={`/${ciudadSlug}`} className="mt-4 inline-block text-orange-400">← Volver a {ciudadSlug}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
      <section className="border-b border-white/10 bg-gradient-to-br from-orange-500/10 to-pink-500/10 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <Link href={`/${ciudadSlug}`} className="text-sm text-orange-400 flex items-center gap-1 mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver a {ciudad.name}
          </Link>
          <Badge variant="info" size="sm"><MapPin className="h-3 w-3" /> Barrio</Badge>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">{barrio.name}</h1>
          <p className="mt-2 text-white/70">{barrio.name}, {ciudad.name}</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-2xl font-black mb-4">
          <Store className="inline h-6 w-6 mr-2" />
          Negocios en {barrio.name} ({negocios.length})
        </h2>
        {negocios.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
            Aún no hay negocios en este barrio.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {negocios.map(b => (
              <Link key={b.id} href={`/negocio/${b.slug}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-orange-400/50 transition">
                <p className="font-bold">{b.name}</p>
                <p className="text-xs capitalize text-white/50">{b.category}</p>
                <p className="text-xs text-white/40 mt-1">⭐ {(b.rating || 0).toFixed(1)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
