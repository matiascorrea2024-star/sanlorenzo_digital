"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HOME_ITEM = { href: "/dashboard", label: "📊 Mis negocios", exact: true };

const GROUPS: { title: string; items: { href: string; label: string }[] }[] = [
  {
    title: "Publicar",
    items: [
      { href: "/dashboard/ofertas", label: "🔥 Mis Ofertas" },
      { href: "/dashboard/ofertas/nueva", label: "➕ Nueva Oferta" },
      { href: "/dashboard/nuevo", label: "➕ Nuevo Negocio" },
      { href: "/dashboard/productos", label: "🛍️ Productos" },
      { href: "/dashboard/historias", label: "📸 Historia 24h" },
    ],
  },
  {
    title: "Analizar",
    items: [{ href: "/dashboard/analytics", label: "📊 Analytics" }],
  },
  {
    title: "Relacionar",
    items: [
      { href: "/dashboard/mensajes", label: "💬 Mensajes" },
      { href: "/dashboard/resenas", label: "⭐ Reseñas" },
    ],
  },
  {
    title: "Configurar",
    items: [
      { href: "/dashboard/planes", label: "💳 Plan" },
      { href: "/dashboard/asistente", label: "🤖 Asistente" },
    ],
  },
];

export default function DashboardNav() {
  const pathname = usePathname();

  const pill = (item: { href: string; label: string }, exact = false) => {
    const isActive = exact ? pathname === item.href : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
          isActive
            ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="mb-8 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {pill(HOME_ITEM, true)}
      </div>
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="mb-1.5 px-1 text-[10px] font-black uppercase tracking-wider text-white/35">{g.title}</p>
          <div className="flex flex-wrap gap-2">{g.items.map((item) => pill(item))}</div>
        </div>
      ))}
    </nav>
  );
}
