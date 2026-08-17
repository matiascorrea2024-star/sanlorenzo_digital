import { Metadata } from "next";
import PedidosPage from "./client";

export const metadata: Metadata = {
  title: "¿Quién tiene esto? | La Gran Barata Digital",
  description: "Publicá qué estás buscando y que te respondan los vecinos y negocios de San Lorenzo que lo tengan.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/pedidos" },
};

export default function Page() {
  return <PedidosPage />;
}
