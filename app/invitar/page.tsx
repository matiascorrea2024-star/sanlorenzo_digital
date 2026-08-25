"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Share2, Copy, Check, Store, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const HITOS = [
  { n: 3, premio: "3 días de visibilidad \"Nuevo\" para tu negocio" },
  { n: 10, premio: "1 mes de Plan PRO sin costo" },
  { n: 25, premio: "Destacado del Mes (posición fija en home)" },
];

export default function InvitarPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [total, setTotal] = useState(0);
  const [activos, setActivos] = useState(0);
  const [nombreNegocio, setNombreNegocio] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase().from("referrals").select("activated_at").eq("referrer_id", user.id);
        setTotal(data?.length || 0);
        setActivos((data || []).filter((r: any) => r.activated_at).length);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#0c0a0b] text-sm text-[#a99b86]">Cargando…</main>;

  const link = user ? `https://sanlorenzodigital.vercel.app/?ref=${user.id}&src=invite` : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(link)}`;

  const copiar = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const compartir = async () => {
    const text = "🛍️ Descubrí ofertas y negocios de San Lorenzo en La Gran Barata Digital";
    if (navigator.share) {
      try { await navigator.share({ title: "La Gran Barata Digital", text, url: link }); } catch {}
    } else {
      copiar();
    }
  };

  // Cualquiera puede invitar a un negocio que le gusta, sin necesitar
  // cuenta -- cuanta menos fricción, más negocios se enteran de que
  // pueden sumarse gratis. El comerciante mismo hace clic y publica
  // cuando quiere, no hace falta que nadie "apruebe" la invitación.
  const invitarNegocio = () => {
    const negocio = nombreNegocio.trim();
    const text = negocio
      ? `Hola ${negocio}! Te escribo porque te quiero recomendar sumarte a La Gran Barata Digital, la plataforma de negocios de San Lorenzo -- es gratis y en minutos podés tener tu perfil con ofertas, catálogo y contacto por WhatsApp. Mirá: https://sanlorenzodigital.vercel.app/para-negocios`
      : `Che, te paso La Gran Barata Digital -- una plataforma gratis para que los negocios de San Lorenzo se sumen con su perfil, ofertas y catálogo. Dale una mirada: https://sanlorenzodigital.vercel.app/para-negocios`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0c0a0b] pb-24 text-[#f7f3ec]">
      <div className="pointer-events-none absolute left-[-10%] top-[-15%] h-[60%] w-[60%] rounded-full bg-[#d12f68] opacity-[0.08] blur-[180px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-30%] right-[-5%] h-[50%] w-[50%] rounded-full bg-[#d12f68] opacity-[0.06] blur-[140px]" aria-hidden="true" />

      <section className="relative z-10 mx-auto max-w-lg px-4 pt-14 text-center sm:px-6">
        <Link href="/" className="text-[10px] font-black uppercase tracking-[0.25em] text-[#a99b86] transition hover:text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>← Volver al inicio</Link>
        <h1 className="mt-4 font-display text-4xl uppercase leading-[0.95] tracking-tight sm:text-5xl">Invitá a tus vecinos</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-[#a99b86]">Compartí tu link y sumá puntos cuando alguien se una</p>
      </section>

      <div className="relative z-10 mx-auto max-w-lg px-4 py-8 text-center sm:px-6">

        {/* Invitar a un negocio -- disponible para cualquiera, sin cuenta. */}
        <div className="mb-6 rounded-[2rem] border border-white/10 bg-[#161314] p-6 text-left shadow-2xl">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 shrink-0 text-[var(--accent)]" />
            <p className="text-sm font-black text-white">¿Tu negocio favorito no está?</p>
          </div>
          <p className="mt-1 text-sm text-[#a99b86]">Avisale vos mismo por WhatsApp -- es gratis para el negocio y le lleva dos minutos sumarse.</p>
          <input
            value={nombreNegocio}
            onChange={(e) => setNombreNegocio(e.target.value)}
            placeholder="Nombre del negocio (opcional)"
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-[#7d6f5c] outline-none transition focus:border-[var(--accent)] focus:bg-white/10"
          />
          <button onClick={invitarNegocio} className="btn-hard mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3.5 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
            <MessageCircle className="h-4 w-4" /> Invitar por WhatsApp
          </button>
        </div>

        {!user ? (
          <div className="rounded-[2rem] border border-white/10 bg-[#161314] p-8 text-center shadow-2xl">
            <p className="mb-3 text-4xl">🔗</p>
            <p className="font-black text-white">¿Querés tu propio link de invitación y sumar puntos?</p>
            <p className="mt-1 text-sm text-[#a99b86]">Iniciá sesión para conseguirlo.</p>
            <Link href="/login" className="btn-hard mt-4 inline-block rounded-xl bg-[var(--accent)] px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>Ingresar →</Link>
          </div>
        ) : (
        <>
        <div className="rounded-[2.5rem] border border-white/10 bg-[#161314] p-8 shadow-2xl">
          <img src={qrUrl} alt="QR de invitación" className="mx-auto h-52 w-52 rounded-2xl bg-white p-3" />
          <p className="mt-5 break-all rounded-2xl border border-dashed border-[var(--accent)]/40 bg-[var(--accent)]/5 px-4 py-3 font-mono text-[11px] tracking-wide text-[#a99b86]">{link}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button onClick={compartir} className="btn-hard flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
              <Share2 className="h-4 w-4" /> Compartir
            </button>
            <button onClick={copiar} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:border-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>
              {copied ? <Check className="h-4 w-4 text-[var(--ok)]" /> : <Copy className="h-4 w-4" />}
              {copied ? "¡Copiado!" : "Copiar link"}
            </button>
          </div>
        </div>
        <div className="mt-6 rounded-[2rem] border border-white/10 bg-[#161314] p-6 text-left shadow-2xl">
          <p className="flex items-baseline justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>Tus referidos</span>
            <span className="shrink-0"><span className="magenta-glow font-display text-5xl leading-none tabular-nums text-[var(--accent)]">{activos}</span> <span className="text-[11px] font-bold uppercase tracking-widest text-[#7d6f5c]" style={{ fontFamily: "var(--font-display)" }}>activos</span> <span className="text-[11px] text-[#7d6f5c]">/ {total} totales</span></span>
          </p>
          <p className="mt-2 text-xs text-[#7d6f5c]">No damos descuentos financiados por la plataforma: los hitos se convierten en días Pro y visibilidad para tu negocio. Activo = completó el onboarding.</p>
          <div className="mt-4 space-y-2">
            {HITOS.map((h) => {
              const logrado = activos >= h.n;
              return (
                <div key={h.n} className={`flex items-center gap-3 rounded-xl border p-3 ${logrado ? "border-green-400/40 bg-green-500/10" : "border-white/10 bg-white/5"}`}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${logrado ? "bg-green-500 text-black" : "bg-white/10 text-[#7d6f5c]"}`}>
                    {logrado ? "✓" : h.n}
                  </span>
                  <p className={`text-xs ${logrado ? "text-green-200" : "text-[#a99b86]"}`}>{h.premio}</p>
                </div>
              );
            })}
          </div>
        </div>
        </>
        )}
      </div>
    </main>
  );
}
