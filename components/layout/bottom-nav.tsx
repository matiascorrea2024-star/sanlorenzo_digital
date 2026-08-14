"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Flame, Newspaper, Trophy, Map, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ITEMS = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/buscar", label: "Buscar", icon: Search },
  { href: "/promociones", label: "Ofertas", icon: Flame },
  { href: "/feed", label: "Muro", icon: Newspaper },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/perfil", label: "Perfil", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  // Mensajes no leídos (como cliente y, si tiene negocio propio, como dueño)
  // -- se muestran como badge sobre "Perfil" ya que hoy no hay un ítem
  // dedicado a Mensajes en la nav de 7 accesos que se pidió conservar.
  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setUnread(0); return; }

      const { count: asCustomer } = await sb.from("messages")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", user.id).eq("sender_role", "business").eq("read_by_customer", false);

      let asOwner = 0;
      const { data: biz } = await sb.from("businesses").select("id").eq("owner_id", user.id);
      if (biz && biz.length) {
        const { count } = await sb.from("messages")
          .select("*", { count: "exact", head: true })
          .in("business_id", biz.map((b: any) => b.id))
          .eq("sender_role", "customer").eq("read_by_business", false);
        asOwner = count || 0;
      }
      setUnread((asCustomer || 0) + asOwner);
    })();
  }, [pathname]);

  return (
    <nav aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0a0710]/95 backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-7">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex min-w-0 flex-col items-center gap-0.5 px-0.5 py-2 transition ${
                active ? "text-orange-400" : "text-white/60 hover:text-white"
              }`}>
              <span className="relative">
                <item.icon className="h-5 w-5 shrink-0" />
                {item.href === "/perfil" && unread > 0 && (
                  <span
                    aria-label={`${unread} mensajes sin leer`}
                    className="absolute -right-2 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-black leading-none text-white"
                  >
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
              <span className="w-full truncate text-center text-[9px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
