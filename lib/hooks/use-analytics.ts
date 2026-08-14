export function useAnalytics() {
  const track = async (eventType: string, data?: {
    business_id?: string;
    offer_id?: string;
    product_id?: string;
    metadata?: Record<string, any>;
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
  };

  return {
    trackViewBusiness: (businessId: string) => track("view_business", { business_id: businessId }),
    trackViewOffer: (offerId: string, businessId?: string) => track("view_offer", { offer_id: offerId, business_id: businessId }),
    trackClickWhatsApp: (businessId: string) => track("click_whatsapp", { business_id: businessId }),
    trackClickMap: (businessId: string) => track("click_map", { business_id: businessId }),
    trackFavorite: (businessId: string) => track("favorite", { business_id: businessId }),
    trackFollow: (businessId: string) => track("follow", { business_id: businessId }),
    trackSearch: (query: string) => track("search", { metadata: { query } }),
    trackCouponGenerated: (offerId: string, businessId: string) => track("coupon_generated", { offer_id: offerId, business_id: businessId }),
    trackCouponRedeemed: (couponId: string, businessId: string) => track("coupon_redeemed", { metadata: { coupon_id: couponId }, business_id: businessId }),
    track,
  };
}
