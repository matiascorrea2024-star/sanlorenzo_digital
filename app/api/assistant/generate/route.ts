import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase-server";
import { checkRateLimit, getRateLimitHeader, rateLimitResponse } from "@/lib/rate-limit";
import { validarBody } from "@/lib/validate";
import { z } from "zod";

// Upgrade opcional del Asistente de publicaciones (app/dashboard/asistente):
// el generador por reglas (lib usado ahí mismo) sigue siendo el default,
// instantáneo y gratis. Esta ruta agrega una versión con IA real si el
// negocio configura ANTHROPIC_API_KEY -- mismo patrón "no-op hasta
// configurar" que ya usan Sentry y Speed Insights. Sin la clave, devuelve
// configured:false en vez de simular una respuesta.
const schema = z.object({
  producto: z.string().trim().min(1).max(200),
  negocio: z.string().trim().max(200).optional().default(""),
  precio: z.string().trim().max(20).optional().default(""),
  precioAntes: z.string().trim().max(20).optional().default(""),
  descuento: z.string().trim().max(10).optional().default(""),
});

export async function POST(request: NextRequest) {
  try {
    const limit = checkRateLimit(getRateLimitHeader(request), 10, 60);
    if (!limit.ok) return rateLimitResponse(limit.retryAfter);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ configured: false });
    }

    const parsed = validarBody(schema, await request.json().catch(() => ({})));
    if (parsed instanceof NextResponse) return parsed;
    const { producto, negocio, precio, precioAntes, descuento } = parsed;

    const anthropic = new Anthropic({ apiKey });
    const datosConocidos = [
      `Producto/servicio: ${producto}`,
      negocio && `Negocio: ${negocio}`,
      precio && `Precio actual: $${precio}`,
      precioAntes && `Precio anterior: $${precioAntes}`,
      descuento && `Descuento: ${descuento}%`,
    ].filter(Boolean).join("\n");

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `Sos un asistente de marketing para comercios de barrio en San Lorenzo, Argentina, escribiendo dentro de la app San Lorenzo Digital (SLD).
Con estos datos reales (no inventes ningún dato que no esté acá -- ni cantidades, ni stock, ni fechas, ni testimonios):
${datosConocidos}

Generá copy en español rioplatense, tono cercano y directo, sin exagerar. Devolvé SOLO un JSON válido (sin markdown, sin explicación) con esta forma exacta:
{"titulo": "...", "descripcion": "...", "whatsapp": "..."}
- titulo: máximo 60 caracteres, puede usar 1 emoji si aporta.
- descripcion: 1-2 oraciones para la ficha de la oferta.
- whatsapp: mensaje corto listo para reenviar a clientes, puede tener 2-3 líneas y emojis moderados.`,
      }],
    });

    const textBlock = msg.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("Respuesta vacía del modelo");

    let parsedJson: { titulo?: string; descripcion?: string; whatsapp?: string };
    try {
      parsedJson = JSON.parse(textBlock.text);
    } catch {
      throw new Error("El modelo no devolvió JSON válido");
    }

    if (!parsedJson.titulo || !parsedJson.descripcion || !parsedJson.whatsapp) {
      throw new Error("Respuesta incompleta del modelo");
    }

    return NextResponse.json({
      configured: true,
      titulo: parsedJson.titulo,
      descripcion: parsedJson.descripcion,
      whatsapp: parsedJson.whatsapp,
    });
  } catch (error: any) {
    console.error("assistant/generate:", error?.message || error);
    return NextResponse.json({ error: "No pudimos generar la publicación con IA. Probá de nuevo en un momento." }, { status: 500 });
  }
}
