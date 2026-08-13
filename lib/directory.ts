import { BUSINESSES } from "./data";
import { getSupabaseServer } from "./supabase-server";

export async function getAllBusinesses(): Promise<any[]> {
  let db: any[] = [];
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb.from("businesses").select("*");
    db = data || [];
  } catch (e) {
    console.error("directory fetch error:", e);
  }
  const slugs = new Set(db.map((b) => b.slug));
  const seedBySlug = new Map(BUSINESSES.map((b) => [b.slug, b]));
  const dbFixed = db.map((b) => {
    const s: any = seedBySlug.get(b.slug);
    return s && s.latitude ? { ...b, latitude: s.latitude, longitude: s.longitude } : b;
  });
  return [...dbFixed, ...BUSINESSES.filter((b) => !slugs.has(b.slug))];
}
