import { getAllBusinesses } from "@/lib/directory";
import MapClient from "@/components/map/map-client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const list = (await getAllBusinesses()).filter((b) => b.latitude && b.longitude);
  return <MapClient businesses={list} />;
}
