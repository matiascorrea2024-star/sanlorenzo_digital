"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, Copy, Check, Lightbulb, Sparkles, Loader2 } from "lucide-react";
import DashboardNav from "@/components/dashboard/dashboard-nav";

const TIPS = [
  { i: "📸", t: "Fotos con luz natural", d: "Una foto de día, sin flash, contra un fondo simple vende más que cualquier texto. Es lo primero que se ve." },
  { i: "⏰", t: "Ponele vencimiento a tus ofertas", d: "\"Termina hoy\" convierte mejor que \"oferta permanente\" -- la urgencia real funciona, la falsa se nota y espanta." },
  { i: "🎬", t: "Grabá un Reel del producto en uso", d: "15 segundos mostrando cómo se usa o se ve generan mucha más confianza que una sola foto estática." },
  { i: "💬", t: "Respondé rápido por el chat", d: "Los primeros minutos definen si el cliente te compra a vos o sigue buscando en otro lado." },
  { i: "🔁", t: "Publicá seguido, no todo junto", d: "Los negocios activos aparecen más en el Ranking y en Pulso -- mejor 3 publicaciones en la semana que 10 en un día." },
  { i: "⭐", t: "Pedí una reseña después de cada venta", d: "Las reseñas con foto son las que más convierten a otros compradores. Solo hace falta pedirla." },
  { i: "📣", t: "Etiquetate en el Chat de tu ciudad", d: "Cuando alguien pregunte por tu rubro, respondé y usá @tu-negocio -- te destaca frente a todos los que están mirando." },
  { i: "📆", t: "Usá Historia 24h para avisos del día", d: "\"Llegó stock nuevo\", \"hoy cerramos antes\" -- desaparece sola en 24hs, no ensucia tu perfil permanente." },
];

function generarCopy(datos: { producto: string; precio: string; precioAntes: string; descuento: string; negocio: string }) {
  const { producto, precio, precioAntes, descuento, negocio } = datos;
  const p = Number(precio) || 0;
  const pa = Number(precioAntes) || 0;
  const desc = Number(descuento) || (pa > p ? Math.round(((pa - p) / pa) * 100) : 0);
  const fmt = (n: number) => "$" + n.toLocaleString("es-AR");

  // Título según nivel de descuento
  let titulo = `✨ ${producto} en ${negocio}`;
  if (desc >= 40) titulo = `🔥 ${producto} con ${desc}% OFF — imperdible`;
  else if (desc >= 25) titulo = `⚡ ${producto} al ${desc}% OFF esta semana`;
  else if (desc >= 10) titulo = `🏷️ ${producto} con ${desc}% de descuento`;
  else if (p > 0) titulo = `✨ ${producto} a ${fmt(p)}`;

  // Descripción
  const descripcion = `Aprovechá ${producto} en ${negocio}.` +
    (pa > p ? ` Antes ${fmt(pa)}, ahora ${fmt(p)} (${desc}% OFF).` : ` Precio: ${fmt(p)}.`) +
    ` Stock limitado. ¡Te esperamos!`;

  // Copy para WhatsApp (para enviar a clientes)
  const whatsapp = `🔥 ¡OFERTA ESPECIAL en ${negocio}!\n\n` +
    `🛍️ ${producto}\n` +
    (pa > p ? `💰 Antes ${fmt(pa)} → AHORA ${fmt(p)}\n🏷️ ${desc}% de descuento\n` : `💰 ${fmt(p)}\n`) +
    `⏰ Por tiempo limitado\n\n` +
    `📍 Pasá por el local o reservá por este chat 👇`;

  return { titulo, descripcion, whatsapp, desc };
}

