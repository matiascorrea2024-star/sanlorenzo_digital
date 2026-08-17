"use client";
import { useEffect, useState } from "react";
import { Bell, Share2, Store, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { subscribeToPush } from "@/lib/push";

type Biz = { id: string; name: string; category: string; portada_url?: string; logo_url?: string };

export default function OnboardingOverlay() {
  const [user, setUser] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(1);
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [notifStatus, setNotifStatus] = useState<string>("default");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase().from("user_profiles").select("onboarding_completed").eq("user_id", user.id).maybeSingle();
      if (prof && prof.onboarding_completed === false) {
        setUser(user);
        setShow(true);
        const { data: biz } = await supabase().from("businesses").select("id, name, category, portada_url, logo_url")
          .eq("published", true).order("created_at", { ascending: false }).limit(12);
        setBusinesses(biz || []);
      }
      if (typeof Notification !== "undefined") setNotifStatus(Notification.permission);
    })();
  }, []);

  if (!show || !user) return null;

  const toggleFollow = async (bizId: string) => {
    const sb = supabase();
    if (followed.has(bizId)) {
      await sb.from("followers").delete().eq("user_id", user.id).eq("business_id", bizId);
      setFollowed((prev) => { const n = new Set(prev); n.delete(bizId); return n; });
    } else {
      await sb.from("followers").insert({ user_id: user.id, business_id: bizId });
      setFollowed((prev) => new Set(prev).add(bizId));
    }
  };

  const askNotifications = async () => {
    if (typeof Notification === "undefined") { setStep(3); return; }
    const perm = await Notification.requestPermission();
    setNotifStatus(perm);
    await supabase().from("user_profiles").update({ notifications_opt_in: perm === "granted" }).eq("user_id", user.id);
    if (perm === "granted") await subscribeToPush(user.id);
  };

  const finish = async () => {
    await supabase().from("user_profiles").update({ onboarding_completed: true }).eq("user_id", user.id);
    setShow(false);
  };

  const link = `https://sanlorenzodigital.vercel.app/?ref=${user.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="relative w-full max-w-md rounded-t-3xl border border-white/10 bg-[#141018] p-6 sm:rounded-3xl">
        <button onClick={finish} aria-label="Cerrar" className="absolute right-4 top-4 rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex items-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-gradient-to-r from-orange-500 to-pink-500" : "bg-white/10"}`} />
          ))}
        </div>

        {step === 1 && (
          <>
            <Store className="h-8 w-8 text-orange-400" />
            <h2 className="mt-3 text-xl font-black text-white">Seguí 5 negocios</h2>
            <p className="mt-1 text-sm text-white/60">Así te avisamos cuando publiquen ofertas nuevas.</p>
            <div className="mt-4 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">
              {businesses.map((b) => {
                const on = followed.has(b.id);
                return (
                  <button key={b.id} onClick={() => toggleFollow(b.id)}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-bold transition ${on ? "border-orange-400/60 bg-orange-500/15 text-orange-200" : "border-white/10 bg-white/5 text-white/80 hover:border-white/25"}`}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[10px]">{b.name[0]}</span>
                    <span className="min-w-0 flex-1 truncate">{b.name}</span>
                    {on && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
              {businesses.length === 0 && <p className="col-span-2 py-6 text-center text-xs text-white/40">Todavía no hay negocios para sugerir.</p>}
            </div>
            <button onClick={() => setStep(2)} className="mt-5 w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-3 text-sm font-black text-white hover:opacity-90">
              Siguiente ({followed.size} seguidos)
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <Bell className="h-8 w-8 text-orange-400" />
            <h2 className="mt-3 text-xl font-black text-white">Activá notificaciones</h2>
            <p className="mt-1 text-sm text-white/60">Te avisamos de ofertas cerca tuyo apenas se publiquen (nunca spam por mail).</p>
            {notifStatus === "granted" ? (
              <p className="mt-4 rounded-xl border border-green-400/30 bg-green-500/10 p-3 text-sm text-green-300">✅ Notificaciones activadas</p>
            ) : (
              <button onClick={askNotifications} className="mt-4 w-full rounded-xl border border-orange-400/40 bg-orange-500/10 py-3 text-sm font-black text-orange-300 hover:bg-orange-500/20">
                🔔 Activar notificaciones
              </button>
            )}
            <button onClick={() => setStep(3)} className="mt-3 w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-3 text-sm font-black text-white hover:opacity-90">
              Siguiente
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <Share2 className="h-8 w-8 text-orange-400" />
            <h2 className="mt-3 text-xl font-black text-white">Compartí tu perfil</h2>
            <p className="mt-1 text-sm text-white/60">Invitá a tus vecinos a descubrir San Lorenzo.</p>
            <img src={qrUrl} alt="QR de invitación" className="mx-auto mt-4 h-36 w-36 rounded-xl bg-white p-2" />
            <button
              onClick={async () => {
                if (navigator.share) { try { await navigator.share({ title: "La Gran Barata Digital", url: link }); } catch {} }
                else { await navigator.clipboard.writeText(link); }
              }}
              className="mt-4 w-full rounded-xl border border-white/20 py-3 text-sm font-bold text-white hover:bg-white/10"
            >
              Compartir mi link
            </button>
            <button onClick={finish} className="mt-3 w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-3 text-sm font-black text-white hover:opacity-90">
              ¡Listo, empezar! 🎉
            </button>
          </>
        )}
      </div>
    </div>
  );
}
