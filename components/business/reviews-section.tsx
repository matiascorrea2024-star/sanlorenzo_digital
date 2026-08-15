"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, CheckCircle2, Camera, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { uploadReviewPhoto } from "@/lib/media";
import Avatar from "@/components/ui/avatar";

const MAX_FOTOS = 3;

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "hace instantes";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  if (s < 2592000) return `hace ${Math.floor(s / 86400)} días`;
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

function Stars({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} style={{ width: size, height: size }}
          className={i <= Math.round(n) ? "fill-yellow-400 text-yellow-400" : "text-white/20"} />
      ))}
    </span>
  );
}

export default function ReviewsSection({ businessId, baseRating = 0, baseCount = 0 }: {
  businessId: string; baseRating?: number; baseCount?: number;
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [myName, setMyName] = useState("");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase().from("business_reviews")
        .select("*").eq("business_id", businessId).order("created_at", { ascending: false });
      if (data) setReviews(data);
      const { data: { user } } = await supabase().auth.getUser();
      setUser(user);
      if (user) {
        const { data: prof } = await supabase().from("user_profiles").select("display_name").eq("user_id", user.id).maybeSingle();
        const n = prof?.display_name || (user.email || "").split("@")[0];
        setMyName(n); setName(n);
      }
    })();
  }, [businessId]);

  // Promedio combinado (base demo + reseñas reales)
  const realSum = reviews.reduce((a, r) => a + Number(r.rating), 0);
  const totalCount = baseCount + reviews.length;
  const avg = totalCount > 0 ? ((baseRating * baseCount) + realSum) / totalCount : 0;

  const send = async () => {
    if (!user) { router.push("/login"); return; }
    if (!comment.trim()) return;
    setSending(true);
    setError("");
    try {
      const photos = await Promise.all(fotos.map(f => uploadReviewPhoto(f, businessId)));
      const { error: err } = await supabase().from("business_reviews").insert({
        business_id: businessId,
        user_id: user.id,
        reviewer_name: name || myName,
        rating,
        comment: comment.trim(),
        photos,
      });
      if (!err) {
        setSent(true);
        setComment(""); setRating(5); setFotos([]);
        const { data } = await supabase().from("business_reviews")
          .select("*").eq("business_id", businessId).order("created_at", { ascending: false });
        if (data) setReviews(data);
        setTimeout(() => setSent(false), 3000);
      } else if (err.code === "23505") {
        setError("Ya dejaste una reseña para este negocio.");
      } else {
        setError("No se pudo enviar tu reseña. Probá de nuevo.");
      }
    } catch {
      setError("No se pudieron subir las fotos. Probá de nuevo.");
    }
    setSending(false);
  };

  const agregarFotos = (files: FileList | null) => {
    if (!files) return;
    setFotos(prev => [...prev, ...Array.from(files)].slice(0, MAX_FOTOS));
  };

  return (
    <section className="mt-10">
      <h2 className="text-xl font-black text-orange-400">⭐ Reseñas</h2>

      {/* Resumen */}
      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-5xl font-black">{avg ? avg.toFixed(1) : "—"}</p>
        <div>
          <Stars n={avg} size={20} />
          <p className="mt-1 text-xs text-white/50">{totalCount} reseña{totalCount !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="font-bold">¿Visitaste este negocio?</p>
        <div className="mt-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <button key={i} onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
              className="p-1 transition hover:scale-125">
              <Star className={`h-7 w-7 ${i <= (hover || rating) ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`} />
            </button>
          ))}
          <span className="ml-2 text-sm font-bold text-white/60">{rating}/5</span>
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
          placeholder="Contá tu experiencia..."
          className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-orange-400" />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {fotos.map((f, i) => (
            <div key={i} className="relative h-16 w-16 overflow-hidden rounded-xl border border-white/15">
              <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
              <button onClick={() => setFotos(prev => prev.filter((_, j) => j !== i))}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5">
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
          {fotos.length < MAX_FOTOS && (
            <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/20 text-white/40 hover:border-orange-400/50 hover:text-orange-400">
              <Camera className="h-5 w-5" />
              <span className="text-[9px] font-bold">{fotos.length}/{MAX_FOTOS}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => agregarFotos(e.target.files)} />
            </label>
          )}
        </div>

        <button onClick={send} disabled={sending || !comment.trim()}
          className="mt-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-2.5 text-sm font-black disabled:opacity-50">
          {sent ? "✅ ¡Gracias por tu reseña!" : sending ? "Enviando..." : "Publicar reseña"}
        </button>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>

      {/* Lista */}
      <div className="mt-6 space-y-4">
        {reviews.length === 0 && (
          <p className="text-sm text-white/40">Todavía no hay reseñas escritas. ¡Sé el primero!</p>
        )}
        {reviews.map(r => (
          <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <Avatar name={r.reviewer_name} size={40} />
              <div className="flex-1">
                <p className="flex items-center gap-2 font-bold">
                  {r.reviewer_name}
                  {r.verified_visit && (
                    <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-300">
                      <CheckCircle2 className="h-3 w-3" /> Visita verificada
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <Stars n={r.rating} size={13} />
                  <span className="text-[11px] text-white/40">{timeAgo(r.created_at)}</span>
                </div>
              </div>
            </div>
            {r.comment && <p className="mt-3 text-sm text-white/80">{r.comment}</p>}
            {r.photos?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {r.photos.map((url: string, i: number) => (
                  <button key={i} onClick={() => setLightbox(url)} className="h-20 w-20 overflow-hidden rounded-xl border border-white/10">
                    <img src={url} alt="Foto de la reseña" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {r.reply && (
              <div className="mt-3 rounded-xl border-l-4 border-orange-400 bg-orange-500/10 p-3">
                <p className="text-xs font-black text-orange-300">↳ Respuesta del negocio</p>
                <p className="mt-1 text-sm text-white/80">{r.reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {lightbox && (
        <div onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <img src={lightbox} alt="Foto de la reseña ampliada" className="max-h-[85vh] max-w-full rounded-xl object-contain" />
          <button onClick={() => setLightbox(null)} className="absolute right-5 top-5 rounded-full bg-white/10 p-2">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      )}
    </section>
  );
}
