import { Metadata } from "next";
import PlanesClient from "./client";

export const metadata: Metadata = {
  title: "Planes y precios para comercios | San Lorenzo Digital",
  description: "Elegí el plan que mejor se adapte a tu negocio: desde gratis para empezar hasta Destacado Semanal. Sin tarjeta, sin permanencia.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/planes" },
  openGraph: {
    title: "Planes y precios para comercios de San Lorenzo",
    description: "Empezá gratis y crecé con tu negocio: ofertas, catálogo, estadísticas, cupones y En Vivo según el plan que elijas.",
    type: "website", locale: "es_AR",
  },
};

export default function Page() {
  return <PlanesClient />;
}
