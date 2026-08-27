"use client";
import { useState, useRef } from "react";
import { uploadAdCreative } from "@/lib/media";

// Uploader dedicado para creativos de La Gran Barata Ads -- por ahora
// solo imagen (comprimida a JPEG como el resto del catálogo). Video
// queda reservado para cuando exista una validación real de tamaño y
// duración; no tiene sentido ofrecer un selector de video que no valida
// nada de verdad.
export default function AdCreativeUploader({ value, onChange, businessId }: {
  value?: string; onChange: (url: string) => void; businessId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Solo imágenes"); return; }
    if (file.size > 8 * 1024 * 1024) { setErr("Máximo 8MB"); return; }
    setErr(""); setUploading(true);
    try {
      const url = await uploadAdCreative(file, businessId);
      onChange(url);
    } catch (e: any) {
      setErr(e.message || "Error al subir");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-start gap-3">
      {value ? (
        <div className="relative w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Vista previa del creativo" className="h-40 w-full rounded-xl border border-[var(--line)] object-cover" />
          <button
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur hover:bg-red-500"
          >
            ✕ Quitar
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-40 w-full items-center justify-center rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--ov-03)] text-2xl text-[var(--muted2)] transition hover:border-[var(--accent)]/60 hover:text-[var(--text)] disabled:opacity-50"
        >
          {uploading ? "⏳ Subiendo…" : "🖼️ Subir imagen del aviso"}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      {err && <p className="text-xs font-bold text-[var(--bad)]">{err}</p>}
    </div>
  );
}
