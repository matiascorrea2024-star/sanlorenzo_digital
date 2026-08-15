import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sb = await createClient();
  const { data } = await sb.from("blog_posts").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  if (!data) return { title: "Artículo no encontrado | La Gran Barata Digital" };
  return {
    title: `${data.title} | Blog — La Gran Barata Digital`,
    description: data.excerpt || data.title,
    openGraph: {
      title: data.title,
      description: data.excerpt || "",
      type: "article",
      locale: "es_AR",
      images: data.cover_url ? [{ url: data.cover_url }] : undefined,
    },
    alternates: { canonical: `https://sanlorenzodigital.vercel.app/blog/${slug}` },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();
  const { data: post } = await sb.from("blog_posts").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-[#0a0710] text-white pb-24">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link href="/blog" className="text-sm text-orange-400 hover:text-orange-300">← Volver al blog</Link>
        {post.cover_url && (
          <img src={post.cover_url} alt={post.title} className="mt-5 h-64 w-full rounded-2xl object-cover" />
        )}
        <h1 className="mt-5 text-3xl font-black">{post.title}</h1>
        <p className="mt-2 text-xs text-white/40">
          {post.author && `${post.author} · `}{new Date(post.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
        <div className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-white/80">
          {post.content}
        </div>
      </div>
    </main>
  );
}
