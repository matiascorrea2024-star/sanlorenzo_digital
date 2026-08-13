import { getAllBusinesses } from "@/lib/directory";
import MasterHome from "@/components/home/master-home";
import { CATEGORIES } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "San Lorenzo Digital · Todo San Lorenzo, en un solo lugar",
  description:
    "Descubrí comercios, servicios, promociones y lugares de San Lorenzo, Santa Fe.",
};

export default async function HomePage() {
  const businesses = await getAllBusinesses();

  return <MasterHome businesses={businesses} categories={CATEGORIES} />;
}

