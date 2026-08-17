"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Share2, Copy, Check, Store, MessageCircle } from "lucide-react";
import PageHero from "@/components/ui/page-hero";
import { supabase } from "@/lib/supabase";

const HITOS = [
  { n: 3, premio: "Tu negocio aparece como \"Nuevo\" destacado 3 días" },
  { n: 10, premio: "1 mes de Plan PRO gratis" },
  { n: 25, premio: "\"Negocio Destacado del Mes\" (posición fija en home)" },
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

  if (loading) return <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--muted)] text-sm">Cargando…</main>;

  const link = user ? `https://sanlorenzodigital.vercel.app/?ref=${user.id}` : "";
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
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <PageHero title="Invitá a tus vecinos" subtitle="Compartí tu link y sumá puntos cuando alguien se una" />
      <div className="mx-auto max-w-lg px-4 py-8 text-center">

        {/* Invitar a un negocio -- disponible para cualquiera, sin cuenta. */}
        <div className="mb-6 rounded-[1.75rem] border border-red-400/25 bg-gradient-to-br from-red-600/[.08] to-orange-500/[.04] p-1.5 text-left">
          <div className="rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 shrink-0 text-orange-400" />
              <p className="font-black">¿Tu negocio favorito no está?</p>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">Avisale vos mismo por WhatsApp -- es gratis para el negocio y le lleva dos minutos sumarse.</p>
            <input
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
              placeholder="Nombre del negocio (opcional)"
              className="mt-4 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-06)] px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-orange-400/60"
            />
            <button onClick={invitarNegocio} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-3 text-sm font-black hover:opacity-90">
              <MessageCircle className="h-4 w-4" /> Invitar por WhatsApp
            </button>
          </div>
        </div>

        {!user ? (
          <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-8 text-center">
            <p className="mb-3 text-4xl">🔗</p>
            <p className="font-black">¿Querés tu propio link de invitación y sumar puntos?</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Iniciá sesión para conseguirlo.</p>
            <Link href="/login" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-sm font-black">Ingresar →</Link>
          </div>
        ) : (
        <>
        <div className="rounded-[1.75rem] border border-orange-400/25 bg-gradient-to-br from-orange-500/[.08] to-red-600/[.04] p-1.5">
          <div className="rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] p-8 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
            <img src={qrUrl} alt="QR de invitación" className="mx-auto h-52 w-52 rounded-2xl bg-white p-3" />
            <p className="mt-5 break-all rounded-xl border border-[var(--line)] bg-[var(--card-inner)] px-4 py-3 text-xs text-[var(--text)]/70">{link}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button onClick={compartir} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-black hover:opacity-90">
                <Share2 className="h-4 w-4" /> Compartir
              </button>
              <button onClick={copiar} className="flex items-center gap-2 rounded-full border border-[var(--line-strong)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--ov-10)]">
                {copied ? <Check className="h-4 w-4 text-[var(--ok)]" /> : <Copy className="h-4 w-4" />}
                {copied ? "¡Copiado!" : "Copiar link"}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5 text-left">
          <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
            <p className="flex items-center justify-between font-black">
              <span>Tus referidos</span>
              <span className="text-orange-400">{activos} activos <span className="text-[var(--muted2)] font-normal">/ {total} totales</span></span>
            </p>
            <p className="mt-1 text-xs text-[var(--muted2)]">Activo = la persona ya completó el onboarding, no solo se registró.</p>
            <div className="mt-4 space-y-2">
              {HITOS.map((h) => {
                const logrado = activos >= h.n;
                return (
                  <div key={h.n} className={`flex items-center gap-3 rounded-xl border p-3 ${logrado ? "border-green-400/40 bg-green-500/10" : "border-[var(--line)] bg-[var(--ov-02)]"}`}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${logrado ? "bg-green-500 text-black" : "bg-[var(--ov-10)] text-[var(--muted)]"}`}>
                      {logrado ? "✓" : h.n}
                    </span>
                    <p className={`text-xs ${logrado ? "text-green-200" : "text-[var(--muted)]"}`}>{h.premio}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </main>
  );
}
