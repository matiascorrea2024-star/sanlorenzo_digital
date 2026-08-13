"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", icon: "🏠", label: "Inicio" },
  { href: "/negocios", icon: "🔍", label: "Buscar" },
  { href: "/promociones", icon: "🔥", label: "Ofertas" },
  { href: "/feed", icon: "📰", label: "Muro" },
  { href: "/ranking", icon: "🏆", label: "Ranking" },
  { href: "/mapa", icon: "🗺️", label: "Mapa" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0a0710]/95 backdrop-blur-md">
      <div className="grid grid-cols-6">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold transition ${
              path === it.href ? "text-orange-400" : "text-white/50 hover:text-white/80"
            }`}
          >
            <span className="text-lg">{it.icon}</span>
            {it.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
