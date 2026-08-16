"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Video } from "lucide-react";
import ReelCard from "@/components/reels/reel-card";

type Reel = {
  id: string;
  video_url: string;
  caption: string | null;
  likes_count: number;
  comments_count: number;
  businesses: { name: string; slug: string; category: string; logo_url: string | null } | null;
};

export default function ReelsFeedClient({ initial }: { initial: Reel[] }) {
  const [activeId, setActiveId] = useState<string | null>(initial[0]?.id || null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get("id");

  useEffect(() => {
    if (!deepLinkId || !containerRef.current) return;
    const el = containerRef.current.querySelector(`[data-reel-id="${deepLinkId}"]`);
    el?.scrollIntoView({ block: "start" });
  }, [deepLinkId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.getAttribute("data-reel-id"));
        });
      },
      { root: container, threshold: 0.6 }
    );
    container.querySelectorAll("[data-reel-id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [initial]);

  if (initial.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center text-white">
        <Video className="mb-3 h-12 w-12 text-white/30" />
        <p className="font-black">Todavía no hay reels</p>
        <p className="mt-1 max-w-xs text-sm text-white/50">Los negocios todavía no subieron videos. Volvé pronto.</p>
        <Link href="/" className="mt-6 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-2.5 text-sm font-black">← Volver al inicio</Link>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-[200] bg-black">
      <Link href="/" aria-label="Volver" className="absolute left-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur">
        <ArrowLeft className="h-4 w-4 text-white" />
      </Link>
      <div ref={containerRef} className="sld-no-scrollbar h-full w-full snap-y snap-mandatory overflow-y-scroll">
        {initial.map((r) => (
          <div key={r.id} data-reel-id={r.id} className="h-full w-full snap-start">
            <ReelCard reel={r} active={activeId === r.id} />
          </div>
        ))}
      </div>
    </main>
  );
}
