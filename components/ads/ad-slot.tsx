"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "@/app/mercado-vivo/mercado-vivo.module.css";

type AdData = {
  campaign_id: string;
  business_name: string;
  creative_url: string;
  creative_type: string;
  cta_label: string;
  target_url: string;
};

// Tarjeta patrocinada real de La Gran Barata Ads -- reutiliza la
// tipografía/estructura de las tarjetas de oferta de Mercado Vivo para no
// desentonar en el feed, pero con datos 100% reales de una campaña
// pagada y aprobada (nunca un placeholder ni un aviso de mentira). Si no
// hay ninguna campaña elegible para el placement, no renderiza nada --
// nunca deja un hueco vacío ni un "próximamente" inventado.
export default function AdSlot({ placement, locationId }: { placement: string; locationId?: string | null }) {
  const [ad, setAd] = useState<AdData | null | "loading">("loading");
  const ref = useRef<HTMLAnchorElement>(null);
  const impresionRegistrada = useRef(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const qs = new URLSearchParams({ placement });
        if (locationId) qs.set("location_id", locationId);
        const res = await fetch(`/api/ads/serve?${qs.toString()}`);
        const d = await res.json();
        if (!cancelado) setAd(d.ad || null);
      } catch {
        if (!cancelado) setAd(null);
      }
    })();
    return () => { cancelado = true; };
  }, [placement, locationId]);

  useEffect(() => {
    if (!ad || ad === "loading" || impresionRegistrada.current) return;
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !impresionRegistrada.current) {
          impresionRegistrada.current = true;
          fetch("/api/ads/impression", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ campaign_id: ad.campaign_id, placement }),
          }).catch(() => {});
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [ad, placement]);

  if (!ad || ad === "loading") return null;

  const registrarClick = () => {
    fetch("/api/ads/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: ad.campaign_id }),
    }).catch(() => {});
  };

  return (
    <a
      ref={ref}
      href={ad.target_url}
      onClick={registrarClick}
      className={styles.mvProdCard}
      target={ad.target_url.startsWith("http") ? "_blank" : undefined}
      rel={ad.target_url.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      <div className={`${styles.mvShot} ${styles.mvProdShot}`}>
        {ad.creative_type === "video" ? (
          <video src={ad.creative_url} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} autoPlay muted loop playsInline />
        ) : (
          <Image src={ad.creative_url} alt={ad.business_name} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
        )}
        <div className={styles.mvShotRim} />
        <span className={styles.mvProdBadge} style={{ background: "var(--muted2)" }}>Patrocinado</span>
      </div>
      <div className={styles.mvProdBody}>
        <div className={styles.mvProdShop}>{ad.business_name}</div>
        <div className={styles.mvProdName}>{ad.cta_label}</div>
      </div>
    </a>
  );
}
