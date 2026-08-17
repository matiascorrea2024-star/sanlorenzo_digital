"use client";
import { useEffect, useState } from "react";
import { Eye, Heart, Users, Star, Ticket, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";

export default function BusinessStats() {
  const { user } = useAuth();
  const [s, setS] = useState({ views7: 0, viewsTotal: 0, followers: 0, favs: 0, revs: 0, coupons: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) { setLoading(false); return; }
      const { data: biz } = await supabase().from("businesses").select("id, favorites_count").eq("owner_id", user.id);
      if (!biz || !biz.length) { setLoading(false); return; }
      const ids = biz.map(b => b.id);
      const desde = new Date(Date.now() - 7 * 86400000).toISOString();

      // Favoritos: se suma businesses.favorites_count (mantenido por trigger),
      // no un count sobre "favorites" -- esa tabla es privada por RLS
      // (cada usuario solo puede leer sus propios favoritos).
      const favsTotal = biz.reduce((acc, b: any) => acc + (b.favorites_count || 0), 0);

      const [v7, vt, fo, re, co] = await Promise.all([
        supabase().from("page_views").select("*", { count: "exact", head: true }).in("business_id", ids).gte("viewed_at", desde),
        supabase().from("page_views").select("*", { count: "exact", head: true }).in("business_id", ids),
        supabase().from("followers").select("*", { count: "exact", head: true }).in("business_id", ids),
        supabase().from("business_reviews").select("*", { count: "exact", head: true }).in("business_id", ids),
        supabase().from("coupons").select("*", { count: "exact", head: true }).in("business_id", ids),
      ]);

      setS({
        views7: v7.count || 0, viewsTotal: vt.count || 0,
        followers: fo.count || 0, favs: favsTotal,
        revs: re.count || 0, coupons: co.count || 0,
      });
      setLoading(false);
    })();
  }, [user]);

  if (loading) return null;

  const cards = [
    { icon: Eye, label: "Visitas (7 días)", value: s.views7, color: "text-[var(--place)]" },
    { icon: TrendingUp, label: "Visitas totales", value: s.viewsTotal, color: "text-orange-400" },
    { icon: Users, label: "Seguidores", value: s.followers, color: "text-[var(--ok)]" },
    { icon: Heart, label: "Favoritos", value: s.favs, color: "text-[var(--bad)]" },
    { icon: Star, label: "Reseñas", value: s.revs, color: "text-[var(--warn)]" },
    { icon: Ticket, label: "Cupones", value: s.coupons, color: "text-[var(--bad)]" },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <div key={c.label} className="rounded-[1.25rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1">
          <div className="rounded-[.9rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-4 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
            <c.icon className={`mx-auto h-5 w-5 ${c.color}`} />
            <p className="mt-1 text-2xl font-black tabular-nums text-[var(--text)]">{c.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
