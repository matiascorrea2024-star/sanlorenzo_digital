import { Metadata } from "next";
import EnVivoClient from "./client";

export const metadata: Metadata = {
  title: "En Vivo | La Gran Barata Digital",
  description: "Comercios de San Lorenzo transmitiendo en vivo ahora mismo -- mirá, preguntá y reservá en tiempo real.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/en-vivo" },
};

export default function Page() {
  return <EnVivoClient />;
}
