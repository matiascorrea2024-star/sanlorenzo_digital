"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import { Package, Edit, Trash2, Star, Eye, EyeOff } from "lucide-react";
import ImageUploader from "@/components/upload/image-uploader";

const emptyForm = () => ({
  name: "", description: "", price: "", old_price: "", category: "", stock: "",
  image: "", featured: false, imageId: crypto.randomUUID(),
});

export default function ProductosPage() {
  const { user } = useAuth();
  const [negocio, setNegocio] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

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

  const save = async () => {
    if (!negocio || !form.name || !form.price) return;
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
    if (editing) {
      await supabase().from("products").update(data).eq("id", editing.id);
    } else {
      await supabase().from("products").insert(data);
    }
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
    await supabase().from("products").delete().eq("id", id);
    setProductos(prev => prev.filter(p => p.id !== id));
  };

  const toggleActive = async (p: any) => {
    await supabase().from("products").update({ active: !p.active }).eq("id", p.id);
    setProductos(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x));
  };

  if (loading) return (
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
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
      <main className="min-h-screen bg-[#120d09] text-white pb-24">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <DashboardNav />
          <p>No tenés negocios. Creá uno primero.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <DashboardNav />
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-8 w-8 text-orange-400" />
          <div>
            <h1 className="text-3xl font-black">Mis Productos</h1>
            <p className="text-white/60">Gestioná el catálogo de {negocio.name}</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-6">
          <h2 className="text-lg font-black mb-4">{editing ? "✏️ Editar producto" : "➕ Nuevo producto"}</h2>
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
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              <Star className="h-4 w-4 text-yellow-400" /> Destacar este producto (aparece primero en el catálogo)
            </label>
            <div className="flex gap-2">
              <button onClick={save} disabled={!form.name || !form.price}
                className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-2.5 text-sm font-black disabled:opacity-50">
                {editing ? "Guardar cambios" : "Crear producto"}
              </button>
              {editing && (
                <button onClick={() => { setEditing(null); setForm(emptyForm()); }}
                  className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold">Cancelar</button>
              )}
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {productos.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
              Aún no tenés productos. Creá el primero arriba.
            </div>
          ) : (
            productos.map(p => (
              <div key={p.id} className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 ${p.active === false ? "opacity-50" : ""}`}>
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
            ))
          )}
        </div>
      </div>
    </main>
  );
}
