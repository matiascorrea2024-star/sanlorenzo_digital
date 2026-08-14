import { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import RankingClient from "./client";

export const metadata: Metadata = {
  title: "Ranking de negocios de San Lorenzo | La Gran Barata Digital",
  description: "Descubrí negocios, ofertas y oportunidades de San Lorenzo, Santa Fe.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/ranking" },
};

export default async function Page() {
  const sb = await createClient();
  const { data } = await sb
    .from("business_leagues")
    .select("id, name, slug, category, rating, puntos, seguidores, ofertas, status")
    .order("puntos", { ascending: false })
    .limit(50);
  const initial = data || [];

  return <RankingClient initial={initial} />;
}
