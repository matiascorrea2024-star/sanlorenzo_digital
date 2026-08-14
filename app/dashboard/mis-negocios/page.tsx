import { redirect } from "next/navigation";

// Esta pantalla quedó duplicada con /dashboard (que ya lista los negocios
// del dueño con más funciones: abrir/cerrar, ofertas, mensajes, etc.).
// Se deja el redirect para no romper links/bookmarks viejos.
export default function MisNegociosRedirect() {
  redirect("/dashboard");
}
