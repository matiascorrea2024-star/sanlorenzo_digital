"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";
import ImageUploader from "@/components/upload/image-uploader";
import { PLANES, planDe, puedePublicarOferta, puedePublicarHoy, OFERTA_DURACION_MAX_DIAS } from "@/lib/plans";
import { friendlyError } from "@/lib/friendly-error";
import HowItWorks from "@/components/ui/how-it-works";

const inp = "w-full rounded-xl border border-white/15 bg-white/[.06] px-4 py-3 text-sm text-white focus:border-orange-400/60 focus:outline-none transition";
const lbl = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/60";

export default function NuevaOferta() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bienvenida = searchParams.get("bienvenida") === "1";
  const bizFromUrl = searchParams.get("biz");
  const { show } = useToast();
  const [negocios, setNegocios] = useState<any[]>([]);
  const [biz, setBiz] = useState("");
  const [title, setTitle] = useState("");
  const [product, setProduct] = useState("");
  const [description, setDescription] = useState("");
  const [priceBefore, setPriceBefore] = useState("");
  const [priceOffer, setPriceOffer] = useState("");
  // Por defecto una semana -- así "Válida hasta" no es un campo obligatorio
  // más para pensar; el comerciante lo cambia si quiere otra duración.
  const [expires, setExpires] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [image, setImage] = useState("");
  const [imageId] = useState(() => crypto.randomUUID());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [limite, setLimite] = useState<{ plan: string; activas: number; hoy: number } | null>(null);
  const [hoyStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [maxFechaStr] = useState(() => new Date(Date.now() + OFERTA_DURACION_MAX_DIAS * 86400000).toISOString().slice(0, 10));

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: prof } = await sb.from("user_profiles").select("role").eq("user_id", user.id).maybeSingle();

      const q = sb.from("businesses").select("id, name, plan").order("name");
      if (prof?.role !== "admin") q.eq("owner_id", user.id);
      const { data, error } = await q;
      if (error) { setError(friendlyError(error, "No se pudieron cargar tus negocios. Probá de nuevo.")); return; }

      const list = (data || []).filter((n: any) => n.name);
      setNegocios(list);
      if (list.length === 0) { setError("No tenés negocios creados. Primero creá un negocio."); return; }
      const elegido = (bizFromUrl && list.find((n: any) => n.id === bizFromUrl)) || list[0];
      setBiz(elegido.id);
    })();
  }, []);

  // Chequeo de límite del plan cada vez que cambia el negocio elegido.
  useEffect(() => {
    if (!biz) return;
    (async () => {
      const sb = supabase();
      const negocio = negocios.find((n) => n.id === biz);
      const plan = negocio?.plan || "gratis";
      const hoyStr = new Date().toISOString().slice(0, 10);
      const [{ count: activas }, { count: hoy }] = await Promise.all([
        sb.from("offers").select("*", { count: "exact", head: true }).eq("business_id", biz).eq("active", true),
        sb.from("offers").select("*", { count: "exact", head: true }).eq("business_id", biz).gte("created_at", hoyStr),
      ]);
      setLimite({ plan, activas: activas || 0, hoy: hoy || 0 });
    })();
  }, [biz, negocios]);

  const desc =
    Number(priceBefore) > 0 && Number(priceOffer) >= 0 && Number(priceOffer) < Number(priceBefore)
      ? Math.round((1 - Number(priceOffer) / Number(priceBefore)) * 100)
      : 0;

  const publicar = async () => {
    setError("");

    if (!biz) { setError("Seleccioná un negocio"); return; }
    if (title.trim().length < 10) { setError("El título debe tener al menos 10 caracteres."); return; }
    if (description.trim().length < 30) { setError("La descripción debe tener al menos 30 caracteres -- contá bien de qué se trata."); return; }
    if (!image.trim()) { setError("La oferta necesita una foto."); return; }
    if (!expires) { setError("Completá la fecha de vencimiento."); return; }
    if (expires < hoyStr) { setError("La fecha de vencimiento no puede ser en el pasado."); return; }
    if (expires > maxFechaStr) { setError(`La oferta puede durar hasta ${OFERTA_DURACION_MAX_DIAS} días. Elegí una fecha más cercana.`); return; }
    if (priceBefore && priceOffer && Number(priceOffer) >= Number(priceBefore)) { setError("El precio de oferta tiene que ser menor al precio anterior."); return; }

    if (limite) {
      if (!puedePublicarOferta(limite.plan, limite.activas)) {
        setError(`Con el plan ${planDe({ plan: limite.plan }).name} podés tener hasta ${PLANES[limite.plan]?.maxOfertas ?? 3} ofertas activas a la vez. Pausá una o mejorá tu plan.`);
        return;
      }
      if (!puedePublicarHoy(limite.plan, limite.hoy)) {
        setError(`Con el plan ${planDe({ plan: limite.plan }).name} podés publicar ${PLANES[limite.plan]?.ofertasNuevasPorDia ?? 1} oferta${(PLANES[limite.plan]?.ofertasNuevasPorDia ?? 1) > 1 ? "s" : ""} por día. Probá mañana o mejorá tu plan.`);
        return;
      }
    }

    setSaving(true);
    const sb = supabase();

    const { error: e } = await sb.from("offers").insert({
      business_id: biz,
      title: title.trim(),
      product: product.trim() || null,
      description: description.trim(),
      old_price: priceBefore ? Number(priceBefore) : null,
      offer_price: priceOffer ? Number(priceOffer) : null,
      discount_percent: desc > 0 ? desc : null,
      valid_until: expires,
      image_url: image.trim() || null,
      active: true,
    });

    setSaving(false);
    if (e) { setError(friendlyError(e, "No se pudo publicar la oferta. Probá de nuevo.")); return; }
    show(bienvenida ? "🎉 ¡Tu primera oferta ya está viva en la plataforma!" : "🔥 Oferta publicada en toda la plataforma", "success");
    setTimeout(() => router.push(bienvenida ? "/dashboard/ofertas?bienvenida=1" : "/dashboard/ofertas"), 900);
  };

  const planActual = limite ? planDe({ plan: limite.plan }) : null;
  const limiteActivas = limite ? PLANES[limite.plan]?.maxOfertas ?? 3 : null;
  const limiteHoy = limite ? PLANES[limite.plan]?.ofertasNuevasPorDia ?? 1 : null;

  return (
    <main className="min-h-screen bg-[#120d09] pb-24 text-white">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link href="/dashboard/ofertas" className="text-sm text-orange-400 hover:text-orange-300">← Volver a mis ofertas</Link>

        {bienvenida && (
          <div className="mt-4 rounded-2xl border border-green-400/40 bg-green-500/10 p-4">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-white/60">
              <span className="text-green-300">✓ Tu negocio</span>
              <span className="text-white/30" aria-hidden>→</span>
              <span className="text-white/45">Catálogo (opcional)</span>
              <span className="text-white/30" aria-hidden>→</span>
              <span className="text-orange-300">Tu primera oferta</span>
              <span className="text-white/30" aria-hidden>→</span>
              <span className="text-white/45">Publicá</span>
            </div>
            <p className="mt-2 font-black text-green-300">🎉 ¡Tu negocio ya está creado!</p>
            <p className="mt-1 text-sm text-white/70">Publicá tu primera oferta para que te empiecen a encontrar. El catálogo de productos podés cargarlo después, no hace falta ahora.</p>
          </div>
        )}

        <h1 className="mt-3 text-3xl font-black">Nueva Oferta</h1>
        <p className="mt-1 text-sm text-white/60">Se publica al instante en la home, el radar, el mapa y tu miniweb.</p>

        <div className="mt-4">
          <HowItWorks steps={[
            "Completá los datos: qué vendés, precios y hasta cuándo dura la oferta.",
            "Sumale una foto clara -- las ofertas con foto se comparten y se miran mucho más.",
            "Tocá \"Publicar Oferta\": aparece al instante en la home, el mapa, el radar y tu miniweb, sin esperar aprobación.",
          ]} />
        </div>

        {limite && planActual && limiteActivas !== -1 && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60">
            Plan <b className="text-white/80">{planActual.name}</b>: {limite.activas}/{limiteActivas} ofertas activas · {limite.hoy}/{limiteHoy} publicadas hoy.
            {(limite.activas >= (limiteActivas || 0) || limite.hoy >= (limiteHoy || 0)) && (
              <> <Link href="/dashboard/planes" className="font-bold text-orange-400 hover:text-orange-300">Mejorar plan →</Link></>
            )}
          </div>
        )}

        <div className="mt-4 space-y-5 rounded-3xl border border-orange-400/20 bg-gradient-to-b from-white/[.07] to-white/[.03] p-6 shadow-xl shadow-orange-500/10">
          {negocios.length === 0 ? (
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4">
              <p className="text-sm text-yellow-300">⚠️ No tenés negocios creados. <Link href="/dashboard/nuevo" className="underline font-bold">Crear uno ahora →</Link></p>
            </div>
          ) : (
            <div>
              <span className={lbl}>Negocio *</span>
              <select className={inp} value={biz} onChange={(e) => setBiz(e.target.value)}>
                {negocios.map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <span className={lbl}>Título de la oferta * <span className="normal-case font-normal text-white/30">(mín. 10 caracteres)</span></span>
            <input className={inp} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: 2×1 en zapatillas seleccionadas" />
          </div>

          <div>
            <span className={lbl}>Nombre del producto o servicio (opcional)</span>
            <input className={inp} value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Ej: Zapatillas Nike Air" />
            <p className="mt-1 text-[11px] text-white/40">Aparece como subtítulo debajo del título de la oferta. Si tu título ya es bien específico, podés dejarlo vacío.</p>
          </div>

          <div>
            <span className={lbl}>Descripción * <span className="normal-case font-normal text-white/30">(mín. 30 caracteres)</span></span>
            <textarea className={inp} rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Contá los detalles: qué incluye, condiciones, hasta cuándo dura el stock..." />
            <p className="mt-1 text-right text-[10px] text-white/30">{description.trim().length}/30</p>
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
            <span className={lbl}>Válida hasta * <span className="normal-case font-normal text-white/30">(máx. {OFERTA_DURACION_MAX_DIAS} días)</span></span>
            <input className={inp} type="date" min={hoyStr} max={maxFechaStr} value={expires} onChange={(e) => setExpires(e.target.value)} />
          </div>

          <div>
            <span className={lbl}>Foto de la oferta *</span>
            <ImageUploader value={image} onChange={setImage} businessId={biz || "temp"} itemId={imageId} previewClass="h-40 w-full rounded-xl" />
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
              <p className="text-sm font-bold text-red-300">❌ {error}</p>
            </div>
          )}

          <button
            onClick={publicar}
            disabled={saving || negocios.length === 0}
            className="btn-shine w-full rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3.5 text-sm font-black transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "⏳ Publicando…" : "🔥 Publicar Oferta"}
          </button>
        </div>
      </div>
    </main>
  );
}
