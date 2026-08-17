"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";

export default function NotificationBell() {
  const router = useRouter();
  // useAuth() reacciona a login/logout en el momento (mismo fix que
  // header.tsx) -- antes esto tenía su propio getUser() de una sola vez:
  // no solo quedaba desactualizado al loguearse sin refrescar, sino que en
  // un dispositivo compartido, si el usuario A cerraba sesión y B iniciaba
  // sesión sin recargar, el canal realtime seguía escuchando las
  // notificaciones de A.
  const { user } = useAuth();
  const userId = user?.id || null;
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar el menú automáticamente al navegar (evita overlay trabado)
  useEffect(() => { setOpen(false); }, [pathname]);
  const [items, setItems] = useState<any[]>([]);
  const [toast, setToast] = useState<any>(null);

  useEffect(() => {
    if (!userId) { setItems([]); setCount(0); return; }
    (async () => {
      const { data } = await supabase().from("notifications")
        .select("*").eq("user_id", userId).eq("read", false)
        .order("created_at", { ascending: false }).limit(10);
      if (data) { setItems(data); setCount(data.length); }
    })();
  }, [userId]);

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
        <button onClick={() => setOpen(!open)} aria-label="Notificaciones" className="relative rounded-full bg-white/10 p-2 hover:bg-white/20">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black">{count}</span>
          )}
        </button>
        {open && (
          <div className="fixed left-4 right-4 top-20 z-[60] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 w-80 rounded-[1.5rem] border border-white/[.06] bg-white/[.03] p-1.5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[1.1rem] border border-white/[.05] bg-[#1c1819] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-black">Notificaciones</p>
                {count > 0 && <button onClick={marcarLeidas} className="text-xs font-bold text-orange-400 hover:text-orange-300">Marcar leídas</button>}
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-white/50">Sin notificaciones nuevas</p>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {items.map(n => (
                    <button key={n.id} onClick={() => irA(n)}
                      className="w-full rounded-[1rem] border border-white/[.05] bg-white/[.03] p-3 text-left transition hover:border-orange-400/30 hover:bg-white/[.06]">
                      <p className="text-sm font-bold">{n.title}</p>
                      {n.body && <p className="text-xs text-white/60">{n.body}</p>}
                      <p className="mt-1 text-[10px] font-bold text-orange-400">Tocar para ir →</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TOAST FLOTANTE (aparece al instante) */}
      {toast && (
        <button onClick={() => { irA(toast); setToast(null); }}
          className="fixed bottom-40 right-4 z-[200] flex max-w-xs items-center gap-3 rounded-[1.375rem] border border-orange-400/40 bg-[#1c1819] p-4 shadow-2xl shadow-orange-500/10 animate-pulse md:bottom-24">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/25 to-red-600/15">
            <MessageCircle className="h-4 w-4 text-orange-300" />
          </span>
          <div className="text-left">
            <p className="text-sm font-black">{toast.title}</p>
            {toast.body && <p className="truncate text-xs text-white/60">{toast.body}</p>}
            <p className="text-[10px] font-bold text-orange-400">Tocar para abrir →</p>
          </div>
        </button>
      )}
    </>
  );
}
