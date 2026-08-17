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
    return <main className="min-h-screen bg-[#0c0a0b] flex items-center justify-center text-white">Cargando...</main>;
  }

  return (
    <main className="min-h-screen bg-[#0c0a0b] text-white pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <DashboardNav />
        <div className="mb-6 flex items-center gap-3">
          <LifeBuoy className="h-8 w-8 text-orange-400" />
          <div>
            <h1 className="text-3xl font-black" style={{ fontFamily: "var(--font-space)" }}>Soporte</h1>
            <p className="text-white/60">Consultas, dudas o bugs -- hablás directo con nosotros.</p>
          </div>
        </div>

        <HowItWorks steps={[
          "Escribinos cualquier duda, problema o algo que quieras arreglar de tu negocio en la plataforma.",
          "Te respondemos por acá mismo -- vas a ver un aviso cuando llegue la respuesta.",
          "No hace falta esperar a que sea urgente: consultanos lo que sea.",
        ]} />

        {!negocio ? (
          <div className="rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
            <div className="rounded-[1.375rem] border border-white/[.05] bg-black/20 p-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
              <p className="font-bold">Todavía no tenés un negocio creado.</p>
              <p className="mt-1 text-sm text-white/50">Creá tu negocio primero para poder hablar con soporte.</p>
              <Link href="/dashboard/nuevo" className="mt-4 inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-black hover:opacity-90">Crear mi negocio</Link>
            </div>
          </div>
        ) : !admin ? (
          <div className="rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
            <div className="rounded-[1.375rem] border border-white/[.05] bg-black/20 p-8 text-center text-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
              No pudimos cargar el chat de soporte. Probá de nuevo en un rato.
            </div>
          </div>
        ) : (
          <Chat businessId={negocio.id} ownerId={negocio.owner_id} businessName={admin.name} customerId={admin.id} staffId={admin.id} />
        )}
      </div>
    </main>
  );
}
