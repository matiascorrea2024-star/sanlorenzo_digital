"use client";
import { useEffect, useState } from "react";
import PageHero from "@/components/ui/page-hero";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import Chat from "@/components/business/chat";
import Avatar from "@/components/ui/avatar";

function timeShort(d: string) {
  const date = new Date(d); const hoy = new Date();
  if (date.toDateString() === hoy.toDateString()) return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export default function MensajesClientePage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [bizMap, setBizMap] = useState<Record<string, any>>({});
  const [selectedBiz, setSelectedBiz] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      supabase().from("messages").select("*").eq("customer_id", user.id).order("created_at").then(async ({ data }) => {
        if (data) {
          setMessages(data);
          const ids = [...new Set(data.map(m => m.business_id))] as string[];
          if (ids.length) {
            const { data: biz } = await supabase().from("businesses").select("id, name, slug, owner_id").in("id", ids);
            const map: Record<string, any> = {};
            (biz || []).forEach(b => { map[b.id] = b; });
            setBizMap(map);
          }
        }
      });
    }
  }, [user]);

  // Tiempo real
  useEffect(() => {
    if (!user) return;
    const chan = supabase().channel(`my-msgs-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `customer_id=eq.${user.id}` },
        (p: any) => setMessages(prev => [...prev, p.new]))
      .subscribe();
    return () => { supabase().removeChannel(chan); };
  }, [user]);

  const convos: Record<string, any[]> = {};
  messages.forEach(m => { (convos[m.business_id] ||= []).push(m); });
  const convoList = Object.entries(convos).map(([biz, msgs]) => ({
    biz, last: msgs[msgs.length - 1],
    unread: msgs.filter(m => m.sender_role === "business" && !m.read_by_customer).length,
    name: bizMap[biz]?.name || "Negocio",
  })).sort((a, b) => (a.last.created_at < b.last.created_at ? 1 : -1));

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#120d09] px-4 text-center text-white/60">
        <div>
          <p className="text-3xl">💬</p>
          <h1 className="mt-3 text-xl font-bold text-white">Mis mensajes</h1>
          <p className="mt-1 text-sm">Iniciá sesión para ver tus conversaciones.</p>
        </div>
      </main>
    );
  }

  const sel = selectedBiz ? bizMap[selectedBiz] : null;

  return (
    <main className="bg-[#120d09] min-h-screen text-white pb-24">
      <PageHero title="Mis mensajes" subtitle="Conversaciones con negocios de San Lorenzo" />
      <div className="mx-auto max-w-3xl px-4 py-8">
        {!selectedBiz && (
          <div className="space-y-2">
            {convoList.length === 0 ? (
              <div className="rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5">
                <div className="rounded-[1.1rem] border border-white/[.05] bg-black/10 p-8 text-center text-white/50">
                  Aún no tenés conversaciones. Escribile a un negocio desde su página.
                </div>
              </div>
            ) : (
              convoList.map(cv => (
                <button key={cv.biz} onClick={() => setSelectedBiz(cv.biz)}
                  className="group flex w-full items-center gap-1.5 rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5 text-left transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex w-full items-center gap-3 rounded-[1.1rem] border border-white/[.05] bg-black/10 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)] transition-colors group-hover:border-orange-400/30">
                    <Avatar name={cv.name} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between"><p className="font-bold">{cv.name}</p><span className="text-[10px] text-white/40">{timeShort(cv.last.created_at)}</span></div>
                      <p className="truncate text-xs text-white/50">{cv.last.body}</p>
                    </div>
                    {cv.unread > 0 && <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-green-500 px-1 text-xs font-black text-black">{cv.unread}</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {selectedBiz && sel && (
          <div className="mt-4">
            <button onClick={() => setSelectedBiz(null)} className="mb-2 text-sm text-orange-400">← Conversaciones</button>
            <Chat businessId={selectedBiz} ownerId={sel.owner_id} businessName={sel.name} businessSlug={sel.slug} />
          </div>
        )}
      </div>
    </main>
  );
}
