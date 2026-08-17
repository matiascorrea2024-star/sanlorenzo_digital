import { Metadata } from "next";
import VecinosPage from "./client";

export const metadata: Metadata = {
  title: "Ranking de vecinos | La Gran Barata Digital",
  description: "Los vecinos más activos de San Lorenzo. Seguí negocios, dejá reseñas y sumá puntos para llegar al podio.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/vecinos" },
};

export default function Page() {
  return <VecinosPage />;
}
