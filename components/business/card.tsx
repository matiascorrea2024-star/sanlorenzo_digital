import Link from "next/link";

const CAT_IMG: Record<string, string> = {
  calzado: "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=800&q=80",
  gastronomia: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  ferreteria: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
  belleza: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
  ropa: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80",
  automotor: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
  profesionales: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
  tecnologia: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
};
const FALLBACK = "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80";

export default function BusinessCard({ b }: { b: any }) {
  const cat = String(b.category || "").toLowerCase();
  return (
    <Link
      href={`/negocio/${b.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[.06] to-white/[.02] transition duration-300 hover:-translate-y-1 hover:border-orange-400/40 hover:shadow-xl hover:shadow-orange-500/10"
    >
      <div className="relative h-32 overflow-hidden">
        <img
          src={b.portada_url || CAT_IMG[cat] || FALLBACK}
          alt={b.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0a12] via-transparent to-transparent" />
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black backdrop-blur ${b.open ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-300" : "border-rose-400/30 bg-rose-500/20 text-rose-300"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${b.open ? "animate-pulse bg-emerald-400" : "bg-rose-400"}`} />
          {b.open ? "Abierto" : "Cerrado"}
        </span>
        {b.status === "verificado" && (
          <span className="absolute right-3 top-3 rounded-full border border-sky-400/30 bg-black/60 px-2 py-1 text-[10px] font-black text-sky-300 backdrop-blur">✓ Verificado</span>
        )}
        <div className="absolute -bottom-5 left-4">
          {b.logo_url ? (
            <img src={b.logo_url} alt="" className="h-11 w-11 rounded-2xl border-2 border-[#0d0a12] object-cover shadow-lg" />
          ) : (
            <div className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-[#0d0a12] bg-gradient-to-br from-orange-500 to-pink-500 text-sm font-black text-white shadow-lg">
              {(b.name || "?")[0]}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 pt-7">
        <h3 className="truncate text-sm font-black transition group-hover:text-orange-300">{b.name}</h3>
        <p className="mt-0.5 text-[11px] capitalize text-white/50">{b.category} · {b.address}</p>
        {b.description && <p className="mt-2 line-clamp-2 text-xs text-white/60">{b.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="flex items-center gap-1 text-xs font-bold text-yellow-300">
            ★ {Number(b.rating || 0).toFixed(1)}
            <span className="font-normal text-white/40">({b.reviews || 0})</span>
          </span>
          <span className="text-xs font-bold text-orange-400 opacity-0 transition group-hover:opacity-100">Ver →</span>
        </div>
      </div>
    </Link>
  );
}
