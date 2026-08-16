import { AccessToken } from "livekit-server-sdk";

// Server-only: LIVEKIT_API_SECRET nunca se manda al cliente. El cliente
// solo recibe el token JWT ya firmado y de corta duración que devuelve
// /api/live/token -- nunca las claves en sí.
export async function crearTokenLive(params: {
  roomName: string;
  identity: string;
  name: string;
  canPublish: boolean;
}): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error("Falta configurar LiveKit (LIVEKIT_API_KEY / LIVEKIT_API_SECRET)");

  const token = new AccessToken(apiKey, apiSecret, {
    identity: params.identity,
    name: params.name,
    ttl: "4h",
  });
  token.addGrant({
    room: params.roomName,
    roomJoin: true,
    canPublish: params.canPublish,
    canSubscribe: true,
    canPublishData: true,
  });
  return token.toJwt();
}

export function livekitUrl(): string {
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!url) throw new Error("Falta configurar NEXT_PUBLIC_LIVEKIT_URL");
  return url;
}
