// Evento para Google Analytics (GA4). Es no-op si GA no cargó -- por
// ejemplo cuando el usuario no aceptó cookies de métricas -- y nunca
// tira error: el flujo de compra no puede romperse por analítica.
//
// (Antes este archivo también tenía track(), que escribía en paralelo a
// "metrics"/"user_activity" -- tablas que ningún componente leía. Los
// mismos eventos ya quedan capturados por el sistema real de
// analytics_events (lib/hooks/use-analytics.ts), así que se sacó en vez
// de mantener una segunda copia sin lector.)
export function gaEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { trackEvent?: (n: string, p?: Record<string, unknown>) => void };
  try {
    w.trackEvent?.(name, params);
  } catch {}
}
