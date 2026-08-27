import { redirect } from "next/navigation";

// "Mercado Vivo" ahora es la home real (ver app/page.tsx). Esta ruta
// queda como redirect para no dejar contenido duplicado ni romper
// algún link viejo a /mercado-vivo.
export default function MercadoVivoRedirect() {
  redirect("/");
}
