import { supabase } from "./supabase";

async function compressImage(file: File, maxW = 1200, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxW / img.width, 1);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compress"))), "image/jpeg", quality);
    };
    img.onerror = () => reject(new Error("read"));
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadProductImage(file: File, businessId: string, itemId: string): Promise<string> {
  const sb = supabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("No estás logueado");
  const blob = await compressImage(file);
  const ext = "jpg";
  const path = `${user.id}/${businessId}/${itemId}.${ext}`;
  const { error } = await sb.storage.from("business-media").upload(path, blob, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from("business-media").getPublicUrl(path);
  return data.publicUrl;
}
