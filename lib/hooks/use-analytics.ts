type AnalyticsMetadata = Record<string, string | number | boolean | null>;

import { useCallback, useMemo } from "react";
import { gaEvent } from "@/lib/track";

export function useAnalytics() {
  // Estables entre renders: los efectos de tracking pueden listarlos en
  // sus deps sin re-disparar el conteo (antes se recreaban en cada
  // render y por eso se omitían del array con un warning del linter).
  const track = useCallback(async (eventType: string, data?: {
    business_id?: string;
    offer_id?: string;
    product_id?: string;
    metadata?: AnalyticsMetadata;
    source?: string;
    source_code?: string;
  }) => {
    try {
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_type: eventType, ...data }),
      });
    } catch (error) {
      console.error("Track failed:", error);
    }
  }, []);

  return useMemo(() => ({
    trackViewBusiness: (businessId: string, source?: string, sourceCode?: string) =>
      track("view_business", { business_id: businessId, source, source_code: sourceCode }),
    trackViewOffer: (offerId: string, businessId?: string, source?: string, sourceCode?: string) =>
      track("view_offer", { offer_id: offerId, business_id: businessId, source, source_code: sourceCode }),
    trackClickWhatsApp: (businessId: string) => {
      gaEvent("whatsapp_click", { business_id: businessId });
      return track("click_whatsapp", { business_id: businessId });
    },
    trackClickMap: (businessId: string) => track("click_map", { business_id: businessId }),
    trackFavorite: (businessId: string) => track("favorite", { business_id: businessId }),
    trackFollow: (businessId: string) => track("follow", { business_id: businessId }),
    trackSearch: (query: string, resultCount?: number) =>
      track("search", { metadata: resultCount === undefined ? { query } : { query, result_count: resultCount } }),
    trackCouponGenerated: (offerId: string, businessId: string) => track("coupon_generated", { offer_id: offerId, business_id: businessId }),
    trackCouponRedeemed: (couponId: string, businessId: string) => track("coupon_redeemed", { metadata: { coupon_id: couponId }, business_id: businessId }),
    trackShareBusiness: (businessId: string, source = "share", sourceCode?: string) =>
      track("share_business", { business_id: businessId, source, source_code: sourceCode }),
    trackShareOffer: (offerId: string, businessId: string, source = "share", sourceCode?: string) =>
      track("share_offer", { offer_id: offerId, business_id: businessId, source, source_code: sourceCode }),
    trackCheckoutStarted: (businessId: string, metadata: AnalyticsMetadata = {}) =>
      track("checkout_started", { business_id: businessId, metadata }),
    trackPaymentConfirmed: (businessId: string, metadata: AnalyticsMetadata = {}) =>
      track("payment_confirmed", { business_id: businessId, metadata }),
    track,
  }), [track]);
}
