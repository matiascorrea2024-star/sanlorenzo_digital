import { Metadata } from "next";
import B2bView from "./client";

export const metadata: Metadata = {
  title: "Industria y B2B en San Lorenzo | La Gran Barata Digital",
  description: "Proveedores, servicios industriales, logística y empresas B2B en San Lorenzo, Santa Fe.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/b2b" },
  openGraph: {
    title: "Industria y B2B en San Lorenzo",
    description: "El ecosistema industrial y comercial de San Lorenzo en un solo lugar.",
    type: "website", locale: "es_AR",
  },
};

export default function Page() {
  return <B2bView />;
}
