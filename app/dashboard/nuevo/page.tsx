"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import LocationPicker from "@/components/business/location-picker";
import { postActivity } from "@/lib/activity";

export default function NuevoNegocioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [masDetalles, setMasDetalles] = useState(false);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [barrios, setBarrios] = useState<any[]>([]);
  const [locationId, setLocationId] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");

  useEffect(() => {
    supabase().from("locations").select("id, name").eq("type", "city").eq("active", true)
      .order("name").then(({ data }) => {
        setCiudades(data || []);
        const sl = (data || []).find((c: any) => c.name === "San Lorenzo");
        if (sl) setLocationId(sl.id);
      });
  }, []);

  useEffect(() => {
    if (!locationId) { setBarrios([]); return; }
    supabase().from("locations").select("id, name").eq("type", "neighborhood").eq("parent_id", locationId)
      .order("name").then(({ data }) => setBarrios(data || []));
    setNeighborhoodId("");
  }, [locationId]);

  const [formData, setFormData] = useState({
    name: "",
    category: "gastronomia",
    type: "comercio",
    description: "",
    address: "",
    latitude: "",
    longitude: "",
    whatsapp: "",
    instagram: "",
    schedule: "",
  });

  const categories = [
    { id: "calzado", name: "Calzado", icon: "👟" },
    { id: "gastronomia", name: "Gastronomía", icon: "🍽️" },
    { id: "ferreteria", name: "Ferretería", icon: "🔧" },
    { id: "belleza", name: "Belleza", icon: "💈" },
    { id: "ropa", name: "Ropa", icon: "👕" },
    { id: "automotor", name: "Automotor", icon: "🚗" },
    { id: "profesionales", name: "Profesionales", icon: "💼" },
    { id: "tecnologia", name: "Tecnología", icon: "💻" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!user?.id) throw new Error("No hay usuario autenticado");

      const slug =
        formData.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") +
        "-" +
        Date.now().toString(36);

      const payload = {
        owner_id: user.id,
        name: formData.name,
        slug,
        category: formData.category,
        type: formData.type,
        description: formData.description,
        address: formData.address,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        location_id: locationId || null,
        neighborhood_id: neighborhoodId || null,
        whatsapp: formData.whatsapp,
        instagram: formData.instagram,
        schedule: formData.schedule,
        status: "reclamado",
        demo: false,
        open: true,
        items: [],
        tags: [],
        rating: 0,
        reviews: 0,
        views: 0,
        favorites_count: 0,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase()
        .from("businesses")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      try {
        await postActivity({
          type: "new_business",
          title: `🏪 Nuevo negocio: ${formData.name}`,
          description: `Categoría: ${formData.category}`,
        });
      } catch {
        // No crítico: si falla el registro de actividad no bloquea la creación.
      }

      // Directo a publicar la primera oferta -- el negocio ya quedó
      // creado, no tiene sentido hacer que vuelva a buscarlo.
      router.push(`/dashboard/ofertas/nueva?biz=${data.id}&bienvenida=1`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo crear el negocio. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400";
  const lbl = "block text-sm font-semibold mb-2";

  return (
    <main className="bg-[#0a0710] min-h-screen text-white">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/dashboard" className="text-sm text-orange-400 hover:text-orange-300 mb-6 inline-block">
          ← Volver al dashboard
        </Link>

        <h1 className="text-3xl font-black mb-2">🏪 Subí tu negocio</h1>
        <p className="text-white/60 mb-8">2 minutos: completá lo esencial y ya podés publicar tu primera oferta.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={lbl}>Nombre del negocio *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required className={inp} placeholder="Ej: Café La Esquina" />
          </div>

          <div>
            <label className={lbl}>Rubro *</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={inp}>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          {ciudades.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Ciudad *</label>
                <select className={inp} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                  {ciudades.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {barrios.length > 0 && (
                <div>
                  <label className={lbl}>Barrio</label>
                  <select className={inp} value={neighborhoodId} onChange={(e) => setNeighborhoodId(e.target.value)}>
                    <option value="">Sin especificar</option>
                    {barrios.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <label className={lbl}>Dirección *</label>
            <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required className={inp} placeholder="Ej: Belgrano 123, San Lorenzo" />
          </div>

          <div>
            <label className={lbl}>WhatsApp *</label>
            <input type="text" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              required className={inp} placeholder="Ej: 5493476123456" />
          </div>

          {!masDetalles ? (
            <button type="button" onClick={() => setMasDetalles(true)} className="text-sm font-bold text-orange-400 hover:text-orange-300">
              + Agregar descripción, Instagram, horarios y ubicación en el mapa (opcional)
            </button>
          ) : (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[.03] p-4">
              <div>
                <label className={lbl}>Descripción</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3} className={inp} placeholder="Contá qué hace tu negocio..." />
              </div>
              <LocationPicker
                address={formData.address}
                latitude={formData.latitude}
                longitude={formData.longitude}
                onChange={(location) => setFormData({ ...formData, latitude: location.latitude, longitude: location.longitude })}
              />
              <div>
                <label className={lbl}>Instagram</label>
                <input type="text" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  className={inp} placeholder="Ej: @cafelaesquina" />
              </div>
              <div>
                <label className={lbl}>Horarios</label>
                <input type="text" value={formData.schedule} onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className={inp} placeholder="Ej: Lun a Vie 9-18, Sáb 9-13" />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
              <p className="text-sm text-red-200 break-words">❌ {error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-3 font-black text-white hover:opacity-90 disabled:opacity-50">
            {loading ? "Creando…" : "Crear negocio y seguir →"}
          </button>
        </form>
      </div>
    </main>
  );
}
