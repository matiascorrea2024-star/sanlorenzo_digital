"use client";
// QR de vidriera: el comercio imprime este QR, el cliente lo escanea en el
// local y cae en la ficha con ?src=qr-[code] -- queda medido en analytics
// (view_business con source_code) y el círculo offline→online se cierra.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { QrCode, Download, Copy, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";

export default function QrVidriera({ businessId, businessName }: { businessId: string; businessName: string }) {
  const { show } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [clicks, setClicks] = useState<number | null>(null);
  const [busy, setBusy] = useState(true);
  const [sinVerificar, setSinVerificar] = useState(false);

  const generar = useCallback(async () => {
    setBusy(true);
    setSinVerificar(false);
    try {
      // create_tracked_link es idempotente: si ya existe un QR para este
      // negocio, devuelve el MISMO código (los QR impresos nunca se rompen).
      const res = await fetch("/api/tracked-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, source: "qr" }),
      });
      const data = await res.json();
      if (!res.ok || !data.short_code) {
        // "business_not_public" = negocio sin verificar todavía: es la regla de
        // negocio funcionando bien, no un error técnico -- reintentar no lo arregla,
        // así que no lo mostramos como "probá de nuevo".
        if (data.code === "business_not_public") {
          setSinVerificar(true);
          setBusy(false);
          return;
        }
        throw new Error(data.error || "No se pudo generar el QR");
      }
      setCode(data.short_code);
      const absolute = `${window.location.origin}/r/${data.short_code}`;
      setShortUrl(absolute);
      const [png, svg, linkRow] = await Promise.all([
        QRCode.toDataURL(absolute, { width: 512, margin: 2, color: { dark: "#0c0a0b", light: "#ffffff" } }),
        QRCode.toString(absolute, { type: "svg", margin: 2, color: { dark: "#0c0a0b", light: "#ffffff" } }),
        supabase()
          .from("tracked_links")
          .select("clicks")
          .eq("short_code", data.short_code)
          .maybeSingle(),
      ]);
      setQrDataUrl(png);
      setQrSvg(svg);
      if (linkRow?.data && typeof linkRow.data.clicks === "number") setClicks(linkRow.data.clicks);
    } catch {
      show("❌ No se pudo generar el QR. Probá de nuevo.", "error");
    }
    setBusy(false);
  }, [businessId, show]);

  useEffect(() => { generar(); }, [generar]);

  const descargar = (contenido: string, nombre: string, tipo: string) => {
    const url = contenido.startsWith("data:") ? contenido : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(contenido)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();
  };

  return (
    <details className="group rounded-2xl border border-[var(--ov-06)] bg-[var(--ov-02)]">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 marker:content-none">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent)]/15">
          <QrCode className="h-5 w-5 text-[var(--accent)]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">QR de vidriera</p>
          <p className="truncate text-xs text-[var(--muted)]">Imprimilo y medí cuántos escanean tu local</p>
        </div>
        <span className="text-xs font-bold text-[var(--accent)] group-open:hidden">Ver</span>
      </summary>

      <div className="border-t border-[var(--ov-06)] p-4">
        {busy ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-[var(--muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Generando QR...
          </div>
        ) : sinVerificar ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm font-black text-[var(--warn)]">⚠️ Tu negocio todavía no está verificado</p>
            <p className="max-w-xs text-xs leading-relaxed text-[var(--muted)]">
              El QR de vidriera se habilita cuando tu negocio queda verificado. Escribinos desde{" "}
              <Link href="/dashboard/soporte" className="font-bold text-[var(--accent)] underline">Soporte</Link> para pedirlo.
            </p>
          </div>
        ) : qrDataUrl ? (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt={`QR hacia ${businessName}`} className="h-40 w-40 shrink-0 rounded-2xl bg-white p-2" />
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-xs leading-relaxed text-[var(--muted)]">
                Pegalo en la vidriera o el mostrador. Cada escaneo queda registrado como
                visita desde tu local, y el cliente cae directo en tu ficha con tus ofertas.
              </p>
              {clicks !== null && (
                <p className="text-sm font-black text-[var(--ok)]">
                  👀 {clicks} {clicks === 1 ? "escaneo registrado" : "escaneos registrados"}
                </p>
              )}
              {shortUrl && (
                <p className="truncate rounded-lg bg-[var(--card-inner)] px-3 py-2 font-mono text-[10px] text-[var(--muted2)]">{shortUrl}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => descargar(qrDataUrl, `qr-${businessId}.png`, "image/png")}
                  className="btn-hard inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <Download className="h-3.5 w-3.5" /> PNG
                </button>
                {qrSvg && (
                  <button
                    onClick={() => descargar(qrSvg, `qr-${businessId}.svg`, "image/svg+xml")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line-strong)] px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[var(--ov-05)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    <Download className="h-3.5 w-3.5" /> SVG (imprimir)
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (!shortUrl) return;
                    try { await navigator.clipboard.writeText(shortUrl); show("🔗 Link copiado", "success"); }
                    catch { show("No se pudo copiar", "error"); }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line-strong)] px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[var(--ov-05)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <Copy className="h-3.5 w-3.5" /> Copiar link
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </details>
  );
}
