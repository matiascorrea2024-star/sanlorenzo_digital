"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ReviewsSection({ reviews, businessId }: { reviews: any[]; businessId?: number }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!name.trim() || !comment.trim()) { setErr("Completá tu nombre y tu opinión"); return; }
    const { error } = await supabase().from("reviews").insert({ business_id: businessId, author_name: name.trim(), rating, comment: comment.trim(), status: "pending" });
    if (error) { setErr(error.message); return; }
    setSent(true); setName(""); setComment(""); setRating(5);
  };
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-lg font-bold" style={{ fontFamily: "var(--font-space)" }}>⭐ Opiniones</h2>
      {reviews.length === 0 && <p className="text-sm text-[var(--muted)]">Todavía no hay opiniones publicadas. ¡Sé el primero!</p>}
      <div className="grid gap-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{r.author_name}</p>
              <span className="text-sm text-[var(--warn)]">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">{r.comment}</p>
          </div>
        ))}
      </div>
      {businessId && (
        <form onSubmit={submit} className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="mb-3 text-sm font-semibold">Dejá tu opinión</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre"
              className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
            <div className="flex items-center gap-1 text-xl">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)} className={n <= rating ? "text-[var(--warn)]" : "text-[var(--line)]"}>★</button>
              ))}
            </div>
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="¿Cómo te atendieron? ¿Qué compraste?"
            className="mt-3 w-full resize-none rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
          <div className="mt-3 flex items-center gap-3">
            <button className="rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90">Enviar opinión</button>
            {sent && <span className="text-sm text-[var(--ok)]">✅ ¡Gracias! El comercio la revisa y la publica.</span>}
            {err && <span className="text-sm text-[var(--bad)]">{err}</span>}
          </div>
        </form>
      )}
    </section>
  );
}
