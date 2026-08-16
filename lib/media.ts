import { supabase } from "./supabase";

// 1200px/0.82 se veía borroso en las fotos grandes (portada de negocio,
// hero de ficha) -- esto es lo que vende, así que el piso de calidad sube:
// 1920px alcanza para verse nítido incluso en pantallas retina sin subir
// el peso del archivo de forma desproporcionada.
async function compressImage(file: File, maxW = 1920, quality = 0.88): Promise<Blob> {
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

export async function uploadReviewPhoto(file: File, businessId: string): Promise<string> {
  const sb = supabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("No estás logueado");
  const blob = await compressImage(file, 1400, 0.85);
  const path = `${user.id}/${businessId}/review-${Date.now()}-${Math.floor(Math.random() * 1e6)}.jpg`;
  const { error } = await sb.storage.from("business-media").upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  const { data } = sb.storage.from("business-media").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadComprobante(file: File, businessId: string): Promise<string> {
  const sb = supabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("No estás logueado");
  const blob = await compressImage(file, 1600, 0.9);
  const path = `${user.id}/${businessId}/comprobante-${Date.now()}.jpg`;
  const { error } = await sb.storage.from("business-media").upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  const { data } = sb.storage.from("business-media").getPublicUrl(path);
  return data.publicUrl;
}
