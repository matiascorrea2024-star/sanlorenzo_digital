import { Metadata } from "next";
import BuscarClient from "./client";

export const metadata: Metadata = {
  title: "Buscador de negocios y productos | San Lorenzo Digital",
  description: "Buscá por nombre, producto o rubro entre los comercios de San Lorenzo. Filtrá por ofertas activas, abierto ahora, cercanía y envíos.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/buscar" },
  openGraph: {
    title: "Buscador inteligente de San Lorenzo Digital",
    description: "Encontrá el negocio o producto que buscás en San Lorenzo, en segundos.",
    type: "website", locale: "es_AR",
  },
};

export default function Page() {
  return <BuscarClient />;
}
