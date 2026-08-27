import { NextResponse } from "next/server";
import { z } from "zod";

// Helper chico para no repetir el mismo try/safeParse/400 en cada ruta.
// Uso: const body = validarBody(schema, await request.json());
// if (body instanceof NextResponse) return body; // error 400 ya armado
// ... usar body.campo con el tipo ya inferido por zod
export function validarBody<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> | NextResponse {
  const result = schema.safeParse(data);
  if (!result.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) },
      { status: 400 }
    );
  }
  return result.data;
}
