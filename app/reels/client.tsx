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
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-4 text-center text-[var(--text)]">
        <div className="rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-8">
          <Video className="mx-auto mb-3 h-12 w-12 text-[var(--accent-ink)]" />
          <h1 className="font-display text-xl uppercase tracking-tight">Todavía no hay reels</h1>
          <p className="mt-1 max-w-xs text-sm text-[var(--muted)]">Los negocios todavía no subieron videos. Volvé pronto.</p>
          <Link href="/" className="btn-hard mt-6 inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>← Volver al inicio</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-[200] bg-[var(--bg)]">
      <h1 className="sr-only">Reels</h1>
      <Link href="/" aria-label="Volver" className="absolute left-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-strong)] bg-black/40 backdrop-blur transition hover:border-[var(--accent)]">
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
