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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      supabase().from("messages").select("*").eq("customer_id", user.id).order("created_at").limit(300).then(async ({ data }) => {
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
        setLoading(false);
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
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 text-center text-[var(--muted)]">
        <div>
          <p className="text-3xl">💬</p>
          <h1 className="mt-3 font-display text-xl uppercase tracking-tight text-[var(--text)]">Mis mensajes</h1>
          <p className="mt-1 text-sm">Iniciá sesión para ver tus conversaciones.</p>
        </div>
      </main>
    );
  }

  const sel = selectedBiz ? bizMap[selectedBiz] : null;

  return (
    <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
      <PageHero title="Mis mensajes" subtitle="Conversaciones con negocios de San Lorenzo" />
      <div className="mx-auto max-w-3xl px-4 py-8">
        {!selectedBiz && (
          <div className="space-y-3">
            {loading ? (
              <p className="py-12 text-center text-[var(--muted)]">Cargando…</p>
            ) : convoList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-8 text-center text-[var(--muted)]">
                Aún no tenés conversaciones. Escribile a un negocio desde su página.
              </div>
            ) : (
              convoList.map(cv => (
                <button key={cv.biz} onClick={() => setSelectedBiz(cv.biz)}
                  className="group flex w-full items-center gap-4 rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-4 text-left transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)]">
                  <Avatar name={cv.name} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2"><p className="font-display truncate uppercase tracking-tight">{cv.name}</p><span className="shrink-0 text-[10px] uppercase tracking-widest text-[var(--muted2)]">{timeShort(cv.last.created_at)}</span></div>
                    <p className="truncate text-xs text-[var(--muted)]">{cv.last.body}</p>
                  </div>
                  {cv.unread > 0 && <span className="flex h-6 min-w-[24px] shrink-0 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-xs font-black text-white">{cv.unread}</span>}
                </button>
              ))
            )}
          </div>
        )}

        {selectedBiz && sel && (
          <div className="mt-4">
            <button onClick={() => setSelectedBiz(null)} className="mb-2 text-[11px] font-black uppercase tracking-widest text-[var(--accent-ink)]">← Conversaciones</button>
            <Chat businessId={selectedBiz} ownerId={sel.owner_id} businessName={sel.name} businessSlug={sel.slug} />
          </div>
        )}
      </div>
    </main>
  );
}
