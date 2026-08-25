import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
    <main className="min-h-screen bg-[#0c0a0b] text-[#f7f3ec] pb-24">
      <PageHero title="Blog" subtitle="Novedades del comercio local de San Lorenzo y el cordón industrial" />
      <div className="mx-auto max-w-4xl px-4 py-10">
        {!posts || posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-[#161314] p-12 text-center">
            <Newspaper className="mx-auto h-10 w-10 text-[#7d6f5c]" />
            <p className="mt-3 text-sm text-[#a99b86]">Todavía no publicamos artículos. Volvé pronto.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((p: any) => (
              <Link key={p.id} href={`/blog/${p.slug}`}
                className="group block rounded-[2rem] border border-white/5 bg-[#161314] p-5 transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)]">
                {p.cover_url && (
                  <div className="relative mb-4 h-48 w-full overflow-hidden rounded-[1.25rem] border border-white/5">
                    <Image src={p.cover_url} alt={p.title} fill sizes="(max-width: 768px) 100vw, 768px" quality={90}
                      className="object-cover transition duration-700 group-hover:scale-105" />
                  </div>
                )}
                <h2 className="font-display text-xl uppercase tracking-tight">{p.title}</h2>
                {p.excerpt && <p className="mt-1.5 text-sm text-[#a99b86]">{p.excerpt}</p>}
                <p className="mt-3 text-xs uppercase tracking-widest text-[#7d6f5c]">
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
