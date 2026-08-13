"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PLATFORM_WHATSAPP, PLAN_PREMIUM_PRICE } from "@/lib/config";
import LevelBadge from "@/components/business/level-badge";
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
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data } = await sb.from("businesses").select("*").eq("slug", slug).eq("owner_id", user.id).maybeSingle();
      if (!data) { setDenied(true); return; }
      setB(data);
      setForm({
        name: data.name,
        description: data.description || "",
        address: data.address || "",
        schedule: data.schedule || "",
        whatsapp: data.whatsapp || "",
        instagram: data.instagram || "",
        open: !!data.open,
        latitude: data.latitude != null ? String(data.latitude) : "",
        longitude: data.longitude != null ? String(data.longitude) : "",
        portada_url: data.portada_url || "",
        logo_url: data.logo_url || "",
      });
      setItems(Array.isArray(data.items) ? data.items : []);
      setPromos(Array.isArray(data.promotions) ? data.promotions : []);
    })();
  }, [slug]);

  useEffect(() => {
    (async () => {
      if (!b) return;
      const desde = new Date(Date.now() - 6 * 86400000).toISOString();
      const { data } = await supabase()
        .from("metrics")
        .select("type, created_at")
        .eq("business_id", b.id)
        .gte("created_at", desde);
      const evs = data || [];
      const days: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const f = new Date(Date.now() - i * 86400000);
        days.push({ d: f.toLocaleDateString("es-AR", { weekday: "short" }), key: f.toISOString().slice(0, 10), n: 0 });
      }
      let views = 0, wa = 0;
      evs.forEach((e: any) => {
        if (e.type === "view") views++;
        if (e.type === "whatsapp") wa++;
        if (e.type === "view") {
          const day = days.find((x) => x.key === e.created_at.slice(0, 10));
          if (day) day.n++;
        }
      });
      setStats({ views, wa, days });
    })();
  }, [b]);

  const save = async () => {
    setSaving(true); setMsg("");
    const sb = supabase();
    const { data: { user } } = await sb.auth.getUser();
    const { error } = await sb.from("businesses")
      .update({
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        portada_url: form.portada_url || null,
        logo_url: form.logo_url || null,
        items, promotions: promos, updated_at: new Date().toISOString()
      })
      .eq("slug", slug).eq("owner_id", user!.id);
    setSaving(false);
    setMsg(error ? "❌ " + error.message : "✅ Guardado. Tu miniweb ya está actualizada.");
  };

  if (denied) return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-3xl">🔒</p>
      <h1 className="mt-4 text-xl font-bold">Este negocio no te pertenece.</h1>
      <p className="mt-2 text-sm text-white/60">Solo el dueño puede editarlo.</p>
    </main>
  );
  if (!form) return <main className="px-4 py-20 text-center text-sm text-white/60">Cargando…</main>;

  const inp = "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-orange-400";
  const lbl = "mb-1 block text-xs font-semibold uppercase tracking-wider text-white/60";

  return (
    <main className="bg-[#0d0a12] text-white min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black">Editar {b.name}</h1>
          <a href={`/negocio/${b.slug}`} target="_blank" className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:border-orange-400">👁️ Ver en vivo</a>
        </div>

        {/* 📸 FOTOS DEL NEGOCIO */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 font-bold">📸 Fotos de tu negocio</h2>
          <p className="mb-4 text-sm text-white/60">La foto de portada aparece en la home y en el directorio. El logo aparece junto al nombre en tu miniweb.</p>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <span className={lbl}>Foto de portada (16:9)</span>
              <ImageUploader
                value={form.portada_url}
                onChange={(url) => setForm({ ...form, portada_url: url })}
                businessId={String(b.id)}
                itemId="portada"
              />
              {form.portada_url && (
                <img src={form.portada_url} alt="portada" className="mt-2 w-full rounded-lg object-cover h-24" />
              )}
            </div>
            <div>
              <span className={lbl}>Logo (cuadrado)</span>
              <ImageUploader
                value={form.logo_url}
                onChange={(url) => setForm({ ...form, logo_url: url })}
                businessId={String(b.id)}
                itemId="logo"
              />
              {form.logo_url && (
                <img src={form.logo_url} alt="logo" className="mt-2 h-24 w-24 rounded-lg object-cover" />
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 font-bold">📋 Datos del negocio</h2>
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
                  else setMsg("No encontré esa dirección, agregá más detalle.");
                } catch { setMsg("No pude geolocalizar ahora."); }
              }} className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:border-orange-400">
                📍 Ubicar en el mapa por dirección
              </button>
            </div>
            <label className="flex items-end gap-2 pb-3"><input type="checkbox" checked={form.open} onChange={(e) => setForm({ ...form, open: e.target.checked })} /> <span className="text-sm">Abierto ahora</span></label>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">🛍️ Productos / servicios</h2>
            <button onClick={() => setItems([...items, { name: "", price: "", note: "", photo: "" }])} className="rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-1.5 text-sm font-bold text-white">+ Agregar</button>
          </div>
          {items.length === 0 && <p className="text-sm text-white/50">Agregá tu primer producto.</p>}
          <div className="grid gap-3">
            {items.map((it, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 sm:grid-cols-[80px_1fr_140px_40px] items-center">
                <ImageUploader value={it.photo} onChange={(url) => setItems(items.map((x, j) => j === i ? { ...x, photo: url } : x))} businessId={String(b.id)} itemId={String(i)} />
                <input className={inp} placeholder="Nombre" value={it.name} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                <input className={inp} placeholder="Precio" value={it.price || ""} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} />
                <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="rounded-lg border border-white/20 text-red-400 hover:border-red-400">🗑</button>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">🔥 Promociones</h2>
            <button onClick={() => setPromos([...promos, { title: "", discount: "", expires: "" }])} className="rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-1.5 text-sm font-bold text-white">+ Agregar</button>
          </div>
          {promos.length === 0 && <p className="text-sm text-white/50">Creá promos con vencimiento: solas se apagan cuando terminan.</p>}
          <div className="grid gap-3">
            {promos.map((pr, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 sm:grid-cols-[1fr_120px_150px_40px]">
                <input className={inp} placeholder="Título (ej: 2x1 en texanas)" value={pr.title} onChange={(e) => setPromos(promos.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
                <input className={inp} placeholder="20% OFF" value={pr.discount} onChange={(e) => setPromos(promos.map((x, j) => j === i ? { ...x, discount: e.target.value } : x))} />
                <div>
                <select
                  className={inp}
                  value={pr.duracion || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    const ahora = Date.now();
                    setPromos(promos.map((x, j) => {
                      if (j !== i) return x;
                      if (v.endsWith("h")) {
                        const h = parseInt(v);
                        const fin = new Date(ahora + h * 3600000);
                        return { ...x, duracion: v, expires_at: fin.toISOString(), expires: fin.toISOString().slice(0, 10) };
                      }
                      const d = parseInt(v);
                      const fin = new Date(ahora + d * 86400000);
                      return { ...x, duracion: v, expires_at: null, expires: fin.toISOString().slice(0, 10) };
                    }));
                  }}
                >
                  <option value="" className="bg-neutral-900 text-white">⏱ Duración…</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 24].map((h) => (
                    <option key={h} value={h + "h"} className="bg-neutral-900 text-white">🔥 {h} hora{h > 1 ? "s" : ""} (relámpago)</option>
                  ))}
                  {[2, 3, 4, 5, 6, 7].map((d) => (
                    <option key={d} value={d + "d"} className="bg-neutral-900 text-white">📅 {d} días</option>
                  ))}
                </select>
                {pr.expires_at && (
                  <p className="mt-1 text-[10px] text-red-300">
                    ⏰ Termina {new Date(pr.expires_at).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} hs
                  </p>
                )}
              </div>
                <button onClick={() => setPromos(promos.filter((_, j) => j !== i))} className="rounded-lg border border-white/20 text-red-400 hover:border-red-400">🗑</button>
              </div>
            ))}
          </div>
        </section>

        
        
        
        {/* 💰 Premium */}
        <section className="mt-6 rounded-2xl border border-yellow-400/40 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-6">
          <h2 className="mb-2 font-black text-yellow-300">⭐ Plan Premium — ${PLAN_PREMIUM_PRICE.toLocaleString("es-AR")}/mes</h2>
          {b.destacado ? (
            <p className="text-sm text-green-300 font-bold">🎉 Ya sos Premium: tu negocio aparece destacado en la home con badge ⭐.</p>
          ) : (
            <>
              <ul className="text-sm text-white/70 space-y-1 mb-4">
                <li>⭐ Destacado en la home con badge PREMIUM</li>
                <li>🔥 Ofertas ilimitadas en La Gran Barata</li>
                <li>📊 Estadísticas completas de visitas</li>
                <li> Prioridad en el directorio y el mapa</li>
              </ul>
              <a
                href={`https://wa.me/${PLATFORM_WHATSAPP}?text=${encodeURIComponent("¡Hola! Quiero el Plan Premium para mi negocio: " + b.name)}`}
                target="_blank"
                className="inline-block rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 px-5 py-2.5 text-sm font-black text-black hover:opacity-90"
              >
                💬 Pedir Premium por WhatsApp
              </a>
            </>
          )}
        </section>

        {/* 📊 Estadísticas */}
        {stats && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4"><LevelBadge businessId={String(b.id)} verificado={b.status === "verificado"} /></div>
            <h2 className="mb-4 font-bold">📊 Estadísticas de tu negocio (últimos 7 días)</h2>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="rounded-xl bg-black/20 p-4 text-center">
                <p className="text-3xl font-black text-orange-400">{stats.views}</p>
                <p className="text-xs text-white/60 uppercase mt-1">👁 Vistas a tu miniweb</p>
              </div>
              <div className="rounded-xl bg-black/20 p-4 text-center">
                <p className="text-3xl font-black text-green-400">{stats.wa}</p>
                <p className="text-xs text-white/60 uppercase mt-1">💬 Clicks a WhatsApp</p>
              </div>
            </div>
            <p className="text-xs text-white/50 mb-2">Vistas por día:</p>
            <div className="flex items-end gap-2">
              {stats.days.map((d: any, i: number) => {
                const max = Math.max(...stats.days.map((x: any) => x.n), 1);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-white/60">{d.n}</span>
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-orange-500 to-pink-500"
                      style={{ height: `${(d.n / max) * 70 + 4}px` }}
                    />
                    <span className="text-[10px] text-white/50">{d.d}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 🤳 QR */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-2 font-bold">🤳 QR de tu negocio</h2>
          <p className="mb-4 text-sm text-white/60">Imprimilo y pegalo en tu vidriera: los clientes lo escanean y caen directo en tu miniweb.</p>
          <div className="flex items-center gap-6 flex-wrap">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent("https://sanlorenzodigital.vercel.app/negocio/" + b.slug)}`}
              alt="QR de tu negocio"
              className="h-36 w-36 rounded-xl bg-white p-2"
            />
            <button
              onClick={async () => {
                try {
                  const r = await fetch("https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=" + encodeURIComponent("https://sanlorenzodigital.vercel.app/negocio/" + b.slug));
                  const blob = await r.blob();
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "qr-" + b.slug + ".png";
                  a.click();
                } catch { alert("No se pudo descargar el QR ahora."); }
              }}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:border-orange-400"
            >
              ⬇️ Descargar QR en alta calidad
            </button>
          </div>
        </section>

        <ReviewModeration businessId={b.id} />

        <div className="mt-6 flex items-center gap-4">
          <button onClick={save} disabled={saving} className="rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-black text-white hover:opacity-90 disabled:opacity-40">
            {saving ? "Guardando…" : "💾 Guardar cambios"}
          </button>
          {msg && <span className="text-sm">{msg}</span>}
        </div>
      </div>
    </main>
  );
}
