"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, Flame, Plus, Store, ShoppingBag, Camera, Clapperboard, Radio, Pin, Bot,
  BarChart3, MessageSquare, Star, Heart, Ticket, Calendar, LifeBuoy, CreditCard, Megaphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const HOME_ITEM = { href: "/dashboard", label: "Mis negocios", sub: "Panel general", icon: LayoutGrid };

const GROUPS: { title: string; items: { href: string; label: string; sub: string; icon: LucideIcon }[] }[] = [
  {
    title: "Publicar y crear",
    items: [
      { href: "/dashboard/ofertas/nueva", label: "Nueva oferta", sub: "Publicá hoy mismo", icon: Plus },
      { href: "/dashboard/ofertas", label: "Mis ofertas", sub: "Ver y editar activas", icon: Flame },
      { href: "/dashboard/nuevo", label: "Nuevo negocio", sub: "Sumar otro local", icon: Store },
      { href: "/dashboard/productos", label: "Catálogo", sub: "Tus productos", icon: ShoppingBag },
      { href: "/dashboard/historias", label: "Historia 24h", sub: "Contenido efímero", icon: Camera },
      { href: "/dashboard/reels", label: "Reels", sub: "Mostrá en video", icon: Clapperboard },
      { href: "/dashboard/en-vivo", label: "En vivo", sub: "Shopping en directo", icon: Radio },
      { href: "/dashboard/muro", label: "Muro", sub: "Publicaciones libres", icon: Pin },
      { href: "/dashboard/asistente", label: "Asistente", sub: "Ayuda con IA", icon: Bot },
    ],
  },
  {
    title: "Relacionar",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", sub: "Visitas y clics", icon: BarChart3 },
      { href: "/dashboard/publicidad", label: "Publicidad", sub: "Avisos pagos", icon: Megaphone },
      { href: "/dashboard/mensajes", label: "Mensajes", sub: "Chat con vecinos", icon: MessageSquare },
      { href: "/dashboard/resenas", label: "Reseñas", sub: "Respondé a clientes", icon: Star },
      { href: "/dashboard/seguidores", label: "Seguidores", sub: "Quién te sigue", icon: Heart },
      { href: "/dashboard/sellos", label: "Sellitos", sub: "Tarjeta de fidelidad", icon: Ticket },
      { href: "/dashboard/turnos", label: "Turnos", sub: "Gestioná tu agenda", icon: Calendar },
      { href: "/dashboard/soporte", label: "Soporte", sub: "¿Necesitás ayuda?", icon: LifeBuoy },
    ],
  },
  {
    title: "Configurar",
    items: [
      { href: "/dashboard/planes", label: "Plan", sub: "Límites y upgrade", icon: CreditCard },
    ],
  },
];

export default function DashboardNav() {
  const pathname = usePathname();

  const card = (item: { href: string; label: string; sub: string; icon: LucideIcon }, exact = false) => {
    const isActive = exact ? pathname === item.href : pathname.startsWith(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`group flex items-center gap-3 border-l-4 py-2.5 pl-4 pr-3 transition-all duration-200 ${isActive ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-transparent text-[var(--muted)] hover:bg-[var(--ov-05)] hover:text-white"}`}
      >
        <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-[var(--accent)]" : "text-[var(--muted2)] group-hover:text-white"}`} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold">{item.label}</span>
          <span className={`block truncate text-[11px] ${isActive ? "text-[var(--accent)]/70" : "text-[var(--muted2)]"}`}>{item.sub}</span>
        </span>
      </Link>
    );
  };

  const divider = (title: string) => (
    <div className="mb-4 flex items-center gap-4">
      <div className="h-px flex-1 bg-[var(--ov-10)]" />
      <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>{title}</span>
      <div className="h-px w-8 bg-[var(--ov-10)]" />
    </div>
  );

  return (
    <nav className="mb-10 space-y-8">
      <div>
        {divider("Panel")}
        <div className="grid gap-x-6 sm:grid-cols-2">{card(HOME_ITEM, true)}</div>
      </div>
      {GROUPS.map((g) => (
        <div key={g.title}>
          {divider(g.title)}
          <div className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
            {g.items.map((item) => card(item))}
          </div>
        </div>
      ))}
    </nav>
  );
}
