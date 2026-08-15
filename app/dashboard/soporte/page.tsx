"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import HowItWorks from "@/components/ui/how-it-works";
import Chat from "@/components/business/chat";
import { getSupportAdmin } from "@/lib/support";

export default function SoportePage() {
  const { user } = useAuth();
  const [negocio, setNegocio] = useState<any>(null);
  const [admin, setAdmin] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [{ data: biz }, sup] = await Promise.all([
        supabase().from("businesses").select("id, name, owner_id").eq("owner_id", user.id).order("name").limit(1).maybeSingle(),
        getSupportAdmin(),
      ]);
      setNegocio(biz);
      setAdmin(sup);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return <main className="min-h-screen bg-[#120d09] flex items-center justify-center text-white">Cargando...</main>;
  }

  return (
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <DashboardNav />
        <div className="mb-6 flex items-center gap-3">
          <LifeBuoy className="h-8 w-8 text-orange-400" />
          <div>
            <h1 className="text-3xl font-black">Soporte</h1>
            <p className="text-white/60">Consultas, dudas o bugs -- hablás directo con nosotros.</p>
          </div>
        </div>

        <HowItWorks steps={[
          "Escribinos cualquier duda, problema o algo que quieras arreglar de tu negocio en la plataforma.",
          "Te respondemos por acá mismo -- vas a ver un aviso cuando llegue la respuesta.",
          "No hace falta esperar a que sea urgente: consultanos lo que sea.",
        ]} />

        {!negocio ? (
          <div className="sld-card rounded-2xl p-8 text-center">
            <p className="font-bold">Todavía no tenés un negocio creado.</p>
            <p className="mt-1 text-sm text-white/50">Creá tu negocio primero para poder hablar con soporte.</p>
            <Link href="/dashboard/nuevo" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-black">Crear mi negocio</Link>
          </div>
        ) : !admin ? (
          <div className="sld-card rounded-2xl p-8 text-center text-white/50">
            No pudimos cargar el chat de soporte. Probá de nuevo en un rato.
          </div>
        ) : (
          <Chat businessId={negocio.id} ownerId={negocio.owner_id} businessName={admin.name} customerId={admin.id} />
        )}
      </div>
    </main>
  );
}
