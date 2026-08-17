"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import { Package, Edit, Trash2, Star, Eye, EyeOff, Images, X, Loader2 } from "lucide-react";
import ImageUploader from "@/components/upload/image-uploader";
import { uploadProductImage } from "@/lib/media";
import HowItWorks from "@/components/ui/how-it-works";
import { planDe, puedeAgregarProducto } from "@/lib/plans";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";
import Link from "next/link";

const emptyForm = () => ({
  name: "", description: "", price: "", old_price: "", category: "", stock: "",
  image: "", featured: false, imageId: crypto.randomUUID(),
});

type Pendiente = { id: string; file: File; preview: string; name: string; price: string; status: "pendiente" | "subiendo" | "ok" | "error" };

export default function ProductosPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [negocio, setNegocio] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [modo, setModo] = useState<"uno" | "rapida">("rapida");
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [guardandoTodo, setGuardandoTodo] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: biz } = await supabase().from("businesses").select("*").eq("owner_id", user.id).maybeSingle();
      if (biz) {
        setNegocio(biz);
        const { data: prods } = await supabase().from("products")
          .select("*").eq("business_id", biz.id)
          .order("featured", { ascending: false }).order("created_at", { ascending: false });
        setProductos(prods || []);
      }
      setLoading(false);
    })();
  }, [user]);

  const reload = async () => {
    const { data: prods } = await supabase().from("products")
      .select("*").eq("business_id", negocio.id)
      .order("featured", { ascending: false }).order("created_at", { ascending: false });
    setProductos(prods || []);
  };

  const planActual = planDe(negocio);
  const puedeSumar = editing || puedeAgregarProducto(negocio?.plan, productos.length);

  const save = async () => {
    if (!negocio || !form.name || !form.price) return;
    if (!puedeSumar) return;
    const data = {
      business_id: negocio.id,
      name: form.name,
      description: form.description,
      price: Number(form.price),
      old_price: form.old_price ? Number(form.old_price) : null,
      category: form.category || null,
      stock: form.stock ? Number(form.stock) : null,
      images: form.image ? [form.image] : [],
      featured: form.featured,
    };
    // active solo se setea al crear -- si el negocio lo ocultó con
    // toggleActive(), editar nombre/precio no debe reactivarlo solo.
    const { error } = editing
      ? await supabase().from("products").update(data).eq("id", editing.id)
      : await supabase().from("products").insert({ ...data, active: true });
    if (error) { show(`❌ ${friendlyError(error, "No se pudo guardar el producto.")}`, "error"); return; }
    await reload();
    setForm(emptyForm());
    setEditing(null);
  };

  const edit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      old_price: p.old_price ? String(p.old_price) : "",
      category: p.category || "",
      stock: p.stock ? String(p.stock) : "",
      image: Array.isArray(p.images) && p.images[0] ? p.images[0] : "",
      featured: !!p.featured,
      imageId: p.id,
    });
  };

  const del = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    const { error } = await supabase().from("products").delete().eq("id", id);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo eliminar el producto.")}`, "error"); return; }
    setProductos(prev => prev.filter(p => p.id !== id));
  };

  const toggleActive = async (p: any) => {
    const { error } = await supabase().from("products").update({ active: !p.active }).eq("id", p.id);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo actualizar el producto.")}`, "error"); return; }
    setProductos(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x));
  };

  // ===== Carga rápida: elegís varias fotos de una, completás nombre y
  // precio al lado de cada una, y se suben todas juntas. Pensado para
  // cargar un catálogo grande sin abrir el formulario 30 veces. =====
  const agregarFotos = (files: FileList | null) => {
    if (!files) return;
    const nuevos: Pendiente[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        preview: URL.createObjectURL(f),
        name: "",
        price: "",
        status: "pendiente" as const,
      }));
    setPendientes((prev) => [...prev, ...nuevos]);
  };

  const quitarPendiente = (id: string) => {
    setPendientes((prev) => {
      const p = prev.find((x) => x.id === id);
      if (p) URL.revokeObjectURL(p.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  const actualizarPendiente = (id: string, campo: "name" | "price", valor: string) => {
    setPendientes((prev) => prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)));
  };

  const listosParaGuardar = pendientes.filter((p) => p.name.trim() && p.price.trim());

  const cupoRestante = planActual.maxProductos === -1 ? Infinity : Math.max(0, planActual.maxProductos - productos.length);

  const guardarTodo = async () => {
    if (!negocio || listosParaGuardar.length === 0) return;
    setGuardandoTodo(true);
    for (const p of listosParaGuardar.slice(0, cupoRestante)) {
      setPendientes((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: "subiendo" } : x)));
      try {
        const url = await uploadProductImage(p.file, String(negocio.id), p.id);
        const { error } = await supabase().from("products").insert({
          business_id: negocio.id,
          name: p.name.trim(),
          price: Number(p.price),
          images: [url],
        });
        if (error) throw error;
        setPendientes((prev) => prev.filter((x) => x.id !== p.id));
        URL.revokeObjectURL(p.preview);
      } catch {
        setPendientes((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: "error" } : x)));
      }
    }
    setGuardandoTodo(false);
    await reload();
  };

  if (loading) return (
    <main className="min-h-screen bg-[#0c0a0b] text-white pb-24">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-8 w-40 animate-pulse rounded bg-white/10" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      </div>
    </main>
  );

  if (!negocio) {
    return (
      <main className="min-h-screen bg-[#0c0a0b] text-white pb-24">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <DashboardNav />
          <p>No tenés negocios. Creá uno primero.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0c0a0b] text-white pb-24">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <DashboardNav />
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-8 w-8 text-orange-400" />
          <div>
            <h1 className="text-3xl font-black" style={{ fontFamily: "var(--font-space)" }}>Mis Productos</h1>
            <p className="text-white/60">
              Gestioná el catálogo de {negocio.name}
              {planActual.maxProductos !== -1 && (
                <span className="text-white/40"> · {productos.length}/{planActual.maxProductos} productos (Plan {planActual.name})</span>
              )}
            </p>
          </div>
        </div>

        {!puedeSumar && (
          <div className="mb-4 rounded-[1.5rem] border border-orange-400/25 bg-gradient-to-r from-orange-500/[.08] to-red-600/[.04] p-1.5">
            <div className="flex flex-col items-start justify-between gap-3 rounded-[1.1rem] border border-white/[.06] bg-black/20 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)] sm:flex-row sm:items-center">
              <p className="text-sm">Llegaste al límite de {planActual.maxProductos} productos del plan {planActual.name}.</p>
              <Link href="/dashboard/planes" className="shrink-0 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-black hover:opacity-90">Mejorar plan →</Link>
            </div>
          </div>
        )}

        <HowItWorks steps={[
          "Elegí varias fotos de tus productos de una sola vez (podés sacarlas con el celu en el momento).",
          "Ponele nombre y precio a cada una -- lo demás (descripción, stock, categoría) lo podés completar después.",
          "Tocá \"Guardar todo\" y se suben y publican todas juntas en tu catálogo.",
        ]} />

        {!editing && (
          <div className="mb-4 flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5">
            <button
              onClick={() => setModo("rapida")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${modo === "rapida" ? "bg-gradient-to-r from-orange-500 to-red-600 text-white" : "text-white/60 hover:text-white"}`}
            >
              <Images className="h-4 w-4" /> Carga rápida por fotos
            </button>
            <button
              onClick={() => setModo("uno")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${modo === "uno" ? "bg-gradient-to-r from-orange-500 to-red-600 text-white" : "text-white/60 hover:text-white"}`}
            >
              <Package className="h-4 w-4" /> Agregar de a uno
            </button>
          </div>
        )}

        {/* Carga rápida por fotos */}
        {modo === "rapida" && !editing && (
          <div className="mb-6 rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
          <div className="rounded-[1.375rem] border border-white/[.05] bg-black/10 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
            <h2 className="text-lg font-black mb-1">Carga rápida</h2>
            <p className="mb-4 text-sm text-white/50">Elegí todas las fotos que quieras cargar ahora.</p>
            <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[.03] text-white/50 transition hover:border-orange-400/60 hover:text-white">
              <Images className="h-6 w-6" />
              <span className="text-sm font-bold">Elegir fotos</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { agregarFotos(e.target.files); e.target.value = ""; }} />
            </label>

            {pendientes.length > 0 && (
              <div className="mt-5 space-y-3">
                {pendientes.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <img src={p.preview} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                      <input value={p.name} onChange={(e) => actualizarPendiente(p.id, "name", e.target.value)}
                        placeholder="Nombre del producto *" disabled={p.status === "subiendo"}
                        className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-orange-400 disabled:opacity-50" />
                      <input value={p.price} onChange={(e) => actualizarPendiente(p.id, "price", e.target.value)}
                        placeholder="Precio *" type="number" disabled={p.status === "subiendo"}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-orange-400 disabled:opacity-50 sm:w-32" />
                    </div>
                    {p.status === "subiendo" ? (
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-orange-400" />
                    ) : p.status === "error" ? (
                      <span title="No se pudo subir -- probá de nuevo" className="shrink-0 text-xs font-bold text-red-400">Error</span>
                    ) : (
                      <button onClick={() => quitarPendiente(p.id)} aria-label="Quitar foto" className="shrink-0 rounded-lg bg-white/10 p-2 hover:bg-red-500/20">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={guardarTodo}
                  disabled={guardandoTodo || listosParaGuardar.length === 0 || cupoRestante <= 0}
                  className="w-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 py-3 text-sm font-black disabled:opacity-50"
                >
                  {guardandoTodo ? "Guardando..." : `Guardar todo (${Math.min(listosParaGuardar.length, cupoRestante)})`}
                </button>
                {pendientes.length > listosParaGuardar.length && !guardandoTodo && (
                  <p className="text-center text-xs text-white/40">Completá nombre y precio en todas para poder guardarlas.</p>
                )}
                {isFinite(cupoRestante) && listosParaGuardar.length > cupoRestante && (
                  <p className="text-center text-xs text-orange-300">Tu plan permite {cupoRestante} más -- el resto queda pendiente hasta que mejores el plan.</p>
                )}
              </div>
            )}
          </div>
          </div>
        )}

        {/* Formulario de a uno (también se usa para editar) */}
        <div className={`mb-6 rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5 ${modo === "rapida" && !editing ? "hidden" : ""}`}>
        <div className="rounded-[1.375rem] border border-white/[.05] bg-black/10 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
          <h2 className="text-lg font-black mb-4">{editing ? "Editar producto" : "Nuevo producto"}</h2>
          <div className="space-y-3">
            <ImageUploader
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              businessId={String(negocio.id)}
              itemId={form.imageId}
              previewClass="h-40 w-full rounded-xl"
            />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre del producto *" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descripción" rows={2} className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
            <div className="grid grid-cols-2 gap-3">
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Precio *" type="number" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
              <input value={form.old_price} onChange={(e) => setForm({ ...form, old_price: e.target.value })}
                placeholder="Precio anterior (opcional)" type="number" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Categoría" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
              <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="Stock (opcional)" type="number" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
            </div>
            {planActual.destacarCatalogo ? (
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                <Star className="h-4 w-4 text-yellow-400" /> Destacar este producto (aparece primero en el catálogo)
              </label>
            ) : (
              <Link href="/dashboard/planes" className="flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300">
                <Star className="h-3.5 w-3.5" /> Destacar productos es de Plan PRO -- mejorar plan →
              </Link>
            )}
            <div className="flex gap-2">
              <button onClick={save} disabled={!form.name || !form.price || !puedeSumar}
                className="flex-1 rounded-full bg-gradient-to-r from-orange-500 to-red-600 py-2.5 text-sm font-black disabled:opacity-50">
                {editing ? "Guardar cambios" : "Crear producto"}
              </button>
              {editing && (
                <button onClick={() => { setEditing(null); setForm(emptyForm()); }}
                  className="rounded-full border border-white/20 px-4 py-2.5 text-sm font-bold">Cancelar</button>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {productos.length === 0 ? (
            <div className="rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5">
              <div className="rounded-[1.1rem] border border-white/[.05] bg-black/10 p-8 text-center text-white/50">
                Aún no tenés productos. Creá el primero arriba.
              </div>
            </div>
          ) : (
            productos.map(p => (
              <div key={p.id} className="rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5">
              <div className={`flex items-center gap-3 rounded-[1.1rem] border border-white/[.05] bg-black/10 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)] ${p.active === false ? "opacity-50" : ""}`}>
                {Array.isArray(p.images) && p.images[0] ? (
                  <img src={p.images[0]} alt={p.name} className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20">
                    <Package className="h-6 w-6 text-orange-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold flex items-center gap-1.5">
                    {p.name}
                    {p.featured && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
                    {p.active === false && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase text-white/50">Oculto</span>}
                  </p>
                  <p className="text-xs text-white/50">{p.category || "Sin categoría"} · Stock: {p.stock ?? "—"}</p>
                  <p className="text-sm font-black text-orange-400">${Number(p.price).toLocaleString("es-AR")}</p>
                </div>
                <button onClick={() => toggleActive(p)} title={p.active === false ? "Mostrar en el catálogo" : "Ocultar del catálogo"}
                  className="rounded-lg bg-white/10 p-2 hover:bg-white/20">
                  {p.active === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button onClick={() => edit(p)} className="rounded-lg bg-white/10 p-2 hover:bg-white/20">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => del(p.id)} className="rounded-lg bg-red-500/20 p-2 hover:bg-red-500/30">
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
