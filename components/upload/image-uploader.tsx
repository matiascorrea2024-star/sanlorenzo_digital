"use client";
import { useState, useRef } from "react";
import { uploadProductImage } from "@/lib/media";

export default function ImageUploader({ value, onChange, businessId, itemId, previewClass = "h-16 w-16 rounded-lg" }: {
  value?: string; onChange: (url: string) => void; businessId: string; itemId: string; previewClass?: string;
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
      const url = await uploadProductImage(file, businessId, itemId);
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
          <img src={value} alt="Vista previa de la imagen cargada" className={`${previewClass} border border-[var(--line)] object-cover`} />
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
          className="flex h-24 w-full items-center justify-center rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--ov-03)] text-2xl text-[var(--muted2)] transition hover:border-[var(--accent)]/60 hover:text-[var(--text)] disabled:opacity-50"
        >
          {uploading ? "⏳ Subiendo…" : "📷 Subir foto"}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      {err && <span className="text-xs text-[var(--bad)]">{err}</span>}
    </div>
  );
}
