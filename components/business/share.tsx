"use client";
import { PostaIcon } from "@/components/icons/sello-icons";

export default function Share({ title }: { title: string }) {
  return (
    <button
      onClick={async () => {
        const url = window.location.href;
        try { await navigator.share({ title, url }); }
        catch { try { await navigator.clipboard.writeText(url); alert("Link copiado ✅"); } catch { /* sin permisos */ } }
      }}
      className="flex items-center gap-2 rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold hover:border-[var(--accent)]">
      <PostaIcon className="h-4 w-4" /> Pasarle el dato
    </button>
  );
}
