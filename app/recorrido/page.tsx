import { Metadata } from "next";
import RecorridoClient from "./client";

export const metadata: Metadata = {
  title: "Mi recorrido — La Gran Barata",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <RecorridoClient />;
}
