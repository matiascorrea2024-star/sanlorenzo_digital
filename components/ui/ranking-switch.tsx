import Link from "next/link";

export default function RankingSwitch({ current }: { current: "negocios" | "vecinos" }) {
  const base = "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black transition";
  const on = "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25";
  const off = "border border-[var(--line)] bg-[var(--ov-05)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--line-strong)]";
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
