"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NotificationBell() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar el menú automáticamente al navegar (evita overlay trabado)
  useEffect(() => { setOpen(false); }, [pathname]);
  const [items, setItems] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase().from("notifications")
        .select("*").eq("user_id", user.id).eq("read", false)
        .order("created_at", { ascending: false }).limit(10);
      if (data) { setItems(data); setCount(data.length); }
    })();
  }, []);

  // Realtime + toast al instante
  useEffect(() => {
    if (!userId) return;
    const chan = supabase().channel(`notif-${userId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload: any) => {
          setItems(prev => [payload.new, ...prev]);
          setCount(c => c + 1);
          setToast(payload.new);
          setTimeout(() => setToast(null), 6000);
        })
      .subscribe();
    return () => { supabase().removeChannel(chan); };
  }, [userId]);

  const irA = async (n: any) => {
    await supabase().from("notifications").update({ read: true }).eq("id", n.id);
    setCount(c => Math.max(0, c - 1));
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const marcarLeidas = async () => {
    if (!userId) return;
    await supabase().from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    setCount(0); setItems([]);
  };

  return (
    <>
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="relative rounded-lg bg-white/10 p-2 hover:bg-white/20">
          🔔
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black">{count}</span>
          )}
        </button>
        {open && (
          <div className="fixed left-4 right-4 top-20 z-[60] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 w-80 rounded-2xl border border-white/10 bg-[#1a1420] p-4 shadow-2xl z-50">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-black">Notificaciones</p>
              {count > 0 && <button onClick={marcarLeidas} className="text-xs text-orange-400">Marcar leídas</button>}
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-white/50">Sin notificaciones nuevas</p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {items.map(n => (
                  <button key={n.id} onClick={() => irA(n)}
                    className="w-full rounded-xl bg-white/5 p-3 text-left hover:bg-white/10 transition">
                    <p className="text-sm font-bold">{n.title}</p>
                    {n.body && <p className="text-xs text-white/60">{n.body}</p>}
                    <p className="mt-1 text-[10px] text-orange-400">Tocar para ir →</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TOAST FLOTANTE (aparece al instante) */}
      {toast && (
        <button onClick={() => { irA(toast); setToast(null); }}
          className="fixed bottom-24 right-4 z-[200] flex max-w-xs items-center gap-3 rounded-2xl border border-orange-400/50 bg-[#1a1420] p-4 shadow-2xl animate-pulse">
          <span className="text-2xl">💬</span>
          <div className="text-left">
            <p className="text-sm font-black">{toast.title}</p>
            {toast.body && <p className="truncate text-xs text-white/60">{toast.body}</p>}
            <p className="text-[10px] text-orange-400">Tocar para abrir →</p>
          </div>
        </button>
      )}
    </>
  );
}
