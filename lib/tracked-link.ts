export async function getTrackedShareUrl(input: {
  businessId?: string;
  offerId?: string;
  source?: "share" | "whatsapp" | "instagram" | "facebook" | "qr" | "invite";
  fallback: string;
}): Promise<string> {
  try {
    const response = await fetch("/api/tracked-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_id: input.businessId,
        offer_id: input.offerId,
        source: input.source || "share",
      }),
    });
    const data = await response.json();
    return response.ok && typeof data.short_url === "string" ? data.short_url : input.fallback;
  } catch {
    return input.fallback;
  }
}
