"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Notif = { icon: string; text: string; href: string };

export default function NotificationBell() {
  const [user, setUser] = useState<any>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      setUser(user);
      if (!user) return;
      const sb = supabase();
      const { data: follows } = await sb
        .from("followers").select("business_id").eq("user_id", user.id);
      const ids = (follows || []).map((f: any) => f.business_id);

      const lista: Notif[] = [];

      if (ids.length > 0) {
        const { data: negs } = await sb
          .from("businesses").select("id, name, slug, promotions").in("id", ids);
        const hoy = new Date().toISOString().slice(0, 10);
        (negs || []).forEach((b: any) => {
          (b.promotions || []).forEach((p: any) => {
            if (!p.title) return;
            const activa =
              (!p.expires || p.expires >= hoy) &&
              (!p.expires_at || new Date(p.expires_at).getTime() > Date.now());
            if (activa)
              lista.push({
                icon: "🔥",
                text: `${b.name} tiene una oferta activa: ${p.title}`,
                href: "/negocio/" + b.slug,
              });
          });
        });
      }

      const { data: nuevos } = await sb
        .from("businesses")
        .select("name, slug, created_at")
        .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());
      (nuevos || []).forEach((b: any) =>
        lista.push({
          icon: "🏪",
          text: `Nuevo negocio en San Lorenzo: ${b.name}`,
          href: "/negocio/" + b.slug,
        })
      );

      setNotifs(lista.slice(0, 10));
    })();
  }, []);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        className="relative rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10 transition"
        title="Notificaciones"
      >
        🔔
        {notifs.length > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black">
            {notifs.length}
          </span>
        )}
      </button>
      {abierto && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-white/10 bg-[#141018] p-3 shadow-2xl">
          <p className="mb-2 text-xs font-black uppercase text-white/50">🔔 Notificaciones</p>
          {notifs.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/50">
              Nada nuevo por ahora.
              <br />
              Seguí negocios con ⭐ para recibir sus novedades.
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {notifs.map((n, i) => (
                <Link
                  key={i}
                  href={n.href}
                  onClick={() => setAbierto(false)}
                  className="block rounded-xl bg-white/5 p-3 text-sm hover:bg-white/10"
                >
                  {n.icon} {n.text}
                </Link>
              ))}
            </div>
          )}
          <Link
            href="/perfil"
            onClick={() => setAbierto(false)}
            className="mt-2 block rounded-xl border border-orange-400/30 bg-gradient-to-r from-orange-500/20 to-pink-500/20 p-3 text-center text-sm font-black text-orange-300 hover:from-orange-500/30"
          >
            🎖 Mi perfil y mis medallas
          </Link>
        </div>
      )}
    </div>
  );
}