export default function AsistenteComerciantePage() {
  const router = useRouter();
  const [form, setForm] = useState({ producto: "", precio: "", precioAntes: "", descuento: "", negocio: "" });
  const [resultado, setResultado] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  // Upgrade opcional con IA real (app/api/assistant/generate). El generador
  // de arriba (reglas, instantáneo, gratis) sigue siendo el default -- esto
  // no reemplaza nada, es un botón aparte que puede no estar activado.
  const [iaEstado, setIaEstado] = useState<"idle" | "cargando" | "sin-configurar" | "error">("idle");

  const generar = () => {
    if (!form.producto) return;
    setResultado(generarCopy(form));
  };

  const generarConIA = async () => {
    if (!form.producto) return;
    setIaEstado("cargando");
    try {
      const res = await fetch("/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setIaEstado("error"); return; }
      if (!data.configured) { setIaEstado("sin-configurar"); return; }
      setResultado({ titulo: data.titulo, descripcion: data.descripcion, whatsapp: data.whatsapp, desc: Number(form.descuento) || 0 });
      setIaEstado("idle");
    } catch {
      setIaEstado("error");
    }
  };

  const copy = async (texto: string, key: string) => {
    await navigator.clipboard.writeText(texto);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const usarEnOferta = () => {
    if (!resultado) return;
    const params = new URLSearchParams({
      title: resultado.titulo,
      description: resultado.descripcion,
      price: form.precio,
      old_price: form.precioAntes,
      discount: String(resultado.desc),
    });
    router.push(`/dashboard/ofertas/nueva?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <DashboardNav />
        <div className="flex items-center gap-3 mb-6">
          <Wand2 className="h-8 w-8 text-[var(--accent-ink)]" />
          <div>
            <h1 className="text-3xl font-black" style={{ fontFamily: "var(--font-space)" }}>Asistente de publicaciones</h1>
            <p className="text-[var(--muted)]">Generá títulos, descripciones y copy para WhatsApp en segundos</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[var(--muted2)]">
            <Lightbulb className="h-3.5 w-3.5 text-[var(--accent-ink)]" /> Tips que realmente ayudan a vender
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {TIPS.map((tip) => (
              <div key={tip.t} className="rounded-[1.25rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1">
                <div className="flex items-start gap-2.5 rounded-[.9rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-3.5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                  <span className="text-lg leading-none">{tip.i}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{tip.t}</p>
                    <p className="mt-0.5 text-xs leading-snug text-[var(--muted)]">{tip.d}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
        <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
          <div className="space-y-3">
            <input value={form.producto} onChange={(e) => setForm({ ...form, producto: e.target.value })}
              placeholder="¿Qué vendés? Ej: Zapatillas deportivas *"
              className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
            <input value={form.negocio} onChange={(e) => setForm({ ...form, negocio: e.target.value })}
              placeholder="Nombre de tu negocio"
              className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
            <div className="grid grid-cols-3 gap-3">
              <input value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })}
                placeholder="Precio" type="number"
                className="rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
              <input value={form.precioAntes} onChange={(e) => setForm({ ...form, precioAntes: e.target.value })}
                placeholder="Precio anterior" type="number"
                className="rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
              <input value={form.descuento} onChange={(e) => setForm({ ...form, descuento: e.target.value })}
                placeholder="% OFF" type="number"
                className="rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={generar} disabled={!form.producto}
                className="flex-1 rounded-full bg-[var(--accent)] py-3 text-sm font-black disabled:opacity-50">
                ✨ Generar publicación
              </button>
              <button onClick={generarConIA} disabled={!form.producto || iaEstado === "cargando"}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--line-strong)] bg-[var(--ov-05)] py-3 text-sm font-black disabled:opacity-50">
                {iaEstado === "cargando" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Mejorar con IA
              </button>
            </div>
            {iaEstado === "sin-configurar" && (
              <p className="text-center text-xs text-[var(--muted2)]">
                La IA todavía no está activada para este sitio -- por ahora usá el generador por reglas de arriba.
              </p>
            )}
            {iaEstado === "error" && (
              <p className="text-center text-xs text-[var(--bad)]">
                No pudimos generar la publicación con IA. Probá de nuevo en un momento.
              </p>
            )}
          </div>
        </div>
        </div>

        {resultado && (
          <div className="space-y-4">
            {[
              { key: "titulo", label: "📌 Título sugerido", texto: resultado.titulo },
              { key: "descripcion", label: "📝 Descripción", texto: resultado.descripcion },
              { key: "whatsapp", label: "💬 Copy para WhatsApp", texto: resultado.whatsapp },
            ].map(item => (
              <div key={item.key} className="rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
                <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{item.label}</p>
                    <button onClick={() => copy(item.texto, item.key)}
                      className="flex items-center gap-1 rounded-full bg-[var(--ov-10)] px-3 py-1.5 text-xs font-bold hover:bg-[var(--ov-20)]">
                      {copied === item.key ? <Check className="h-3 w-3 text-[var(--ok)]" /> : <Copy className="h-3 w-3" />}
                      {copied === item.key ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                  <p className="text-sm whitespace-pre-line">{item.texto}</p>
                </div>
              </div>
            ))}

            <button onClick={usarEnOferta}
              className="w-full rounded-full bg-gradient-to-r from-[var(--ok)] to-emerald-500 py-3 text-sm font-black hover:opacity-90">
              🚀 Usar en nueva oferta
            </button>
            <p className="text-center text-xs text-[var(--muted2)]">
              Siempre podés editar todo antes de publicar.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
