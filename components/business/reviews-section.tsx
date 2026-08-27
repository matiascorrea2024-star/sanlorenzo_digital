"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
          className={i <= Math.round(n) ? "fill-amber-400 text-amber-400" : "text-[var(--ov-20)]"} />
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
  const [mostrar, setMostrar] = useState(10);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

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
      <h2 className="text-xl font-black text-[var(--accent)]">⭐ Reseñas</h2>

      {/* Resumen -- solo si hay al menos una reseña real: un "—" gigante en
          text-5xl con 0 reseñas se veía como una barra blanca rota, no como
          un puntaje vacío. Con 0 reseñas alcanza con el mensaje de la lista
          de abajo (evita además duplicar el mismo estado vacío dos veces). */}
      {totalCount > 0 && (
        <div className="mt-4 flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-5">
          <p className="text-5xl font-black">{avg.toFixed(1)}</p>
          <div>
            <Stars n={avg} size={20} />
            <p className="mt-1 text-xs text-[var(--muted)]">{totalCount} reseña{totalCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
      )}

      {/* Formulario */}
      <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-5">
        <p className="font-bold">¿Visitaste este negocio?</p>
        <div className="mt-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <button key={i} onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
              className="p-1 transition hover:scale-125">
              <Star className={`h-7 w-7 ${i <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-[var(--ov-20)]"}`} />
            </button>
          ))}
          <span className="ml-2 text-sm font-bold text-[var(--muted)]">{rating}/5</span>
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
          placeholder="Contá tu experiencia..."
          className="mt-3 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]" />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {fotos.map((f, i) => (
            <div key={i} className="relative h-16 w-16 overflow-hidden rounded-xl border border-[var(--line-strong)]">
              <img src={URL.createObjectURL(f)} alt={`Foto nueva: ${f.name}`} className="h-full w-full object-cover" />
              <button onClick={() => setFotos(prev => prev.filter((_, j) => j !== i))}
                aria-label="Quitar foto" title="Quitar foto"
                className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5">
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
          {fotos.length < MAX_FOTOS && (
            <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--line-strong)] text-[var(--muted2)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]">
              <Camera className="h-5 w-5" />
              <span className="text-[9px] font-bold">{fotos.length}/{MAX_FOTOS}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => agregarFotos(e.target.files)} />
            </label>
          )}
        </div>

        <button onClick={send} disabled={sending || !comment.trim()}
          className="mt-3 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-black disabled:opacity-50">
          {sent ? "✅ ¡Gracias por tu reseña!" : sending ? "Enviando..." : "Publicar reseña"}
        </button>
        {!sending && !sent && !comment.trim() && (
          <p className="mt-2 text-xs text-[var(--muted2)]">Contá tu experiencia arriba para poder publicar.</p>
        )}
        {error && <p className="mt-2 text-xs text-[var(--bad)]">{error}</p>}
      </div>

      {/* Lista */}
      <div className="mt-6 space-y-4">
        {reviews.length === 0 && (
          <p className="text-sm text-[var(--muted2)]">Todavía no hay reseñas escritas. ¡Sé el primero!</p>
        )}
        {reviews.slice(0, mostrar).map(r => (
          <div key={r.id} className="rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-5">
            <div className="flex items-center gap-3">
              <Avatar name={r.reviewer_name} size={40} />
              <div className="flex-1">
                <p className="flex items-center gap-2 font-bold">
                  {r.reviewer_name}
                  {r.verified_visit && (
                    <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-[var(--ok)]">
                      <CheckCircle2 className="h-3 w-3" /> Visita verificada
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <Stars n={r.rating} size={13} />
                  <span className="text-[11px] text-[var(--muted2)]">{timeAgo(r.created_at)}</span>
                </div>
              </div>
            </div>
            {r.comment && <p className="mt-3 text-sm text-[var(--text)]/80">{r.comment}</p>}
            {r.photos?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {r.photos.map((url: string, i: number) => (
                  <button key={i} onClick={() => setLightbox(url)} className="relative h-20 w-20 overflow-hidden rounded-xl border border-[var(--line)]">
                    <Image src={url} alt="Foto de la reseña" fill sizes="80px" quality={85} className="object-cover" />
                  </button>
                ))}
              </div>
            )}
            {r.reply && (
              <div className="mt-3 rounded-xl border-l-4 border-[var(--accent)] bg-[var(--accent)]/10 p-3">
                <p className="text-xs font-black text-[var(--accent)]">↳ Respuesta del negocio</p>
                <p className="mt-1 text-sm text-[var(--text)]/80">{r.reply}</p>
              </div>
            )}
          </div>
        ))}
        {reviews.length > mostrar && (
          <button onClick={() => setMostrar(m => m + 10)}
            className="w-full rounded-xl border border-[var(--line-strong)] py-2.5 text-sm font-bold text-[var(--muted)] hover:bg-[var(--ov-05)]">
            Ver más reseñas ({reviews.length - mostrar} más)
          </button>
        )}
      </div>

      {lightbox && (
        <div onClick={() => setLightbox(null)} role="dialog" aria-modal="true" aria-label="Foto de la reseña ampliada"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <img src={lightbox} alt="Foto de la reseña ampliada" className="max-h-[85vh] max-w-full rounded-xl object-contain" />
          <button onClick={() => setLightbox(null)} aria-label="Cerrar" title="Cerrar" className="absolute right-5 top-5 rounded-full bg-[var(--ov-10)] p-2">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      )}
    </section>
  );
}
