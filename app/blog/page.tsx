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
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <PageHero title="Blog" subtitle="Novedades del comercio local de San Lorenzo y el cordón industrial" />
      <div className="mx-auto max-w-4xl px-4 py-10">
        {!posts || posts.length === 0 ? (
          <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
            <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-12 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <Newspaper className="mx-auto h-10 w-10 text-[var(--muted2)]" />
              <p className="mt-3 text-sm text-[var(--muted2)]">Todavía no publicamos artículos. Volvé pronto.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((p: any) => (
              <Link key={p.id} href={`/blog/${p.slug}`}
                className="group block rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5">
                <div className="overflow-hidden rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)] transition-colors group-hover:border-orange-400/30">
                  {p.cover_url && (
                    <div className="relative mb-4 h-48 w-full overflow-hidden rounded-[1rem]">
                      <Image src={p.cover_url} alt={p.title} fill sizes="(max-width: 768px) 100vw, 768px" quality={90}
                        className="object-cover transition duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <h2 className="text-xl font-black">{p.title}</h2>
                  {p.excerpt && <p className="mt-1.5 text-sm text-[var(--muted)]">{p.excerpt}</p>}
                  <p className="mt-3 text-xs text-[var(--muted2)]">
                    {p.author && `${p.author} · `}{new Date(p.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
