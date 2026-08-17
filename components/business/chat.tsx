"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Avatar from "@/components/ui/avatar";
import AdminFrame, { AdminBadge } from "@/components/ui/admin-frame";
import StaffAvatar from "@/components/ui/staff-avatar";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

type Props = { businessId: string; ownerId?: string; businessName?: string; businessSlug?: string; customerId?: string; staffId?: string };

function dayLabel(d: string) {
  const date = new Date(d); const hoy = new Date();
  const ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
  if (date.toDateString() === hoy.toDateString()) return "Hoy";
  if (date.toDateString() === ayer.toDateString()) return "Ayer";
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "long" });
}

export default function Chat({ businessId, ownerId, businessName, businessSlug, customerId, staffId }: Props) {
  const { show } = useToast();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [contactName, setContactName] = useState("Cliente");
  const [myName, setMyName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<any>(null);
  const isOwner = !!user && !!ownerId && user.id === ownerId;
  const activeCustomer = customerId || user?.id;
  const headerName = isOwner ? contactName : (businessName || "Negocio");
  // Solo tiene sentido del lado del negocio: la otra punta de ESTA
  // conversación puntual es el staff (chat de soporte reusando esta
  // misma UI, ver lib/support.ts).
  const otherIsStaff = isOwner && !!staffId && customerId === staffId;

  const markRead = async (cust: string, owner: boolean) => {
    const sb = supabase();
    if (owner) await sb.from("messages").update({ read_by_business: true }).eq("business_id", businessId).eq("customer_id", cust).eq("sender_role", "customer");
    else await sb.from("messages").update({ read_by_customer: true }).eq("business_id", businessId).eq("customer_id", cust).eq("sender_role", "business");
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      setUser(user); userRef.current = user;
      if (user) {
        const cust = customerId || user.id;
        const { data } = await supabase().from("messages").select("*")
          .eq("business_id", businessId).eq("customer_id", cust).order("created_at", { ascending: true }).limit(300);
        if (data) setMessages(data);
        await markRead(cust, !!ownerId && user.id === ownerId);

        // Mi nombre de perfil
        const { data: myProf } = await supabase().from("user_profiles").select("display_name").eq("user_id", user.id).maybeSingle();
        setMyName(myProf?.display_name || (user.email || "yo").split("@")[0]);

        // Nombre del contacto (agenda > perfil > "Cliente")
        if (ownerId && user.id === ownerId) {
          const { data: cont } = await supabase().from("contacts").select("custom_name").eq("business_id", businessId).eq("customer_id", cust).maybeSingle();
          const { data: prof } = await supabase().from("user_profiles").select("display_name").eq("user_id", cust).maybeSingle();
          setContactName(cont?.custom_name || prof?.display_name || "Cliente");
        }
      }
      setLoading(false);
    })();

    const chan = supabase().channel(`chat-${businessId}-${customerId || "me"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `business_id=eq.${businessId}` },
        async (payload: any) => {
          const m = payload.new;
          const cust = customerId || userRef.current?.id;
          if (m.customer_id !== cust) return;
          setMessages(prev => [...prev, m]);
          if (userRef.current && m.sender_id !== userRef.current.id) await markRead(cust, !!ownerId && userRef.current.id === ownerId);
        })
      .subscribe();
    return () => { supabase().removeChannel(chan); };
  }, [businessId, customerId]);

  // 🟢 PRESENCIA REAL (En línea)
  useEffect(() => {
    if (!user) return;
    const chan = supabase().channel(`pres-${businessId}-${activeCustomer}`, { config: { presence: { key: user.id } } });
    chan.on("presence", { event: "sync" }, () => {
      const st = chan.presenceState();
      setOnline(Object.keys(st).some(k => k !== user.id));
    }).subscribe(async (status) => {
      if (status === "SUBSCRIBED") await chan.track({ id: user.id });
    });
    return () => { supabase().removeChannel(chan); };
  }, [user, businessId, activeCustomer]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const saveContact = async () => {
    const name = prompt("Nombre para agendar este contacto:", contactName || "");
    if (!name) return;
    await supabase().from("contacts").upsert({ business_id: businessId, customer_id: activeCustomer, custom_name: name }, { onConflict: "business_id,customer_id" });
    setContactName(name);
  };

  const send = async () => {
    if (!body.trim() || !user) return;
    const cust = customerId || user.id;
    // Upsert mi perfil para que me vean con nombre
    await supabase().from("user_profiles").upsert({ user_id: user.id, display_name: myName || (user.email || "yo").split("@")[0] }, { onConflict: "user_id" });
    const { error } = await supabase().from("messages").insert({
      business_id: businessId, sender_id: user.id,
      sender_role: isOwner ? "business" : "customer",
      sender_name: myName || (user.email || "yo").split("@")[0],
      customer_id: cust, body: body.trim(),
    });
    if (error) { show(`❌ ${friendlyError(error, "No se pudo enviar el mensaje.")}`, "error"); return; }
    const target = isOwner ? cust : ownerId;
    if (target) {
      await supabase().from("notifications").insert({
        user_id: target, business_id: businessId, type: "new_message",
        title: isOwner ? `💬 ${businessName || "El negocio"} te respondió` : `💬 Nuevo mensaje de ${myName || "un cliente"}`,
        body: body.trim().slice(0, 80),
        link: isOwner ? (businessSlug ? `/negocio/${businessSlug}` : "/") : `/dashboard/mensajes?biz=${businessId}&cust=${cust}`,
      });
    }
    setBody("");
  };

  if (loading) return null;
  if (!user) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-6 text-center">
        <p className="text-lg font-black">💬 Chateá con este negocio</p>
        <Link href="/login" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-black">Iniciar sesión</Link>
      </div>
    );
  }

  // Construir lista con separadores de día
  const rows: any[] = [];
  messages.forEach((m, i) => {
    if (i === 0 || new Date(messages[i-1].created_at).toDateString() !== new Date(m.created_at).toDateString()) {
      rows.push({ sep: true, label: dayLabel(m.created_at), id: "sep" + m.id });
    }
    rows.push(m);
  });

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ov-05)]">
      {/* HEADER tipo WhatsApp */}
      <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--card-inner)] p-4">
        {otherIsStaff ? (
          <AdminFrame size={44}><StaffAvatar size={44} online={online} /></AdminFrame>
        ) : (
          <Avatar name={headerName} size={44} online={online} />
        )}
        <div className="flex-1">
          <p className="flex items-center gap-2 font-black">
            {headerName}
            {otherIsStaff && <AdminBadge />}
          </p>
          <p className={`text-xs ${online ? "text-[var(--ok)]" : "text-[var(--muted2)]"}`}>{online ? "🟢 En línea" : isOwner ? "Cliente" : "Negocio"}</p>
        </div>
        {isOwner && (
          <button onClick={saveContact} className="rounded-xl border border-[var(--line-strong)] px-3 py-1.5 text-xs font-bold hover:bg-[var(--ov-10)]">✎ Agendar</button>
        )}
      </div>

      {/* MENSAJES con patrón de fondo -- sin mensajes todavía usa un alto
          compacto en vez del h-96 fijo (se veía como un bloque vacío
          gigante en la primera conversación). */}
      <div className={`flex flex-col overflow-y-auto p-4 space-y-2 ${rows.length === 0 ? "py-8" : "h-96"}`}
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
        {rows.length === 0 && (
          <div className="self-center text-center">
            <p className="text-sm font-bold text-[var(--muted)]">
              {isOwner ? "Todavía no hay mensajes con este cliente." : `Todavía no le escribiste a ${businessName || "este negocio"}.`}
            </p>
            <p className="mt-1 text-xs text-[var(--muted2)]">Escribí abajo para empezar la conversación.</p>
          </div>
        )}
        {rows.map((r: any, i: number) => r.sep ? (
          <div key={r.id} className="my-2 self-center rounded-full bg-[var(--ov-15)] px-3 py-1 text-[10px] font-bold text-[var(--muted)]">{r.label}</div>
        ) : (
          <div key={r.id} className={`flex max-w-[80%] flex-col ${r.sender_id === user.id ? "items-end self-end" : "items-start self-start"}`}>
            {otherIsStaff && r.sender_id === staffId && (rows[i - 1]?.sender_id !== staffId || rows[i - 1]?.sep) && (
              <div className="mb-1"><AdminBadge /></div>
            )}
            <div className={`rounded-2xl px-4 py-2 text-sm shadow ${
              r.sender_id === user.id ? "rounded-br-none bg-gradient-to-r from-orange-500 to-red-600 text-white"
              : otherIsStaff && r.sender_id === staffId ? "rounded-bl-none border border-yellow-400/30 bg-gradient-to-br from-yellow-500/15 to-orange-500/10 text-[var(--text)]/90"
              : "rounded-bl-none bg-[var(--ov-10)] text-[var(--text)]/90"
            }`}>
            <p>{r.body}</p>
            <p className={`mt-0.5 text-right text-[10px] ${r.sender_id === user.id ? "text-white/70" : "text-[var(--muted2)]"}`}>
              {new Date(r.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
              {r.sender_id === user.id && (
                <span className={`ml-1 ${(isOwner ? r.read_by_customer : r.read_by_business) ? "text-sky-200" : ""}`}>
                  {(isOwner ? r.read_by_customer : r.read_by_business) ? "✓✓" : "✓"}
                </span>
              )}
            </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="flex gap-2 border-t border-[var(--line)] bg-[var(--card-inner)] p-3">
        <input value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escribí un mensaje"
          className="flex-1 rounded-full border border-[var(--line-strong)] bg-[var(--ov-05)] px-5 py-2.5 text-sm outline-none focus:border-orange-400" />
        <button onClick={send} disabled={!body.trim()}
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-black disabled:opacity-50">➤</button>
      </div>
    </section>
  );
}
