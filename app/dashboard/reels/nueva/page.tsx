"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import HowItWorks from "@/components/ui/how-it-works";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";
import { uploadReelVideo, REEL_MAX_SECONDS, REEL_MAX_MB } from "@/lib/media";
import { Video, Loader2 } from "lucide-react";

export default function NuevoReelPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { show } = useToast();
  const [negocios, setNegocios] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      supabase().from("businesses").select("id, name").eq("owner_id", user.id).then(({ data }) => {
        if (data) { setNegocios(data); if (data[0]) setBusinessId(data[0].id); }
      });
    }
  }, [user]);

  const elegirArchivo = (f: File | null) => {
    setError("");
    if (preview) URL.revokeObjectURL(preview);
    if (!f) { setFile(null); setPreview(""); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const publicar = async () => {
    if (!file || !businessId) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadReelVideo(file, businessId);
      const { error: insErr } = await supabase().from("reels").insert({
        business_id: businessId,
        video_url: url,
        caption: caption.trim() || null,
      });
      if (insErr) throw insErr;
      show("🎬 Reel publicado", "success");
      router.push("/dashboard/reels");
    } catch (e: unknown) {
      setError(friendlyError(e, "No se pudo subir el reel. Probá de nuevo."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0c0a0b] text-white pb-24">
      <div className="mx-auto max-w-2xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <DashboardNav />
        <div className="mb-8 flex items-start gap-3">
          <Video className="mt-1 h-8 w-8 shrink-0 text-orange-400" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.4em] text-orange-400">Video corto</p>
            <h1 className="mt-2 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-space)" }}>Nuevo reel</h1>
            <p className="mt-3 text-white/50">Un video corto de tu negocio, hasta {REEL_MAX_SECONDS} segundos.</p>
          </div>
        </div>

        <HowItWorks steps={[
          `Grabá o elegí un video de hasta ${REEL_MAX_SECONDS} segundos (máx. ${REEL_MAX_MB}MB).`,
          "Sumale un texto corto contando qué es -- se muestra abajo del video.",
          "Se publica al instante en /reels y en la home, con reacciones, comentarios y para compartir.",
        ]} />

        <div className="mt-6 rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
          <div className="space-y-4 rounded-[1.375rem] border border-white/[.05] bg-black/10 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
            {negocios.length > 1 && (
              <select value={businessId} onChange={(e) => setBusinessId(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-orange-400">
                {negocios.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            )}

            {preview ? (
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
                <video src={preview} controls playsInline className="max-h-96 w-full" />
                <button onClick={() => elegirArchivo(null)}
                  className="absolute right-2 top-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-bold text-white hover:bg-black/90">
                  Quitar
                </button>
              </div>
            ) : (
              <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[.03] text-white/50 transition hover:border-orange-400/60 hover:text-white">
                <Video className="h-7 w-7" />
                <span className="text-sm font-bold">Elegir video</span>
                <span className="text-xs text-white/30">Hasta {REEL_MAX_SECONDS}s · máx. {REEL_MAX_MB}MB</span>
                <input type="file" accept="video/*" className="hidden" onChange={(e) => elegirArchivo(e.target.files?.[0] || null)} />
              </label>
            )}

            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} maxLength={200}
              placeholder="Contá qué muestra el video..."
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-orange-400" />

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-sm font-bold text-red-300">❌ {error}</p>
              </div>
            )}

            <button onClick={publicar} disabled={uploading || !file || !businessId}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 py-3 text-sm font-black disabled:opacity-50">
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo...</> : "🎬 Publicar Reel"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
