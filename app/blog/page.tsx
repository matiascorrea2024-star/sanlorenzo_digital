import { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import PageHero from "@/components/ui/page-hero";

export const metadata: Metadata = {
  title: "Blog | La Gran Barata Digital — San Lorenzo",
  description: "Novedades, historias y noticias del comercio de San Lorenzo y el cordón industrial.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/blog" },
};

export default async function BlogPage() {
  const sb = await createClient();
  const { data: posts } = await sb.from("blog_posts")
    .select("id, title, slug, excerpt, cover_url, author, created_at")
    .eq("published", true).order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
      <PageHero title="📰 Blog" subtitle="Novedades del comercio local de San Lorenzo y el cordón industrial" />
      <div className="mx-auto max-w-4xl px-4 py-10">
        {!posts || posts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
            <Newspaper className="mx-auto h-10 w-10 text-white/20" />
            <p className="mt-3 text-sm text-white/40">Todavía no publicamos artículos. Volvé pronto.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((p: any) => (
              <Link key={p.id} href={`/blog/${p.slug}`}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-orange-400/40 hover:bg-white/[0.05]">
                {p.cover_url && (
                  <img src={p.cover_url} alt={p.title} className="mb-4 h-48 w-full rounded-xl object-cover" />
                )}
                <h2 className="text-xl font-black">{p.title}</h2>
                {p.excerpt && <p className="mt-1.5 text-sm text-white/60">{p.excerpt}</p>}
                <p className="mt-3 text-xs text-white/40">
                  {p.author && `${p.author} · `}{new Date(p.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
