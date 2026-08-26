import { Metadata } from "next";
import MiBarataClient from "./client";

export const metadata: Metadata = {
  title: "Mi barata — La Gran Barata",
  description: "Tus ofertas guardadas de la semana: cuánto ahorrás, en qué negocios y el recorrido para levantarlas todo.",
};

export default function Page() {
  return <MiBarataClient />;
}
