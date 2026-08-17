"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";
import ImageUploader from "@/components/upload/image-uploader";
import { OFERTA_DURACION_MAX_DIAS } from "@/lib/plans";
import { friendlyError } from "@/lib/friendly-error";
import HowItWorks from "@/components/ui/how-it-works";
import { hoyArgentina } from "@/lib/fecha-ar";

const inp = "w-full rounded-xl border border-white/15 bg-white/[.06] px-4 py-3 text-sm text-white focus:border-orange-400/60 focus:outline-none transition";
const lbl = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/60";

export default function EditarOferta() {
  const { id } = useParams();
  const router = useRouter();
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [title, setTitle] = useState("");
  const [product, setProduct] = useState("");
  const [description, setDescription] = useState("");
  const [priceBefore, setPriceBefore] = useState("");
  const [priceOffer, setPriceOffer] = useState("");
  const [expires, setExpires] = useState("");
  const [image, setImage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [precioPrometido, setPrecioPrometido] = useState(false);
  const [hoyStr] = useState(() => hoyArgentina());
  const [maxFechaStr] = useState(() => new Date(Date.now() + OFERTA_DURACION_MAX_DIAS * 86400000).toISOString().slice(0, 10));

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: offer, error: err } = await sb.from("offers").select("*").eq("id", id).single();
      if (err || !offer) { setError("Oferta no encontrada."); setLoading(false); return; }

      const { data: biz } = await sb.from("businesses").select("id, owner_id").eq("id", offer.business_id).single();
      const { data: prof } = await sb.from("user_profiles").select("role").eq("user_id", user.id).maybeSingle();
      const admin = prof?.role === "admin";
      if (biz?.owner_id !== user.id && !admin) {
        setError("Esta oferta no te pertenece.");
        setLoading(false);
        return;
      }

      setIsAdmin(admin);
      setBusinessId(offer.business_id);
      setTitle(offer.title || "");
      setProduct(offer.product || "");
      setDescription(offer.description || "");
      setPriceBefore(offer.old_price ? String(offer.old_price) : "");
      setPriceOffer(offer.offer_price ? String(offer.offer_price) : "");
      setExpires(offer.valid_until || "");
      setImage(offer.image_url || "");
      setPrecioPrometido(!!offer.precio_prometido);
      setLoading(false);
    })();
  }, [id]);

  const desc =
    Number(priceBefore) > 0 && Number(priceOffer) >= 0 && Number(priceOffer) < Number(priceBefore)
      ? Math.round((1 - Number(priceOffer) / Number(priceBefore)) * 100)
      : 0;

  const guardar = async () => {
    setError("");
    if (title.trim().length < 10) { setError("El título debe tener al menos 10 caracteres."); return; }
    if (description.trim().length < 30) { setError("La descripción debe tener al menos 30 caracteres."); return; }
    if (!image.trim()) { setError("La oferta necesita una foto."); return; }
    if (!expires) { setError("Completá la fecha de vencimiento."); return; }
    if (expires < hoyStr) { setError("La fecha de vencimiento no puede ser en el pasado."); return; }
    if (expires > maxFechaStr) { setError(`La oferta puede durar hasta ${OFERTA_DURACION_MAX_DIAS} días.`); return; }
    if (priceBefore && priceOffer && Number(priceOffer) >= Number(priceBefore)) { setError("El precio de oferta tiene que ser menor al precio anterior."); return; }
    setSaving(true);
    const { error: err } = await supabase().from("offers").update({
      title: title.trim(),
      product: product.trim() || null,
      description: description.trim(),
      old_price: priceBefore ? Number(priceBefore) : null,
      offer_price: priceOffer ? Number(priceOffer) : null,
      discount_percent: desc > 0 ? desc : null,
      valid_until: expires,
      image_url: image.trim() || null,
      ...(isAdmin ? { precio_prometido: precioPrometido } : {}),
    }).eq("id", id);
    setSaving(false);
    if (err) { setError(friendlyError(err, "No se pudieron guardar los cambios. Probá de nuevo.")); return; }
    show("✅ Oferta actualizada", "success");
    setTimeout(() => router.push("/dashboard/ofertas"), 700);
  };

  if (loading) return <main className="min-h-screen bg-[#0c0a0b] flex items-center justify-center text-white/60 text-sm">Cargando…</main>;

  if (error && !title) {
    return (
      <main className="min-h-screen bg-[#0c0a0b] flex items-center justify-center text-white text-center px-4">
        <div>
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-bold">{error}</p>
          <Link href="/dashboard/ofertas" className="mt-4 inline-block text-orange-400 hover:text-orange-300">← Volver a mis ofertas</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0c0a0b] pb-24 text-white">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link href="/dashboard/ofertas" className="text-sm text-orange-400 hover:text-orange-300">← Volver a mis ofertas</Link>
        <h1 className="mt-3 text-3xl font-black" style={{ fontFamily: "var(--font-space)" }}>Editar oferta</h1>

        <div className="mt-4">
          <HowItWorks steps={[
            "Cambiá lo que necesites y tocá \"Guardar cambios\" al final.",
            "Los cambios se ven al instante en la home, el radar y el mapa.",
            "Si querés desactivarla en vez de editarla, hacelo desde \"Mis Ofertas\".",
          ]} />
        </div>

        <div className="mt-4 space-y-5 rounded-3xl border border-orange-400/20 bg-gradient-to-b from-white/[.07] to-white/[.03] p-6 shadow-xl shadow-orange-500/10">
          <div>
            <span className={lbl}>Título de la oferta *</span>
            <input className={inp} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <span className={lbl}>Nombre del producto o servicio (opcional)</span>
            <input className={inp} value={product} onChange={(e) => setProduct(e.target.value)} />
            <p className="mt-1 text-[11px] text-white/40">Aparece como subtítulo debajo del título de la oferta.</p>
          </div>
          <div>
            <span className={lbl}>Descripción * <span className="normal-case font-normal text-white/30">(mín. 30 caracteres)</span></span>
            <textarea className={inp} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            <p className="mt-1 text-right text-[10px] text-white/30">{description.trim().length}/30</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={lbl}>Precio anterior ($)</span>
              <input className={inp} type="number" value={priceBefore} onChange={(e) => setPriceBefore(e.target.value)} />
            </div>
            <div>
              <span className={lbl}>Precio oferta ($)</span>
              <input className={inp} type="number" value={priceOffer} onChange={(e) => setPriceOffer(e.target.value)} />
            </div>
          </div>
          {desc > 0 && (
            <div className="rounded-2xl border border-orange-400/40 bg-orange-500/10 p-4 text-center">
              <p className="text-xs text-white/60">Descuento calculado</p>
              <p className="text-3xl font-black text-orange-400">{desc}% OFF</p>
            </div>
          )}
          <div>
            <span className={lbl}>Válida hasta * <span className="normal-case font-normal text-white/30">(máx. {OFERTA_DURACION_MAX_DIAS} días)</span></span>
            <input className={inp} type="date" min={hoyStr} max={maxFechaStr} value={expires} onChange={(e) => setExpires(e.target.value)} />
          </div>
          <div>
            <span className={lbl}>Foto de la oferta *</span>
            <ImageUploader value={image} onChange={setImage} businessId={businessId} itemId={String(id)} previewClass="h-40 w-full rounded-xl" />
          </div>

          {isAdmin && (
            <label className="flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 p-4 text-sm">
              <input type="checkbox" checked={precioPrometido} onChange={(e) => setPrecioPrometido(e.target.checked)} />
              <span>🔒 Certificar &quot;Precio Prometido&quot; (solo admin)</span>
            </label>
          )}

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
              <p className="text-sm font-bold text-red-300">❌ {error}</p>
            </div>
          )}

          <button onClick={guardar} disabled={saving}
            className="btn-shine w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3.5 text-sm font-black transition hover:opacity-90 disabled:opacity-50">
            {saving ? "⏳ Guardando…" : "💾 Guardar cambios"}
          </button>
        </div>
      </div>
    </main>
  );
}
