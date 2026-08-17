import { Metadata } from "next";
import ComunidadPage from "./client";

export const metadata: Metadata = {
  title: "Chat de tu ciudad | La Gran Barata Digital",
  description: "Preguntas, avisos, y buena onda entre vecinos de San Lorenzo. Los negocios de la zona quedan destacados cuando participan.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/comunidad" },
};

export default function Page() {
  return <ComunidadPage />;
}
