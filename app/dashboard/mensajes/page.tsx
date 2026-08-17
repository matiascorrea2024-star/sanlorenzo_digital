"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import Chat from "@/components/business/chat";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import Avatar from "@/components/ui/avatar";

function timeShort(d: string) {
  const date = new Date(d); const hoy = new Date();
  if (date.toDateString() === hoy.toDateString()) return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export default function MensajesPage() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBiz, setSelectedBiz] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const pendingBiz = useRef<string | null>(null);
  const pendingCust = useRef<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    pendingBiz.current = q.get("biz"); pendingCust.current = q.get("cust");
    if (q.get("cust")) setSelectedCustomer(q.get("cust"));
  }, []);

  useEffect(() => {
    if (user) {
      supabase().from("businesses").select("*").eq("owner_id", user.id).then(({ data }) => {
        if (data && data.length) {
          setBusinesses(data);
          const want = pendingBiz.current && data.some(d => d.id === pendingBiz.current) ? pendingBiz.current : data[0].id;
          setSelectedBiz(want);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (selectedBiz) {
      supabase().from("messages").select("*").eq("business_id", selectedBiz).order("created_at").limit(300).then(({ data }) => {
        if (data) {
          setMessages(data);
          // Cargar nombres de contactos (agenda > perfil)
          const custIds = [...new Set(data.map(m => m.customer_id).filter(Boolean))] as string[];
          if (custIds.length) {
            Promise.all([
              supabase().from("contacts").select("customer_id, custom_name").eq("business_id", selectedBiz).in("customer_id", custIds),
              supabase().from("user_profiles").select("user_id, display_name").in("user_id", custIds),
            ]).then(([c, p]) => {
              const map: Record<string, string> = {};
              (p.data || []).forEach(x => { map[x.user_id] = x.display_name || "Cliente"; });
              (c.data || []).forEach(x => { map[x.customer_id] = x.custom_name || map[x.customer_id] || "Cliente"; });
              setNames(map);
            });
          }
        }
      });
    }
  }, [selectedBiz]);

  // Tiempo real
  useEffect(() => {
    if (!businesses.length) return;
    const channels = businesses.map(b =>
      supabase().channel(`msgs-${b.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `business_id=eq.${b.id}` },
          (p: any) => setMessages(prev => [...prev, p.new]))
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `business_id=eq.${b.id}` },
          (p: any) => setMessages(prev => prev.map(m => m.id === p.new.id ? p.new : m)))
        .subscribe()
    );
    return () => channels.forEach(ch => supabase().removeChannel(ch));
  }, [businesses]);

  const convos: Record<string, any[]> = {};
  messages.filter(m => m.business_id === selectedBiz && m.customer_id).forEach(m => { (convos[m.customer_id] ||= []).push(m); });
  const convoList = Object.entries(convos).map(([cust, msgs]) => ({
    cust, last: msgs[msgs.length - 1],
    unread: msgs.filter(m => m.sender_role === "customer" && !m.read_by_business).length,
    name: names[cust] || msgs.find(m => m.sender_role === "customer")?.sender_name || "Cliente",
  })).sort((a, b) => (a.last.created_at < b.last.created_at ? 1 : -1));

  const biz = businesses.find(b => b.id === selectedBiz);

  return (
    <main className="bg-[#0c0a0b] min-h-screen text-white pb-24">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <DashboardNav />
        <h1 className="text-3xl font-black">Mensajes</h1>

        {businesses.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {businesses.map(b => (
              <button key={b.id} onClick={() => { setSelectedBiz(b.id); setSelectedCustomer(null); }}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold ${selectedBiz === b.id ? "bg-gradient-to-r from-orange-500 to-red-600" : "bg-white/5 border border-white/10"}`}>
                {b.name}
              </button>
            ))}
          </div>
        )}

        {!selectedCustomer && (
          <div className="mt-6 space-y-2">
            {convoList.length === 0 ? (
              <div className="rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5">
                <div className="rounded-[1.1rem] border border-white/[.05] bg-black/10 p-8 text-center text-white/50">
                  Aún no tenés conversaciones.
                </div>
              </div>
            ) : (
              convoList.map(cv => (
                <button key={cv.cust} onClick={() => setSelectedCustomer(cv.cust)}
                  className="group flex w-full items-center gap-1.5 rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5 text-left transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex w-full items-center gap-3 rounded-[1.1rem] border border-white/[.05] bg-black/10 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)] transition-colors group-hover:border-orange-400/30">
                    <Avatar name={cv.name} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold">{cv.name}</p>
                        <span className="text-[10px] text-white/40">{timeShort(cv.last.created_at)}</span>
                      </div>
                      <p className="truncate text-xs text-white/50">{cv.last.sender_role === "business" ? "✓✓ " : ""}{cv.last.body}</p>
                    </div>
                    {cv.unread > 0 && (
                      <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-green-500 px-1 text-xs font-black text-black">{cv.unread}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {selectedCustomer && biz && (
          <div className="mt-4">
            <button onClick={() => setSelectedCustomer(null)} className="mb-2 text-sm text-orange-400">← Conversaciones</button>
            <Chat businessId={selectedBiz} ownerId={user?.id} businessName={biz.name} customerId={selectedCustomer} />
          </div>
        )}
      </div>
    </main>
  );
}
