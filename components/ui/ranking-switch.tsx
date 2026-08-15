import Link from "next/link";

export default function RankingSwitch({ current }: { current: "negocios" | "vecinos" }) {
  const base = "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black transition";
  const on = "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25";
  const off = "border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/25";
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/ranking" className={`${base} ${current === "negocios" ? on : off}`}>
        🏪 Ranking de Negocios
      </Link>
      <Link href="/vecinos" className={`${base} ${current === "vecinos" ? on : off}`}>
        👥 Ranking de Vecinos
      </Link>
    </div>
  );
}
