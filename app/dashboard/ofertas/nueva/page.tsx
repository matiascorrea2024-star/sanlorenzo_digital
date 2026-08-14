"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import { postActivity } from "@/lib/activity";

export default function NuevaOfertaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    business_id: "",
    title: "",
    product: "",
    old_price: "",
    offer_price: "",
    valid_until: "",
    image_url: "",
  });

  useEffect(() => {
    if (user) {
      loadBusinesses();
    }
  }, [user]);

  const loadBusinesses = async () => {
    try {
      const { data } = await supabase()
        .from("businesses")
        .select("*")
        .eq("owner_id", user?.id);

      if (data && data.length > 0) {
        setBusinesses(data);
        setFormData({ ...formData, business_id: data[0].id });
      }
    } catch (error) {
      console.error("Error cargando negocios:", error);
    }
  };

  const calculateDiscount = () => {
    const oldPrice = parseFloat(formData.old_price);
    const offerPrice = parseFloat(formData.offer_price);
    if (oldPrice > 0 && offerPrice > 0 && oldPrice > offerPrice) {
      return Math.round(((oldPrice - offerPrice) / oldPrice) * 100);
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const oldPrice = formData.old_price ? parseFloat(formData.old_price) : null;
      const offerPrice = formData.offer_price ? parseFloat(formData.offer_price) : null;
      const discountPercent = calculateDiscount();

      const { error } = await supabase().from("offers").insert({
        business_id: formData.business_id,
        title: formData.title,
        product: formData.product || null,
        old_price: oldPrice,
        offer_price: offerPrice,
        discount_percent: discountPercent > 0 ? discountPercent : null,
        image_url: formData.image_url || null,
        valid_until: formData.valid_until || null,
        active: true,
      });

      if (error) throw error;

      await postActivity({ type: "new_offer", businessId: formData.business_id, title: `🔥 ${formData.title}`, link: "/negocio/" + formData.business_id });
      router.push("/dashboard/ofertas");
    } catch (err: any) {
      setError(err.message || "Error al crear la oferta");
    } finally {
      setLoading(false);
    }
  };

  if (businesses.length === 0) {
    return (
      <main className="bg-[#0d0a12] min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Primero necesitás crear un negocio</p>
          <Link
            href="/dashboard/nuevo"
            className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-black text-white"
          >
            Crear negocio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#0d0a12] min-h-screen text-white">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/dashboard/ofertas" className="text-sm text-orange-400 hover:text-orange-300 mb-6 inline-block">
          ← Volver a mis ofertas
        </Link>

        <h1 className="text-3xl font-black mb-2">Nueva Oferta</h1>
        <p className="text-white/60 mb-8">Creá una promoción para La Gran Barata</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Negocio *</label>
            <select
              value={formData.business_id}
              onChange={(e) => setFormData({ ...formData, business_id: e.target.value })}
              required
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Título de la oferta *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
              placeholder="Ej: 2x1 en zapatillas seleccionadas"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Producto (opcional)</label>
            <input
              type="text"
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
              placeholder="Ej: Zapatillas Nike Air Max"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Precio anterior ($)</label>
              <input
                type="number"
                value={formData.old_price}
                onChange={(e) => setFormData({ ...formData, old_price: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
                placeholder="45000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Precio oferta ($)</label>
              <input
                type="number"
                value={formData.offer_price}
                onChange={(e) => setFormData({ ...formData, offer_price: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
                placeholder="32000"
              />
            </div>
          </div>

          {calculateDiscount() > 0 && (
            <div className="rounded-xl bg-orange-500/10 border border-orange-500/30 p-4 text-center">
              <p className="text-sm text-white/70">Descuento calculado</p>
              <p className="text-3xl font-black text-orange-400">{calculateDiscount()}% OFF</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Válida hasta</label>
            <input
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">URL de imagen (opcional)</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
              placeholder="https://..."
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-3 font-black text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Publicando..." : "🔥 Publicar Oferta"}
          </button>
        </form>
      </div>
    </main>
  );
}
