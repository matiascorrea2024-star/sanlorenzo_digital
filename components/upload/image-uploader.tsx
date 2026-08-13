"use client";
import { useState, useRef } from "react";
import { uploadProductImage } from "@/lib/media";

export default function ImageUploader({ value, onChange, businessId, itemId }: {
  value?: string; onChange: (url: string) => void; businessId: string; itemId: string;
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
    <div className="flex items-center gap-3">
      {value ? (
        <div className="relative">
          <img src={value} alt="" className="h-16 w-16 rounded-lg border border-[var(--line)] object-cover" />
          <button onClick={() => onChange("")} className="absolute -right-1 -top-1 rounded-full bg-[var(--bad)] px-1.5 text-xs text-white">✕</button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-white disabled:opacity-50">
          {uploading ? "…" : "📷"}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      {err && <span className="text-xs text-[var(--bad)]">{err}</span>}
    </div>
  );
}
