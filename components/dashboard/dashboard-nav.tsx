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
      { href: "/dashboard/reels", label: "🎬 Reels" },
      { href: "/dashboard/en-vivo", label: "🔴 En Vivo" },
      { href: "/dashboard/muro", label: "📌 Muro" },
      { href: "/dashboard/asistente", label: "🤖 Asistente" },
    ],
  },
  {
    title: "Relacionar",
    items: [
      { href: "/dashboard/analytics", label: "📊 Analytics" },
      { href: "/dashboard/mensajes", label: "💬 Mensajes" },
      { href: "/dashboard/resenas", label: "⭐ Reseñas" },
      { href: "/dashboard/seguidores", label: "❤️ Seguidores" },
      { href: "/dashboard/sellos", label: "🎟️ Sellitos" },
      { href: "/dashboard/turnos", label: "📅 Turnos" },
      { href: "/dashboard/soporte", label: "🛟 Soporte" },
    ],
  },
  {
    title: "Configurar",
    items: [
      { href: "/dashboard/planes", label: "💳 Plan" },
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
        className={`rounded-full px-4 py-2 text-sm font-bold transition-colors duration-300 ${
          isActive
            ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="mb-8 rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
      <div className="space-y-3 rounded-[1.375rem] border border-white/[.05] bg-black/10 p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
          {pill(HOME_ITEM, true)}
        </div>
        {GROUPS.map((g) => (
          <div key={g.title}>
            <p className="mb-1.5 px-1 text-[10px] font-black uppercase tracking-wider text-white/35">{g.title}</p>
            <div className="flex flex-wrap gap-2">{g.items.map((item) => pill(item))}</div>
          </div>
        ))}
      </div>
    </nav>
  );
}
