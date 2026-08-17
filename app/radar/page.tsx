import { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { hoyArgentina } from "@/lib/fecha-ar";
import RadarClient from "./client";

export const metadata: Metadata = {
  title: "Radar: ofertas que terminan hoy | La Gran Barata Digital",
  description: "Descubrí negocios, ofertas y oportunidades de San Lorenzo, Santa Fe.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/radar" },
};

export default async function Page() {
  const sb = await createClient();
  const hoy = hoyArgentina();
    const { data } = await sb
      .from("offers_with_business")
      .select("*")
      .eq("active", true)
      .eq("valid_until", hoy)
      .limit(30);
  const initial = data || [];

  return <RadarClient initial={initial} />;
}
