"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import LevelUpCard from "@/components/ui/level-up-card";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import BusinessStats from "@/components/dashboard/business-stats";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !authLoading) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // Cargar negocios del usuario
      const { data: businessesData } = await supabase()
        .from("businesses")
        .select("*")
        .eq("owner_id", user?.id);

      if (businessesData) {
        setBusinesses(businessesData);

        // Cargar ofertas de todos los negocios del usuario
        const businessIds = businessesData.map((b: any) => b.id);
        if (businessIds.length > 0) {
          const { data: offersData } = await supabase()
            .from("offers")
            .select("*")
            .in("business_id", businessIds)
            .order("created_at", { ascending: false });

          if (offersData) {
            setOffers(offersData);
          }
        }
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="bg-[#0d0a12] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-white/60 mt-4">Cargando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#0d0a12] min-h-screen text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">Mi Dashboard</h1>
            <p className="text-white/60 mt-1">{user?.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/5"
          >
            Cerrar sesión
          </button>
        </div>

        <DashboardNav />
        <BusinessStats />

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Mis negocios</p>
            <p className="text-3xl font-black mt-2">{businesses.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Ofertas activas</p>
            <p className="text-3xl font-black mt-2">{offers.filter(o => o.active).length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Total de ofertas</p>
            <p className="text-3xl font-black mt-2">{offers.length}</p>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <Link
            href="/dashboard/nuevo"
            className="rounded-2xl border border-orange-400/30 bg-orange-500/10 p-6 hover:bg-orange-500/20 transition"
          >
            <div className="text-3xl mb-2">🏪</div>
            <h3 className="text-lg font-black">Crear nuevo negocio</h3>
            <p className="text-sm text-white/60 mt-1">Registra tu comercio en San Lorenzo Digital</p>
          </Link>
          <Link
            href="/dashboard/ofertas"
            className="rounded-2xl border border-orange-400/30 bg-orange-500/10 p-6 hover:bg-orange-500/20 transition"
          >
            <div className="text-3xl mb-2">🔥</div>
            <h3 className="text-lg font-black">Gestionar ofertas</h3>
            <p className="text-sm text-white/60 mt-1">Crea y administra tus promociones</p>
          </Link>
        </div>

        {/* Lista de negocios */}
        <div className="mb-8">
          <h2 className="text-2xl font-black mb-4">Mis Negocios</h2>
          {businesses.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-white/60">Aún no tenés negocios registrados</p>
              <Link
                href="/dashboard/nuevo"
                className="inline-block mt-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-black text-white hover:opacity-90"
              >
                Crear mi primer negocio
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {businesses.map((business) => (
                <div
                  key={business.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold">{business.name}</h3>
                      <p className="text-sm text-white/60 capitalize">{business.category}</p>
                    </div>
                    <span className={`rounded-lg px-2 py-1 text-xs font-bold ${
                      business.status === "verificado"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-yellow-500/20 text-yellow-300"
                    }`}>
                      {business.status}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 mb-4">{business.address}</p>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/editar/${business.id}`}
                      className="flex-1 rounded-xl border border-white/20 px-4 py-2 text-center text-sm hover:bg-white/5"
                    >
                      Editar
                    </Link>
                    <Link
                      href={`/negocio/${business.slug}`}
                      className="flex-1 rounded-xl border border-white/20 px-4 py-2 text-center text-sm hover:bg-white/5"
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ofertas recientes */}
        {offers.length > 0 && (
          <div>
            <h2 className="text-2xl font-black mb-4">Ofertas Recientes</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {offers.slice(0, 4).map((offer) => (
                <div
                  key={offer.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold">{offer.title}</h3>
                    <span className={`rounded-lg px-2 py-1 text-xs font-bold ${
                      offer.active ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                    }`}>
                      {offer.active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  {offer.discount_percent && (
                    <p className="text-sm text-orange-400 font-bold">{offer.discount_percent}% OFF</p>
                  )}
                  {offer.valid_until && (
                    <p className="text-xs text-white/60 mt-2">
                      Vence: {new Date(offer.valid_until).toLocaleDateString("es-AR")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    <div className="mt-6"><LevelUpCard showCtas /></div>
    </main>
  );
}
