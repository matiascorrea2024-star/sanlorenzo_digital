"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Share2, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/lib/supabase";
import RankedAvatar from "@/components/ui/ranked-avatar";
import ReelComments from "@/components/reels/reel-comments";

type ReelTag = {
  id: string;
  product_id: string | null;
  offer_id: string | null;
  label: string | null;
  timecode_seconds: number;
  products: { name: string } | null;
  offers: { id: string; title: string } | null;
};

type Reel = {
  id: string;
  video_url: string;
  caption: string | null;
  likes_count: number;
  comments_count: number;
  businesses: { name: string; slug: string; category: string; logo_url: string | null } | null;
  reel_products?: ReelTag[] | null;
};

export default function ReelCard({ reel, active }: { reel: Reel; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(reel.likes_count);
  const [comments, setComments] = useState(reel.comments_count);
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);
  const countedView = useRef(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [tagVisible, setTagVisible] = useState<ReelTag | null>(null);
  const tags = (reel.reel_products || []).slice().sort((a, b) => a.timecode_seconds - b.timecode_seconds);

  useEffect(() => {
    supabase().auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  useEffect(() => {
    if (!userId) { setLiked(false); return; }
    supabase().from("reel_likes").select("reel_id").eq("reel_id", reel.id).eq("user_id", userId).maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [userId, reel.id]);

  // Solo el reel activo (en pantalla) reproduce -- el resto queda pausado
  // en el primer cuadro, así no se gasta batería/datos de fondo.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.play().catch(() => {});
      if (!countedView.current) {
        countedView.current = true;
        supabase().rpc("increment_reel_view", { p_reel_id: reel.id });
      }
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [active, reel.id]);

  const toggleLike = async () => {
    if (!userId || liking) { if (!userId) window.location.href = "/login"; return; }
    setLiking(true);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes((n) => n + (nextLiked ? 1 : -1));
    // Antes esto solo revertía con una excepción de red (throw) -- un
    // error real de Supabase (RLS, etc.) viene en {error}, no lanza, y
    // el optimistic UI se quedaba mal para siempre.
    const { error } = nextLiked
      ? await supabase().from("reel_likes").insert({ reel_id: reel.id, user_id: userId })
      : await supabase().from("reel_likes").delete().eq("reel_id", reel.id).eq("user_id", userId);
    if (error) {
      setLiked(!nextLiked);
      setLikes((n) => n - (nextLiked ? 1 : -1));
    }
    setLiking(false);
  };

  const irAEtiqueta = (tag: ReelTag) => {
    fetch("/api/reels/tags/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag_id: tag.id }),
    }).catch(() => {});
    if (tag.offer_id) window.location.href = `/oferta/${tag.offer_id}`;
    else if (reel.businesses?.slug) window.location.href = `/negocio/${reel.businesses.slug}`;
  };

  const share = async () => {
    const url = `${window.location.origin}/reels?id=${reel.id}`;
    const text = `Mirá este video de ${reel.businesses?.name} en La Gran Barata Digital`;
    if (navigator.share) {
      try { await navigator.share({ title: text, url }); } catch {}
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={reel.video_url}
        className="h-full w-full object-contain"
        loop
        playsInline
        muted={muted}
        preload="metadata"
        onClick={() => setMuted((m) => !m)}
        onTimeUpdate={(e) => {
          if (tags.length === 0) return;
          const t = e.currentTarget.currentTime;
          const actual = [...tags].reverse().find((tag) => t >= tag.timecode_seconds);
          setTagVisible(actual || null);
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

      {tagVisible && (
        <button
          onClick={() => irAEtiqueta(tagVisible)}
          className="absolute left-4 top-16 flex max-w-[75%] items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur transition active:scale-95"
        >
          🏷️ <span className="truncate">{tagVisible.label || tagVisible.products?.name || tagVisible.offers?.title || "Ver más"}</span>
        </button>
      )}

      <button
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Activar sonido" : "Silenciar"}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur"
      >
        {muted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
      </button>

      <div className="absolute bottom-5 left-4 right-16">
        {reel.businesses && (
          <Link href={`/negocio/${reel.businesses.slug}`} className="mb-2 inline-flex items-center gap-2">
            <RankedAvatar slug={reel.businesses.slug} name={reel.businesses.name} categoria={reel.businesses.category} photoUrl={reel.businesses.logo_url} size={36} />
            <span className="text-sm font-black text-white drop-shadow">{reel.businesses.name}</span>
          </Link>
        )}
        {reel.caption && <p className="text-sm text-white/90 drop-shadow line-clamp-2">{reel.caption}</p>}
      </div>

      <div className="absolute bottom-5 right-3 flex flex-col items-center gap-4">
        <button onClick={toggleLike} disabled={liking} aria-label={liked ? "Quitar me gusta" : "Me gusta"} className="flex flex-col items-center gap-1 disabled:opacity-60">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur transition active:scale-90">
            <Heart className={`h-5 w-5 ${liked ? "fill-red-500 text-red-500" : "text-white"}`} />
          </span>
          <span className="text-[11px] font-bold text-white drop-shadow tabular-nums">{likes}</span>
        </button>
        <button onClick={() => setShowComments(true)} aria-label="Comentarios" className="flex flex-col items-center gap-1">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur transition active:scale-90">
            <MessageCircle className="h-5 w-5 text-white" />
          </span>
          <span className="text-[11px] font-bold text-white drop-shadow tabular-nums">{comments}</span>
        </button>
        <button onClick={share} aria-label="Compartir" className="flex flex-col items-center gap-1">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur transition active:scale-90">
            <Share2 className="h-5 w-5 text-white" />
          </span>
        </button>
      </div>

      {showComments && (
        <ReelComments reelId={reel.id} onClose={() => setShowComments(false)} onCommentAdded={() => setComments((n) => n + 1)} />
      )}
    </div>
  );
}
