import { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import ParaVosClient from "./client";

export const metadata: Metadata = {
  title: "Para vos — La Gran Barata",
};

export const revalidate = 60;

export default async function Page() {
  const sb = await createClient();
  const { data: ofertas } = await sb
    .from("offers_with_business")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return <ParaVosClient ofertas={ofertas || []} />;
}
