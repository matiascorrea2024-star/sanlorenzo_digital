"use client";

import { useState } from "react";
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
  const [debug, setDebug] = useState<string[]>([]);

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

  const log = (msg: string) => {
    setDebug((d) => [...d, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    console.log(`[NuevoNegocio] ${msg}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setDebug([]);

    try {
      log("Iniciando creación...");

      if (!user?.id) {
        throw new Error("No hay usuario autenticado");
      }

      const slug =
        formData.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") +
        "-" +
        Date.now().toString(36);

      log(`Slug generado: ${slug}`);

      const payload = {
        owner_id: user.id,
        name: formData.name,
        slug: slug,
        category: formData.category,
        type: formData.type,
        description: formData.description,
        address: formData.address,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
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

      log("Insertando en Supabase...");

      const { data, error } = await supabase()
        .from("businesses")
        .insert(payload)
        .select()
        .single();

      if (error) {
        log(`Error Supabase: ${JSON.stringify(error)}`);
        throw error;
      }

      log(`Negocio creado: ${data?.id}`);

      // Registrar actividad (no bloqueante)
      try {
        await postActivity({
          type: "new_business",
          title: `🏪 Nuevo negocio: ${formData.name}`,
          description: `Categoría: ${formData.category}`,
        });
        log("Actividad registrada");
      } catch (actErr: unknown) {
        log(`Error registrando actividad (no crítico): ${actErr instanceof Error ? actErr.message : "desconocido"}`);
      }

      log("Redirigiendo al dashboard...");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null
          ? JSON.stringify(err)
          : "Error desconocido";
      setError(msg);
      log(`ERROR FINAL: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-[#0d0a12] min-h-screen text-white">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/dashboard" className="text-sm text-orange-400 hover:text-orange-300 mb-6 inline-block">
          ← Volver al dashboard
        </Link>

        <h1 className="text-3xl font-black mb-2">Crear Nuevo Negocio</h1>
        <p className="text-white/60 mb-8">Completa los datos de tu comercio</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Nombre del negocio *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
              placeholder="Ej: Café La Esquina"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Categoría *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
              placeholder="Contá qué hace tu negocio..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Dirección *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
              placeholder="Ej: Belgrano 123, San Lorenzo"
            />
          </div>

          <LocationPicker
            address={formData.address}
            latitude={formData.latitude}
            longitude={formData.longitude}
            onChange={(location) =>
              setFormData({
                ...formData,
                latitude: location.latitude,
                longitude: location.longitude,
              })
            }
          />

          <div>
            <label className="block text-sm font-semibold mb-2">WhatsApp</label>
            <input
              type="text"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
              placeholder="Ej: 5493476123456"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Instagram</label>
            <input
              type="text"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
              placeholder="Ej: @cafelaesquina"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Horarios</label>
            <input
              type="text"
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
              placeholder="Ej: Lun a Vie 9-18, Sáb 9-13"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
              <p className="text-sm font-bold text-red-300 mb-2">❌ Error:</p>
              <p className="text-sm text-red-200 break-words">{error}</p>
            </div>
          )}

          {debug.length > 0 && (
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-4">
              <p className="text-sm font-bold text-blue-300 mb-2">🔍 Debug:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {debug.map((d, i) => (
                  <p key={i} className="text-xs text-blue-200 font-mono">
                    {d}
                  </p>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-3 font-black text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear Negocio"}
          </button>
        </form>
      </div>
    </main>
  );
}
