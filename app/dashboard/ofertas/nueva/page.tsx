"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";

const inp = "w-full rounded-xl border border-white/15 bg-white/[.06] px-4 py-3 text-sm text-white focus:border-orange-400/60 focus:outline-none transition";
const lbl = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/60";

export default function NuevaOferta() {
  const router = useRouter();
  const { show } = useToast();
  const [negocios, setNegocios] = useState<any[]>([]);
  const [biz, setBiz] = useState("");
  const [title, setTitle] = useState("");
  const [product, setProduct] = useState("");
  const [priceBefore, setPriceBefore] = useState("");
  const [priceOffer, setPriceOffer] = useState("");
  const [expires, setExpires] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: prof } = await sb.from("user_profiles").select("role").eq("user_id", user.id).maybeSingle();
      const q = sb.from("businesses").select("id, name, promotions").order("name");
      if (prof?.role !== "admin") q.eq("owner_id", user.id);
      const { data } = await q;
      const list = (data || []).filter((n: any) => n.name);
      setNegocios(list);
      if (list.length) setBiz(list[0].id);
    })();
  }, []);

  const desc =
    Number(priceBefore) > 0 && Number(priceOffer) >= 0 && Number(priceOffer) < Number(priceBefore)
      ? Math.round((1 - Number(priceOffer) / Number(priceBefore)) * 100)
      : 0;

  const publicar = async () => {
    if (!biz || !title.trim() || !expires) {
      show("Completá negocio, título y fecha de vencimiento", "error");
      return;
    }
    setSaving(true);
    const sb = supabase();
    const neg = negocios.find((n) => n.id === biz);

    const promo: any = {
      title: title.trim(),
      product: product.trim() || undefined,
      price_before: priceBefore ? Number(priceBefore) : undefined,
      price_offer: priceOffer ? Number(priceOffer) : undefined,
      discount: desc > 0 ? `-${desc}%` : undefined,
      expires,
      image_url: image.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    // 1) Vitrina: append a businesses.promotions (lo que ve todo el mundo)
    const { error: e1 } = await sb
      .from("businesses")
      .update({ promotions: [...(neg?.promotions || []), promo] })
      .eq("id", biz);

    // 2) Tabla offers (radar / detalle) — best effort, no bloquea
    try {
      await sb.from("offers").insert({
        business_id: biz,
        title: promo.title,
        description: promo.product || null,
        expires_at: expires,
        image_url: promo.image_url || null,
      });
    } catch (e) {
      console.warn("offers:", e);
    }

    setSaving(false);
    if (e1) {
      show("❌ " + e1.message, "error");
      return;
    }
    show("🔥 Oferta publicada en toda la plataforma", "success");
    setTimeout(() => router.push("/dashboard/ofertas"), 900);
  };

  return (
    <main className="min-h-screen bg-[#0d0a12] pb-24 text-white">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link href="/dashboard/ofertas" className="text-sm text-orange-400 hover:text-orange-300">← Volver a mis ofertas</Link>
        <h1 className="mt-3 text-3xl font-black">🔥 Nueva Oferta</h1>
        <p className="mt-1 text-sm text-white/60">Se publica al instante en la home, el radar, el mapa y tu miniweb.</p>

        <div className="mt-8 space-y-5 rounded-3xl border border-orange-400/20 bg-gradient-to-b from-white/[.07] to-white/[.03] p-6 shadow-xl shadow-orange-500/10">
          <div>
            <span className={lbl}>Negocio *</span>
            <select className={inp} value={biz} onChange={(e) => setBiz(e.target.value)}>
              {negocios.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>

          <div>
            <span className={lbl}>Título de la oferta *</span>
            <input className={inp} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: 2×1 en zapatillas seleccionadas" />
          </div>

          <div>
            <span className={lbl}>Producto (opcional)</span>
            <input className={inp} value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Ej: zapatillas" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={lbl}>Precio anterior ($)</span>
              <input className={inp} type="number" value={priceBefore} onChange={(e) => setPriceBefore(e.target.value)} placeholder="45000" />
            </div>
            <div>
              <span className={lbl}>Precio oferta ($)</span>
              <input className={inp} type="number" value={priceOffer} onChange={(e) => setPriceOffer(e.target.value)} placeholder="20000" />
            </div>
          </div>

          {desc > 0 && (
            <div className="rounded-2xl border border-orange-400/40 bg-orange-500/10 p-4 text-center">
              <p className="text-xs text-white/60">Descuento calculado</p>
              <p className="text-3xl font-black text-orange-400">{desc}% OFF</p>
            </div>
          )}

          <div>
            <span className={lbl}>Válida hasta *</span>
            <input className={inp} type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </div>

          <div>
            <span className={lbl}>URL de imagen (opcional)</span>
            <input className={inp} value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" />
          </div>

          <button
            onClick={publicar}
            disabled={saving}
            className="btn-shine w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3.5 text-sm font-black transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "⏳ Publicando…" : "🔥 Publicar Oferta"}
          </button>
        </div>
      </div>
    </main>
  );
}
