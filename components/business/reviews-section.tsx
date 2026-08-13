"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Review = {
  id: string;
  rating: number;
  comment: string;
  user_email: string;
  user_id: string;
  created_at: string;
};

export default function ReviewsSection({ businessId }: { businessId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [user, setUser] = useState<any>(null);
  const [niveles, setNiveles] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase().auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase()
        .from("reviews")
        .select("*")
        .eq("business_id", businessId)
        .eq("approved", true)
        .order("created_at", { ascending: false });
      setReviews(data || []);
      const ids = [...new Set((data || []).map((r: any) => r.user_id).filter(Boolean))] as string[];
      if (ids.length > 0) {
        const map: Record<string, string> = {};
        const sb2 = supabase();
        for (const id of ids) {
          const { data: pts } = await sb2.rpc("nivel_usuario", { uid: id });
          const p = pts || 0;
          map[id] = p >= 600 ? "👑" : p >= 300 ? "🔎" : p >= 150 ? "🧭" : p >= 50 ? "🚶" : "🌱";
        }
        setNiveles(map);
      }
    })();
  }, [businessId]);

  const enviar = async () => {
    if (!user) {
      setMsg("⚠️ Iniciá sesión para dejar una reseña.");
      return;
    }
    if (!comment.trim()) {
      setMsg("⚠️ Escribí un comentario.");
      return;
    }
    setLoading(true);
    const { error } = await supabase().from("reviews").insert({
      business_id: businessId,
      user_id: user.id,
      user_email: user.email,
      rating,
      comment: comment.trim(),
    });
    setLoading(false);
    if (error) {
      setMsg("❌ " + error.message);
    } else {
      setMsg("✅ ¡Reseña enviada! Gracias por tu opinión.");
      setComment("");
      setRating(5);
      const { data } = await supabase()
        .from("reviews")
        .select("*")
        .eq("business_id", businessId)
        .eq("approved", true)
        .order("created_at", { ascending: false });
      setReviews(data || []);
    }
  };

  const promedio = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1) : "0.0";

  return (
    <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
      <h2 className="text-xl font-black text-orange-400 mb-4">⭐ Reseñas de clientes</h2>
      
      {reviews.length > 0 && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-400/30 p-4 text-center">
          <p className="text-4xl font-black text-orange-400">{promedio}</p>
          <p className="text-sm text-white/60">{reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"}</p>
          <div className="mt-2 flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={i <= Math.round(Number(promedio)) ? "text-orange-400" : "text-white/20"}>★</span>
            ))}
          </div>
        </div>
      )}

      {/* Formulario */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-bold mb-2">Dejá tu reseña</p>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm text-white/60">Rating:</span>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              onClick={() => setRating(i)}
              className={`text-2xl transition ${i <= rating ? "text-orange-400" : "text-white/20"}`}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Contá tu experiencia con este negocio..."
          rows={3}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-orange-400"
        />
        <button
          onClick={enviar}
          disabled={loading}
          className="mt-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-black hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar reseña"}
        </button>
        {msg && <p className="mt-2 text-sm">{msg}</p>}
        {!user && (
          <p className="mt-2 text-xs text-white/50">
            💡 <a href="/login" className="text-orange-400 hover:underline">Iniciá sesión</a> para dejar una reseña.
          </p>
        )}
      </div>

      {/* Lista de reseñas */}
      {reviews.length === 0 ? (
        <p className="text-center text-sm text-white/50 py-6">Todavía no hay reseñas. ¡Sé el primero!</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-orange-400">{"★".repeat(r.rating || 5)}</span>
                  <span className="text-white/30">{"★".repeat(5 - (r.rating || 5))}</span>
                </div>
                <span className="text-xs text-white/40">
                  {new Date(r.created_at).toLocaleDateString("es-AR")}
                </span>
              </div>
              <p className="text-sm text-white/80">{r.comment}</p>
              <p className="mt-1 text-xs text-white/40">{niveles[r.user_id] || "🌱"} — {(r.user_email || "vecino").split("@")[0]}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
