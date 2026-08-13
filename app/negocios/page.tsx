import { getAllBusinesses } from "@/lib/directory";
import NegociosClient from "@/components/negocios-client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const list = await getAllBusinesses();
  return <NegociosClient initial={list} />;
}
