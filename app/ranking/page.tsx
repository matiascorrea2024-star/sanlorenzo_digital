import { createClient } from "@/lib/supabase-server";
import RankingPage from "./client";
import RankingSwitch from "@/components/ui/ranking-switch";

export const revalidate = 60;

export default async function Page() {
  const sb = await createClient();
  const { data } = await sb
    .from("businesses")
    .select("*")
    .in("status", ["verificado", "reclamado"])
    .eq("activo", true)
    .limit(300);

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <RankingSwitch current="negocios" />
      </div>
      <RankingPage initial={data || []} />
    </>
  );
}
