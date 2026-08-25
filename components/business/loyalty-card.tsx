"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Stamp, Gift } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";

export default function LoyaltyCard({ businessId, businessName }: { businessId: string; businessName: string }) {
  const { show } = useToast();
  const [programa, setPrograma] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [progreso, setProgreso] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [segundosRestantes, setSegundosRestantes] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: prog } = await supabase().from("loyalty_programs")
        .select("*").eq("business_id", businessId).eq("active", true).maybeSingle();
      setPrograma(prog);
      if (prog) {
        const { data: { user } } = await supabase().auth.getUser();
        setUser(user);
        if (user) {
          const { count } = await supabase().from("loyalty_stamps")
            .select("*", { count: "exact", head: true })
            .eq("business_id", businessId).eq("user_id", user.id).eq("redeemed", false);
          setProgreso(count || 0);
        }
      }
      setLoading(false);
    })();
  }, [businessId]);

  useEffect(() => {
    if (segundosRestantes <= 0) return;
    const t = setInterval(() => setSegundosRestantes((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [segundosRestantes]);

  const generarCodigo = async () => {
    setGenerando(true);
    try {
      const res = await fetch("/api/loyalty/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId }),
      });
      const data = await res.json();
      if (!res.ok) {
        show(`❌ ${data.error}`, "error");
      } else {
        setCodigo(data.code);
        setSegundosRestantes(Math.round((new Date(data.expires_at).getTime() - Date.now()) / 1000));
      }
    } catch {
      show("❌ No se pudo generar el código, probá de nuevo.", "error");
    }
    setGenerando(false);
  };

  if (loading || !programa) return null;

  const pct = Math.min(100, Math.round((progreso / programa.meta) * 100));

  return (
    <div className="mb-6 rounded-[1.75rem] border border-amber-400/20 bg-gradient-to-br from-amber-500/[.06] to-[#861642]/[.03] p-1.5">
      <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
        <h3 className="mb-1 flex items-center gap-2 font-black">
          <Stamp className="h-5 w-5 text-[var(--warn)]" /> Tarjeta de sellitos
        </h3>
        <p className="mb-4 text-xs text-[var(--muted)] flex items-center gap-1.5">
          <Gift className="h-3.5 w-3.5" /> Al juntar {programa.meta} sellos: {programa.premio}
        </p>

        {!user ? (
          <Link href="/login" className="block rounded-xl border border-[var(--line)] bg-[var(--ov-05)] px-4 py-2.5 text-center text-sm font-bold text-[var(--text)]/70 hover:bg-[var(--ov-10)]">
            Iniciá sesión para empezar tu tarjeta
          </Link>
        ) : (
          <>
            <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
              <span>{progreso} de {programa.meta} sellos</span>
              <span>{pct}%</span>
            </div>
            <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-[var(--ov-10)]">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-[#861642] transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>

            {codigo ? (
              <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-center">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Mostrale esto a {businessName}</p>
                <p className="text-3xl font-black tracking-[0.3em]">{codigo}</p>
                <p className="mt-1 text-xs text-[var(--muted2)]">{segundosRestantes > 0 ? `Vence en ${Math.floor(segundosRestantes / 60)}:${String(segundosRestantes % 60).padStart(2, "0")}` : "Vencido -- generá uno nuevo"}</p>
              </div>
            ) : (
              <button onClick={generarCodigo} disabled={generando}
                className="w-full rounded-full bg-gradient-to-r from-amber-500 to-[#861642] py-2.5 text-sm font-black disabled:opacity-50">
                {generando ? "Generando..." : "Generar código de sello"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
