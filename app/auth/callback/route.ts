import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// Recibe el ?code= que manda Supabase Auth (recovery de contraseña,
// confirmación de email, magic link) y lo canjea por una sesión real
// antes de redirigir. Sin esta ruta, esos links de mail apuntaban
// directo a una página que no sabía qué hacer con el token -> 404.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
