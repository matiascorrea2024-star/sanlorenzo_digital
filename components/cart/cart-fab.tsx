"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ShoppingBasket, X, Trash2, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart-context";

const fmt = (n: number) => "$" + n.toLocaleString("es-AR");

export default function CartFab() {
  const { items, removeItem, clear } = useCart();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (items.length === 0) return null;

  // Agrupado por negocio: cada uno recibe SU pedido armado por WhatsApp,
  // por separado -- no hay pago online, esto solo evita que el vecino
  // tenga que escribir a mano lo que quiere en cada comercio.
  const porNegocio = items.reduce<Record<string, typeof items>>((acc, it) => {
    (acc[it.businessId] ||= []).push(it);
    return acc;
  }, {});

  const mensajeWhatsapp = (grupo: typeof items) => {
    const lineas = grupo.map((i) => `• ${i.title}${i.price ? ` (${fmt(i.price)})` : ""}`).join("\n");
    return `Hola! Te escribo desde La Gran Barata Digital, quería consultar por:\n\n${lineas}`;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Ver changuito, ${items.length} ${items.length === 1 ? "producto" : "productos"}`}
        className="fixed bottom-[8.5rem] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-blue-500/40 transition hover:scale-110 md:bottom-24 md:h-14 md:w-14"
      >
        <ShoppingBasket className="h-5 w-5 text-white md:h-6 md:w-6" />
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
          {items.length}
        </span>
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[300] flex items-end bg-black/70 backdrop-blur-sm md:items-center md:justify-center">
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-[1.75rem] border border-white/10 bg-[#141112] p-5 md:max-w-lg md:rounded-[1.75rem]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-black">
                <ShoppingBasket className="h-5 w-5 text-sky-400" /> Mi Changuito
              </h2>
              <button onClick={() => setOpen(false)} aria-label="Cerrar"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-5 text-xs text-white/50">
              Juntá lo que te interesa de distintos negocios y mandale a cada uno su pedido armado por WhatsApp, en un toque. No se cobra nada acá -- cada compra se arregla directo con el comercio.
            </p>

            <div className="space-y-5">
              {Object.entries(porNegocio).map(([businessId, grupo]) => (
                <div key={businessId} className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                  <Link href={`/negocio/${grupo[0].businessSlug}`} onClick={() => setOpen(false)}
                    className="mb-2 block text-sm font-black text-white hover:text-orange-300">
                    {grupo[0].businessName}
                  </Link>
                  <div className="space-y-1.5">
                    {grupo.map((it) => (
                      <div key={it.id} className="flex items-center justify-between gap-2 text-sm text-white/75">
                        <span className="truncate">{it.title}</span>
                        <div className="flex shrink-0 items-center gap-2">
                          {it.price ? <span className="font-bold text-white/90">{fmt(it.price)}</span> : null}
                          <button onClick={() => removeItem(it.id)} aria-label={`Quitar ${it.title}`}
                            className="text-white/30 hover:text-red-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {grupo[0].businessWhatsapp ? (
                    <a
                      href={`https://wa.me/${String(grupo[0].businessWhatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(mensajeWhatsapp(grupo))}`}
                      target="_blank" rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 rounded-full bg-green-500/15 border border-green-400/30 py-2.5 text-sm font-bold text-green-300 hover:bg-green-500/25"
                    >
                      <MessageCircle className="h-4 w-4" /> Enviar pedido a {grupo[0].businessName}
                    </a>
                  ) : (
                    <p className="mt-3 text-center text-xs text-white/40">Este negocio todavía no cargó WhatsApp -- entrá a su página para ver otras formas de contacto.</p>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => { clear(); setOpen(false); }}
              className="mt-5 w-full rounded-full border border-white/10 py-2.5 text-xs font-bold text-white/50 hover:text-white/80">
              Vaciar changuito
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
