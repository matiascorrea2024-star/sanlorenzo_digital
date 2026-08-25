import { Metadata } from "next";
import MapaClient from "./client";

export const metadata: Metadata = {
  title: "Mapa de negocios de San Lorenzo | La Gran Barata Digital",
  description: "Descubrí negocios, ofertas y oportunidades de San Lorenzo, Santa Fe.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/mapa" },
};

export default async function Page() {
  // El cliente se encarga de traer los negocios (useAllBusinesses):
  // acá solo renderizamos el shell para no duplicar la query.
  return <MapaClient />;
}
