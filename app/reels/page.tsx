import { Suspense } from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import ReelsFeedClient from "./client";

export const metadata: Metadata = {
  title: "Reels | La Gran Barata Digital",
  description: "Los negocios de San Lorenzo muestran lo que venden, en video.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/reels" },
};

export default async function ReelsPage() {
  const sb = await createClient();
  const { data } = await sb
    .from("reels")
    .select("id, video_url, caption, likes_count, comments_count, businesses(name, slug, category, logo_url), reel_products(id, product_id, offer_id, label, timecode_seconds, products(name), offers(id, title))")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <Suspense fallback={<main className="fixed inset-0 z-[200] bg-[var(--bg)]" />}>
      <ReelsFeedClient initial={(data as any[]) || []} />
    </Suspense>
  );
}
