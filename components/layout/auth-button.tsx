"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";

const ADMIN_EMAILS = [
  "matiascorrea2024@gmail.com",
  "matiascorrea2025@gmail.com",
  "matiasgazta2027@gmail.com",
];

export default function AuthButton() {
  const [logged, setLogged] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase().auth.getSession().then(({ data }) => {
      setLogged(!!data.session);
      setUserEmail(data.session?.user?.email || "");
    });
    const { data: { subscription } } = supabase().auth.onAuthStateChange((_e, s) => {
      setLogged(!!s);
      setUserEmail(s?.user?.email || "");
    });
    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase().auth.signOut();
    window.location.href = "/";
  }

  const esAdmin = ADMIN_EMAILS.includes(userEmail);

  if (logged) {
    return (
      <div className="flex items-center gap-2">
        {esAdmin && (
          <Link
            href="/admin"
            className="hidden md:inline-flex items-center gap-1 rounded-lg bg-black/30 border border-yellow-400/50 px-3 py-2 text-sm font-black text-yellow-300 hover:bg-black/50 transition"
            title="Panel Admin"
          >
            👑 Admin
          </Link>
        )}
        <Link
          href="/dashboard/mis-negocios"
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 px-4 py-2 text-sm font-bold text-white transition"
        >
          🛍️ Mi panel
        </Link>
        <button
          onClick={logout}
          className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
          title={userEmail}
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-lg border border-white/30 px-4 py-2 text-sm font-bold text-white hover:bg-white/10 transition"
      >
        Ingresar
      </Link>
      <Link
        href="/registro"
        className="hidden md:inline-block rounded-lg bg-white px-4 py-2 text-sm font-black text-red-600 hover:bg-orange-100 transition"
      >
        Registrarse
      </Link>
    </div>
  );
}
