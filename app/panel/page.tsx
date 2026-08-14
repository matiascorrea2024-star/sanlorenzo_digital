import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  redirect("/dashboard");
}
