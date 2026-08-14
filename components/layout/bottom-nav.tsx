"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Flame, Newspaper, Trophy, Map, LayoutDashboard } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/buscar", label: "Buscar", icon: Search },
  { href: "/radar", label: "Radar", icon: Flame },
  { href: "/feed", label: "Muro", icon: Newspaper },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0a0710]/95 backdrop-blur-xl md:hidden">
      {/* grid de 7 columnas: entra en 320px sin cortar */}
      <div className="grid grid-cols-7">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex min-w-0 flex-col items-center gap-0.5 px-0.5 py-2 transition ${
                active ? "text-orange-400" : "text-white/60 hover:text-white"
              }`}>
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="w-full truncate text-center text-[9px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
