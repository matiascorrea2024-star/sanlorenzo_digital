import { Metadata } from "next";
import PortuarioView from "./client";

export const metadata: Metadata = {
  title: "Servicios portuarios en San Lorenzo | La Gran Barata Digital",
  description: "Proveedores portuarios, terminales, logística fluvial y comercio exterior del Gran San Lorenzo.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/portuario" },
};

export default function Page() {
  return <PortuarioView />;
}
