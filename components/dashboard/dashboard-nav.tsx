"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, Flame, Plus, Store, ShoppingBag, Camera, Clapperboard, Radio, Pin, Bot,
  BarChart3, MessageSquare, Star, Heart, Ticket, Calendar, LifeBuoy, CreditCard,
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
        className={`group rounded-[1.75rem] border p-1.5 transition-all duration-300 hover:-translate-y-1 ${isActive ? "border-orange-400/30 bg-orange-500/[.04]" : "border-white/[.06] bg-white/[.02]"}`}
      >
        <div className="flex h-full flex-col gap-6 rounded-[1.375rem] border border-white/[.05] bg-black/20 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${isActive ? "bg-gradient-to-br from-orange-500 to-red-600 text-white" : "bg-white/5 text-white/50 group-hover:text-orange-400"}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold">{item.label}</p>
            <p className="mt-0.5 text-xs text-white/40">{item.sub}</p>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <nav className="mb-10 space-y-10">
      <div>
        <div className="mb-5 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] font-black uppercase tracking-[.35em] text-orange-400">Panel</span>
          <div className="h-px w-8 bg-white/10" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{card(HOME_ITEM, true)}</div>
      </div>
      {GROUPS.map((g) => (
        <div key={g.title}>
          <div className="mb-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-black uppercase tracking-[.35em] text-orange-400">{g.title}</span>
            <div className="h-px w-8 bg-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {g.items.map((item) => card(item))}
          </div>
        </div>
      ))}
    </nav>
  );
}
