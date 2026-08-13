"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ImageUploader from "@/components/upload/image-uploader";
import ReviewModeration from "@/components/business/review-moderation";

type Item = { name: string; price?: string; note?: string; photo?: string };

export default function Editar() {
  const { slug } = useParams();
  const [b, setB] = useState<any>(null);
  const [denied, setDenied] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data } = await sb.from("businesses").select("*").eq("slug", slug).eq("owner_id", user.id).maybeSingle();
      if (!data) { setDenied(true); return; }
      setB(data);
      setForm({ name: data.name, description: data.description || "", address: data.address || "", schedule: data.schedule || "", whatsapp: data.whatsapp || "", instagram: data.instagram || "", open: !!data.open, latitude: data.latitude != null ? String(data.latitude) : "", longitude: data.longitude != null ? String(data.longitude) : "" });
      setItems(Array.isArray(data.items) ? data.items : []);
      setPromos(Array.isArray(data.promotions) ? data.promotions : []);
    })();
  }, [slug]);

  const save = async () => {
    setSaving(true); setMsg("");
    const sb = supabase();
    const { data: { user } } = await sb.auth.getUser();
    const { error } = await sb.from("businesses")
      .update({ ...form, latitude: form.latitude ? parseFloat(form.latitude) : null, longitude: form.longitude ? parseFloat(form.longitude) : null, items, promotions: promos, updated_at: new Date().toISOString() })
      .eq("slug", slug).eq("owner_id", user!.id);
    setSaving(false);
    setMsg(error ? "❌ " + error.message : "✅ Guardado. Tu miniweb ya está actualizada.");
  };

  if (denied) return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-3xl">🔒</p>
      <h1 className="mt-4 text-xl font-bold">Este negocio no te pertenece.</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Solo el dueño puede editarlo. (Así protegemos a todos los comercios de la plataforma.)</p>
    </main>
  );
  if (!form) return <main className="px-4 py-20 text-center text-sm text-[var(--muted)]">Cargando…</main>;

  const inp = "w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]";
  const lbl = "mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Editar {b.name}</h1>
        <a href={`/negocio/${b.slug}`} target="_blank" className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm hover:border-[var(--accent)]">👁️ Ver en vivo</a>
      </div>

      <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 className="mb-4 font-semibold">📋 Datos del negocio</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className={lbl}>Nombre</span><input className={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label><span className={lbl}>WhatsApp</span><input className={inp} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, "") })} /></label>
          <label className="sm:col-span-2"><span className={lbl}>Descripción</span><textarea rows={3} className={inp + " resize-none"} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label><span className={lbl}>Dirección</span><input className={inp} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
          <label><span className={lbl}>Horarios</span><input className={inp} value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} /></label>
          <label><span className={lbl}>Instagram</span><input className={inp} value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></label>
          <label><span className={lbl}>Latitud (mapa)</span><input className={inp} value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="-32.7475" /></label>
          <label><span className={lbl}>Longitud (mapa)</span><input className={inp} value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="-60.7285" /></label>
          <div className="sm:col-span-2">
            <button type="button" onClick={async () => {
              try {
                const q = encodeURIComponent(form.address + ", San Lorenzo, Santa Fe, Argentina");
                const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + q);
                const j = await r.json();
                if (j[0]) { setForm({ ...form, latitude: j[0].lat, longitude: j[0].lon }); setMsg("📍 Dirección ubicada en el mapa. Tocá Guardar cambios."); }
                else setMsg("No encontré esa dirección, agregá más detalle (calle y número).");
              } catch { setMsg("No pude geolocalizar ahora, probá de nuevo."); }
            }} className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm hover:border-[var(--accent)]">
              📍 Ubicar en el mapa por dirección
            </button>
          </div>
          <label className="flex items-end gap-2 pb-3"><input type="checkbox" className="accent-[var(--accent)]" checked={form.open} onChange={(e) => setForm({ ...form, open: e.target.checked })} /> <span className="text-sm">Abierto ahora</span></label>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">️ Productos / servicios</h2>
          <button onClick={() => setItems([...items, { name: "", price: "", note: "", photo: "" }])} className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white">+ Agregar</button>
        </div>
        {items.length === 0 && <p className="text-sm text-[var(--muted)]">Agregá tu primer producto: nombre y precio (o "Consultar").</p>}
        <div className="grid gap-3">
          {items.map((it, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 sm:grid-cols-[80px_1fr_140px_40px] items-center">
              <ImageUploader value={it.photo} onChange={(url) => setItems(items.map((x, j) => j === i ? { ...x, photo: url } : x))} businessId={String(b.id)} itemId={String(i)} />
              <input className={inp} placeholder="Nombre (ej: Zapatillas urbanas)" value={it.name} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
              <input className={inp} placeholder="Precio (ej: $45.000)" value={it.price || ""} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} />
              <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="rounded-lg border border-[var(--line)] text-[var(--bad)] hover:border-[var(--bad)]">🗑</button>
            </div>
          ))}
        </div>
      </section>

      
      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">🔥 Promociones</h2>
          <button onClick={() => setPromos([...promos, { title: "", discount: "", expires: "" }])} className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white">+ Agregar</button>
        </div>
        {promos.length === 0 && <p className="text-sm text-[var(--muted)]">Creá promos con vencimiento: solas se apagan cuando terminan.</p>}
        <div className="grid gap-3">
          {promos.map((pr, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 sm:grid-cols-[1fr_120px_150px_40px]">
              <input className={inp} placeholder="Título (ej: 2x1 en texanas)" value={pr.title} onChange={(e) => setPromos(promos.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
              <input className={inp} placeholder="20% OFF" value={pr.discount} onChange={(e) => setPromos(promos.map((x, j) => j === i ? { ...x, discount: e.target.value } : x))} />
              <input type="date" className={inp} value={pr.expires} onChange={(e) => setPromos(promos.map((x, j) => j === i ? { ...x, expires: e.target.value } : x))} />
              <button onClick={() => setPromos(promos.filter((_, j) => j !== i))} className="rounded-lg border border-[var(--line)] text-[var(--bad)] hover:border-[var(--bad)]">🗑</button>
            </div>
          ))}
        </div>
      </section>

      {<ReviewModeration businessId={b.id} />}

      <div className="mt-6 flex items-center gap-4">
        <button onClick={save} disabled={saving} className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </main>
  );
}
