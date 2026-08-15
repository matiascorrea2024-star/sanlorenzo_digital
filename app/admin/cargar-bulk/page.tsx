"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, XCircle, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import DashboardNav from "@/components/dashboard/dashboard-nav";

// CSV ejemplo:
// nombre,categoria,direccion,whatsapp,descripcion,horario
// Pizzería Los Amigos,gastronomia,Av. San Martín 1500,5493415555555,Pizzas al horno de barro,Lun-Dom 19:00-00:00

const CSV_EJEMPLO = `nombre,categoria,direccion,whatsapp,descripcion,horario
Pizzería Los Amigos,gastronomia,Av. San Martín 1500,5493415555555,Pizzas al horno de barro,Lun-Dom 19:00-00:00
Barbería Centro,belleza,Belgrano 820,5493415666666,Cortes y barba profesional,Mar-Sáb 10:00-20:00
Ferretería Don Juan,ferreteria,Sarmiento 1200,5493415777777,Herramientas y construcción,Lun-Vie 08:00-18:00`;

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export default function CargarBulkPage() {
  const router = useRouter();
  const [role, setRole] = useState("user");
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: number; fail: number; errores: string[] } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: prof } = await supabase().from("user_profiles")
        .select("role").eq("user_id", user.id).maybeSingle();
      if (prof?.role !== "admin") { router.push("/"); return; }
      setRole("admin");
    })();
  }, []);

  const parsear = () => {
    const lineas = csv.trim().split("\n").map(l => l.trim()).filter(Boolean);
    if (lineas.length < 2) { setPreview([]); return; }
    const headers = lineas[0].split(",").map(h => h.trim());
    const rows = lineas.slice(1).map(l => {
      const vals = l.split(",");
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || "").trim(); });
      obj.slug = slugify(obj.nombre || "");
      return obj;
    });
    setPreview(rows);
  };

  const descargarPlantilla = () => {
    const blob = new Blob([CSV_EJEMPLO], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "plantilla-negocios.csv"; a.click();
  };

  // Geocodifica la dirección real contra OpenStreetMap (mismo servicio que
  // usa el selector de ubicación de "nueva oferta"/"editar negocio") --
  // antes esto le ponía a CADA negocio una coordenada al azar cerca del
  // centro de San Lorenzo, sin relación con su dirección real. Si no se
  // puede geocodificar, se deja sin coordenadas (null) en vez de inventar
  // una -- el dueño puede cargarla a mano después desde "Editar negocio".
  async function geocodificar(direccion: string): Promise<{ lat: number; lon: number } | null> {
    if (!direccion.trim()) return null;
    try {
      const q = encodeURIComponent(`${direccion}, San Lorenzo, Santa Fe, Argentina`);
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${q}`, {
        headers: { Accept: "application/json" },
      });
      const j = await r.json();
      if (!j[0]) return null;
      const lat = Number(j[0].lat), lon = Number(j[0].lon);
      return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
    } catch {
      return null;
    }
  }

  const cargar = async () => {
    if (!preview.length) return;
    setLoading(true);
    let ok = 0, fail = 0, sinUbicar = 0;
    const errores: string[] = [];
    for (const b of preview) {
      // Nominatim pide no superar 1 request/segundo.
      const geo = await geocodificar(b.direccion || "");
      if (!geo) sinUbicar++;
      await new Promise((r) => setTimeout(r, 1100));
      const { error } = await supabase().from("businesses").insert({
        name: b.nombre,
        slug: b.slug,
        category: b.categoria || "otros",
        description: b.descripcion || null,
        address: b.direccion || null,
        whatsapp: b.whatsapp || null,
        schedule: b.horario || null,
        status: "pendiente",
        plan: "gratis",
        location_id: "a0000000-0000-0000-0000-000000000003",
        latitude: geo?.lat ?? null,
        longitude: geo?.lon ?? null,
      });
      if (error) { fail++; errores.push(`${b.nombre}: ${error.message}`); }
      else ok++;
    }
    setResult({ ok, fail, errores: sinUbicar > 0 ? [...errores, `⚠️ ${sinUbicar} negocio(s) se cargaron sin coordenadas (no se pudo ubicar la dirección) -- cargalas a mano desde "Editar negocio".`] : errores });
    setLoading(false);
  };

  if (role !== "admin") return null;

  return (
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <DashboardNav />
        <div className="flex items-center gap-3 mb-6">
          <Upload className="h-8 w-8 text-orange-400" />
          <div>
            <h1 className="text-3xl font-black">Carga masiva de negocios</h1>
            <p className="text-white/60">Cargá negocios reales desde CSV en 2 minutos</p>
          </div>
        </div>

        {/* Plantilla */}
        <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-5 mb-6">
          <div className="flex items-center gap-3">
            <Download className="h-6 w-6 text-sky-400" />
            <div className="flex-1">
              <p className="font-bold">1. Descargá la plantilla CSV</p>
              <p className="text-sm text-white/60">Completala con los negocios reales de San Lorenzo</p>
            </div>
            <button onClick={descargarPlantilla}
              className="rounded-xl bg-sky-500/20 border border-sky-400/40 px-4 py-2 text-xs font-black text-sky-200 hover:bg-sky-500/30">
              Descargar CSV
            </button>
          </div>
        </div>

        {/* CSV input */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6">
          <p className="font-bold mb-2">2. Pegá el CSV acá</p>
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={10}
            placeholder="nombre,categoria,direccion,whatsapp,descripcion,horario\nPizzería X,gastronomia,Av. San Martín 100,5493415555555,Descripción,Horario"
            className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 font-mono text-xs outline-none focus:border-orange-400" />
          <button onClick={parsear} disabled={!csv.trim()}
            className="mt-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-black disabled:opacity-50">
            Previsualizar ({preview.length} negocios)
          </button>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6">
            <p className="font-bold mb-3">3. Revisá antes de cargar ({preview.length} negocios)</p>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {preview.map((b, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm">
                  <p className="font-bold">{b.nombre}</p>
                  <p className="text-xs text-white/50 capitalize">
                    {b.categoria} · {b.direccion || "sin dirección"}
                  </p>
                  {b.whatsapp && <p className="text-xs text-white/40">📱 {b.whatsapp}</p>}
                </div>
              ))}
            </div>
            <button onClick={cargar} disabled={loading}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 py-3 text-sm font-black disabled:opacity-50">
              {loading ? "Cargando..." : `✅ Cargar ${preview.length} negocios`}
            </button>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="rounded-2xl border border-green-400/40 bg-green-500/10 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-xl font-black">Carga completada</p>
                <p className="text-sm text-white/70">
                  ✅ {result.ok} exitosos · ❌ {result.fail} fallidos
                </p>
              </div>
            </div>
            {result.errores.length > 0 && (
              <div className="mt-4 rounded-xl bg-red-500/10 border border-red-400/30 p-3">
                <p className="text-xs font-bold text-red-300 mb-1">Errores:</p>
                {result.errores.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-xs text-white/60">• {e}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-white/40">
          Los negocios cargados quedan en estado &quot;pendiente&quot; y se verifican desde /admin.
        </p>
      </div>
    </main>
  );
}
