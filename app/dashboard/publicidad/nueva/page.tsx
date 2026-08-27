"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import { friendlyError } from "@/lib/friendly-error";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import AdCreativeUploader from "@/components/upload/ad-creative-uploader";
import { AD_PLACEMENTS, calcularPrecioCampana } from "@/lib/ads-plans";

const inp = "w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-06)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)]/60 focus:outline-none transition";
const lbl = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]";

export default function NuevaCampanaPage() {
  const { user } = useAuth();

  const [negocios, setNegocios] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<{ id: string; name: string }[]>([]);
  const [biz, setBiz] = useState("");
  const [placement, setPlacement] = useState(Object.keys(AD_PLACEMENTS)[0] || "");
  const [locationId, setLocationId] = useState("");
  const [name, setName] = useState("");
  const [dias, setDias] = useState(7);
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [creative, setCreative] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Ver más");
  const [targetUrl, setTargetUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const sb = supabase();
      const [bizRes, ciuRes] = await Promise.all([
        sb.from("businesses").select("id, name, slug").eq("owner_id", user.id).order("name"),
        sb.from("locations").select("id, name").eq("type", "city").eq("active", true).order("name"),
      ]);
      const list = bizRes.data || [];
      setNegocios(list);
      setCiudades(ciuRes.data || []);
      if (list.length) {
        setBiz(list[0].id);
        setTargetUrl(`/negocio/${list[0].slug}`);
      }
      setCargando(false);
    })();
  }, [user]);

  const info = AD_PLACEMENTS[placement];
  const precio = useMemo(() => calcularPrecioCampana(placement, dias), [placement, dias]);

  const crear = async () => {
    setError("");
    if (!biz) { setError("Elegí un negocio."); return; }
    if (!name.trim() || name.trim().length < 3) { setError("Poné un nombre para identificar la campaña (mínimo 3 caracteres)."); return; }
    if (!creative) { setError("Subí la imagen del aviso."); return; }
    if (!targetUrl.trim()) { setError("Decinos a dónde tiene que llevar el click (tu página, una oferta, WhatsApp, etc.)."); return; }
    if (precio == null) { setError(`La duración debe ser entre ${info.minDias} y ${info.maxDias} días.`); return; }

    setSaving(true);
    try {
      const resCampana = await fetch("/api/ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: biz,
          placement,
          name: name.trim(),
          creative_url: creative,
          cta_label: ctaLabel.trim() || "Ver más",
          target_url: targetUrl.trim(),
          location_id: locationId || null,
          starts_at: startsAt,
          dias,
        }),
      });
      const dCampana = await resCampana.json();
      if (!resCampana.ok) throw new Error(dCampana.error || "No se pudo crear la campaña");

      const resPago = await fetch("/api/ads/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: dCampana.id }),
      });
      const dPago = await resPago.json();
      if (!resPago.ok || !dPago.init_point) throw new Error(dPago.error || "No se pudo iniciar el pago");

      window.location.href = dPago.init_point;
    } catch (e: any) {
      setError(friendlyError(e, e?.message || "No se pudo crear la campaña. Probá de nuevo."));
      setSaving(false);
    }
  };

  if (cargando) return <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text)]">Cargando...</main>;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <div className="mx-auto max-w-2xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <DashboardNav />
        <div className="mb-8 flex items-start gap-3">
          <Megaphone className="mt-1 h-8 w-8 shrink-0 text-[var(--accent)]" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.4em] text-[var(--accent)]">La Gran Barata Ads</p>
            <h1 className="mt-2 text-3xl font-black leading-[0.95] tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-space)" }}>Nueva campaña</h1>
            <p className="mt-3 text-sm text-[var(--muted)]">Tu aviso se revisa antes de publicarse y se activa automáticamente cuando lo aprobamos.</p>
          </div>
        </div>

        {negocios.length === 0 ? (
          <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] p-6 text-sm text-[var(--muted)]">
            Necesitás tener un negocio creado para publicitar. <Link href="/dashboard/nuevo" className="font-bold text-[var(--accent)]">Creá tu negocio primero →</Link>
          </div>
        ) : (
          <div className="space-y-5 rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] p-5">
            {negocios.length > 1 && (
              <div>
                <label className={lbl}>Negocio</label>
                <select className={inp} value={biz} onChange={(e) => setBiz(e.target.value)}>
                  {negocios.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className={lbl}>Nombre de la campaña (uso interno, no lo ve el público)</label>
              <input className={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Promo de invierno" maxLength={120} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Dónde se muestra</label>
                <select className={inp} value={placement} onChange={(e) => { setPlacement(e.target.value); setDias(AD_PLACEMENTS[e.target.value].minDias); }}>
                  {Object.entries(AD_PLACEMENTS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Ciudad</label>
                <select className={inp} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                  <option value="">Todo el país</option>
                  {ciudades.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <p className="-mt-3 text-xs text-[var(--muted2)]">{info?.description}</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Empieza</label>
                <input type="date" className={inp} value={startsAt} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setStartsAt(e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Duración (días)</label>
                <input type="number" className={inp} value={dias} min={info?.minDias} max={info?.maxDias}
                  onChange={(e) => setDias(Math.max(1, parseInt(e.target.value) || 1))} />
                <p className="mt-1 text-[11px] text-[var(--muted2)]">Entre {info?.minDias} y {info?.maxDias} días.</p>
              </div>
            </div>

            <div>
              <label className={lbl}>Imagen del aviso</label>
              <AdCreativeUploader value={creative} onChange={setCreative} businessId={biz} />
            </div>

            <div>
              <label className={lbl}>Texto del botón</label>
              <input className={inp} value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} maxLength={30} placeholder="Ver más" />
            </div>

            <div>
              <label className={lbl}>Al hacer click, llevar a</label>
              <input className={inp} value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="/negocio/tu-slug, /oferta/xxx o un link de WhatsApp" maxLength={300} />
            </div>

            {precio != null && (
              <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Total a pagar</p>
                <p className="mt-1 text-2xl font-black text-[var(--accent)]" style={{ fontFamily: "var(--font-space)" }}>${precio.toLocaleString("es-AR")}</p>
                <p className="mt-1 text-[11px] text-[var(--muted2)]">${info.dailyRateARS.toLocaleString("es-AR")}/día × {dias} días -- tarifa plana, pago único por adelantado.</p>
              </div>
            )}

            {error && <p className="text-sm font-bold text-[var(--bad)]">{error}</p>}

            <button
              onClick={crear}
              disabled={saving}
              className="w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-black uppercase tracking-wider text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Creando…" : "Continuar al pago"}
            </button>
            <p className="text-center text-[11px] text-[var(--muted2)]">
              Después de pagar, tu aviso queda pendiente de aprobación. Te avisamos cuando lo revisemos.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
