import { Metadata } from "next";
import PulsoClient from "./client";

export const metadata: Metadata = {
  title: "¿Qué está pasando hoy en San Lorenzo? | La Gran Barata Digital",
  description: "El pulso comercial de San Lorenzo: categorías más buscadas, ofertas que vencen hoy, negocios en alza y la actividad real de la semana.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/pulso" },
};

export default function Page() {
  return <PulsoClient />;
}
