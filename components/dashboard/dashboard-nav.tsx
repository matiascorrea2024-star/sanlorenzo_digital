"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "📊 Mis negocios", exact: true },
  { href: "/dashboard/ofertas", label: "🔥 Mis Ofertas", exact: false },
  { href: "/dashboard/ofertas/nueva", label: "➕ Nueva Oferta", exact: false },
  { href: "/dashboard/nuevo", label: "➕ Nuevo Negocio", exact: false },
  { href: "/dashboard/productos", label: "🛍️ Productos", exact: false },
  { href: "/dashboard/historias", label: "📸 Historia 24h", exact: false },
  { href: "/dashboard/mensajes", label: "💬 Mensajes", exact: false },
  { href: "/dashboard/resenas", label: "⭐ Reseñas", exact: false },
  { href: "/dashboard/analytics", label: "📊 Analytics", exact: false },
  { href: "/dashboard/planes", label: "💳 Plan", exact: false },
  { href: "/dashboard/asistente", label: "🤖 Asistente", exact: false },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              isActive
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
