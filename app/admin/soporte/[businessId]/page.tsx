"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Chat from "@/components/business/chat";

export default function AdminSoportePage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;
  const [negocio, setNegocio] = useState<any>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: prof } = await sb.from("user_profiles").select("role").eq("user_id", user.id).maybeSingle();
      if (prof?.role !== "admin") { router.push("/"); return; }
      setAdminId(user.id);

      const { data: biz } = await sb.from("businesses").select("id, name, slug, owner_id").eq("id", businessId).maybeSingle();
      setNegocio(biz);
      setLoading(false);
    })();
  }, [businessId, router]);

  if (loading) {
    return <main className="min-h-screen bg-[#120d09] flex items-center justify-center text-white">Cargando...</main>;
  }

  if (!negocio) {
    return (
      <main className="min-h-screen bg-[#120d09] flex items-center justify-center text-white">
        <p>Negocio no encontrado.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-300">
          <ArrowLeft className="h-4 w-4" /> Volver al panel
        </Link>
        <h1 className="mt-3 mb-6 text-3xl font-black">Soporte con {negocio.name}</h1>
        {adminId && <Chat businessId={negocio.id} ownerId={negocio.owner_id} businessName={negocio.name} businessSlug={negocio.slug} customerId={adminId} staffId={adminId} />}
      </div>
    </main>
  );
}
