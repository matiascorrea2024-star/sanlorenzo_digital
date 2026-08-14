"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Share2, Copy, Check } from "lucide-react";
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

  if (loading) return <main className="min-h-screen bg-[#0d0a12] flex items-center justify-center text-white/60 text-sm">Cargando…</main>;

  if (!user) {
    return (
      <main className="min-h-screen bg-[#0d0a12] text-white flex items-center justify-center px-4 text-center">
        <div>
          <p className="mb-4 text-5xl">🔗</p>
          <h1 className="text-2xl font-black">Invitá a tus vecinos</h1>
          <p className="mt-2 text-sm text-white/60">Iniciá sesión para conseguir tu link de invitación.</p>
          <Link href="/login" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-black">Ingresar →</Link>
        </div>
      </main>
    );
  }

  const link = `https://sanlorenzodigital.vercel.app/?ref=${user.id}`;
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

  return (
    <main className="min-h-screen bg-[#0d0a12] text-white pb-24">
      <PageHero title="🔗 Invitá a tus vecinos" subtitle="Compartí tu link y sumá puntos cuando alguien se una" />
      <div className="mx-auto max-w-lg px-4 py-8 text-center">
        <div className="rounded-3xl border border-orange-400/30 bg-gradient-to-br from-orange-500/10 to-pink-500/10 p-8">
          <img src={qrUrl} alt="QR de invitación" className="mx-auto h-52 w-52 rounded-2xl bg-white p-3" />
          <p className="mt-5 break-all rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-xs text-white/70">{link}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button onClick={compartir} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-black hover:opacity-90">
              <Share2 className="h-4 w-4" /> Compartir
            </button>
            <button onClick={copiar} className="flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-bold hover:bg-white/10">
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              {copied ? "¡Copiado!" : "Copiar link"}
            </button>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left">
          <p className="flex items-center justify-between font-black">
            <span>Tus referidos</span>
            <span className="text-orange-400">{activos} activos <span className="text-white/40 font-normal">/ {total} totales</span></span>
          </p>
          <p className="mt-1 text-xs text-white/40">Activo = la persona ya completó el onboarding, no solo se registró.</p>
          <div className="mt-4 space-y-2">
            {HITOS.map((h) => {
              const logrado = activos >= h.n;
              return (
                <div key={h.n} className={`flex items-center gap-3 rounded-xl border p-3 ${logrado ? "border-green-400/40 bg-green-500/10" : "border-white/10 bg-white/[0.02]"}`}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${logrado ? "bg-green-500 text-black" : "bg-white/10 text-white/50"}`}>
                    {logrado ? "✓" : h.n}
                  </span>
                  <p className={`text-xs ${logrado ? "text-green-200" : "text-white/60"}`}>{h.premio}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
