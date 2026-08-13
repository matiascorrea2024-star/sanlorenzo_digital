"use client";
export default function Share({ title }: { title: string }) {
  return (
    <button
      onClick={async () => {
        const url = window.location.href;
        try { await navigator.share({ title, url }); }
        catch { try { await navigator.clipboard.writeText(url); alert("Link copiado ✅"); } catch { /* sin permisos */ } }
      }}
      className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm hover:border-[var(--accent)]">
      Compartir
    </button>
  );
}
