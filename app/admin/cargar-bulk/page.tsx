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
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [ciudadId, setCiudadId] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: prof } = await supabase().from("user_profiles")
        .select("role").eq("user_id", user.id).maybeSingle();
      if (prof?.role !== "admin") { router.push("/"); return; }
      setRole("admin");
      const { data: ciu } = await supabase().from("locations").select("id, name").eq("type", "city").order("name");
      setCiudades(ciu || []);
      if (ciu && ciu.length === 1) setCiudadId(ciu[0].id);
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
  async function geocodificar(direccion: string, ciudadNombre: string): Promise<{ lat: number; lon: number } | null> {
    if (!direccion.trim()) return null;
    try {
      const q = encodeURIComponent(`${direccion}, ${ciudadNombre}, Argentina`);
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
    if (!preview.length || !ciudadId) return;
    const ciudadNombre = ciudades.find((c) => c.id === ciudadId)?.name || "";
    setLoading(true);
    let ok = 0, fail = 0, sinUbicar = 0;
    const errores: string[] = [];
    for (const b of preview) {
      // Nominatim pide no superar 1 request/segundo.
      const geo = await geocodificar(b.direccion || "", ciudadNombre);
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
        location_id: ciudadId,
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
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <DashboardNav />
        <div className="flex items-center gap-3 mb-6">
          <Upload className="h-8 w-8 text-orange-400" />
          <div>
            <h1 className="text-3xl font-black" style={{ fontFamily: "var(--font-space)" }}>Carga masiva de negocios</h1>
            <p className="text-[var(--muted)]">Cargá negocios reales desde CSV en 2 minutos</p>
          </div>
        </div>

        {/* Ciudad destino -- sin esto, antes se cargaban TODOS los negocios
            en San Lorenzo sin importar la ciudad real (bug corregido). */}
        <div className="mb-6 rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
        <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
          <p className="font-bold mb-2">Ciudad de estos negocios</p>
          <select value={ciudadId} onChange={(e) => setCiudadId(e.target.value)}
            className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] px-4 py-2.5 text-sm outline-none focus:border-orange-400">
            <option value="">Elegí una ciudad...</option>
            {ciudades.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {ciudades.length === 0 && (
            <p className="mt-2 text-xs text-[var(--muted2)]">No hay ciudades creadas todavía -- creá una desde la pestaña &quot;Ciudades&quot; del panel admin.</p>
          )}
        </div>
        </div>

        {/* Plantilla */}
        <div className="mb-6 rounded-[1.5rem] border border-sky-400/25 bg-sky-500/[.06] p-1.5">
          <div className="flex items-center gap-3 rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
            <Download className="h-6 w-6 text-sky-400" />
            <div className="flex-1">
              <p className="font-bold">1. Descargá la plantilla CSV</p>
              <p className="text-sm text-[var(--muted)]">Completala con los negocios reales de San Lorenzo</p>
            </div>
            <button onClick={descargarPlantilla}
              className="rounded-full bg-sky-500/20 border border-sky-400/40 px-4 py-2 text-xs font-black text-sky-200 hover:bg-sky-500/30">
              Descargar CSV
            </button>
          </div>
        </div>

        {/* CSV input */}
        <div className="mb-6 rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
        <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
          <p className="font-bold mb-2">2. Pegá el CSV acá</p>
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={10}
            placeholder="nombre,categoria,direccion,whatsapp,descripcion,horario\nPizzería X,gastronomia,Av. San Martín 100,5493415555555,Descripción,Horario"
            className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] px-4 py-3 font-mono text-xs outline-none focus:border-orange-400" />
          <button onClick={parsear} disabled={!csv.trim()}
            className="mt-3 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-black disabled:opacity-50">
            Previsualizar ({preview.length} negocios)
          </button>
        </div>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mb-6 rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
          <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
            <p className="font-bold mb-3">3. Revisá antes de cargar ({preview.length} negocios)</p>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {preview.map((b, i) => (
                <div key={i} className="rounded-lg border border-[var(--line)] bg-[var(--card-inner)] p-3 text-sm">
                  <p className="font-bold">{b.nombre}</p>
                  <p className="text-xs text-[var(--muted)] capitalize">
                    {b.categoria} · {b.direccion || "sin dirección"}
                  </p>
                  {b.whatsapp && <p className="text-xs text-[var(--muted2)]">📱 {b.whatsapp}</p>}
                </div>
              ))}
            </div>
            <button onClick={cargar} disabled={loading || !ciudadId}
              className="mt-4 w-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 py-3 text-sm font-black disabled:opacity-50">
              {loading ? "Cargando..." : `✅ Cargar ${preview.length} negocios`}
            </button>
            {!ciudadId && <p className="mt-2 text-center text-xs text-red-300">Elegí una ciudad arriba antes de cargar.</p>}
          </div>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="rounded-[1.5rem] border border-green-400/30 bg-green-500/[.06] p-1.5">
            <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-xl font-black">Carga completada</p>
                  <p className="text-sm text-[var(--text)]/70">
                    ✅ {result.ok} exitosos · ❌ {result.fail} fallidos
                  </p>
                </div>
              </div>
              {result.errores.length > 0 && (
                <div className="mt-4 rounded-xl bg-red-500/10 border border-red-400/30 p-3">
                  <p className="text-xs font-bold text-red-300 mb-1">Errores:</p>
                  {result.errores.slice(0, 5).map((e, i) => (
                    <p key={i} className="text-xs text-[var(--muted)]">• {e}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-[var(--muted2)]">
          Los negocios cargados quedan en estado &quot;pendiente&quot; y se verifican desde /admin.
        </p>
      </div>
    </main>
  );
}
