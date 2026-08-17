"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2, MessageCircle, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

type Pedido = {
  id: string;
  user_id: string;
  texto: string;
  resuelto: boolean;
  created_at: string;
  autor: string;
};

type Respuesta = {
  id: string;
  pedido_id: string;
  user_id: string;
  business_id: string | null;
  mensaje: string;
  autor: string;
  negocio: { name: string; slug: string } | null;
};

function tiempoDesde(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "recién";
  if (mins < 60) return `hace ${mins} min`;
  const horas = Math.round(mins / 60);
  if (horas < 24) return `hace ${horas}h`;
  return `hace ${Math.round(horas / 24)}d`;
}

export default function PedidosBoard({ locationId }: { locationId: string }) {
  const { user } = useAuth();
  const { show } = useToast();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [respuestas, setRespuestas] = useState<Record<string, Respuesta[]>>({});
  const [texto, setTexto] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [misNegocio, setMisNegocio] = useState<any>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [respTexto, setRespTexto] = useState("");
  const [respondiendo, setRespondiendo] = useState(false);
  const [verResueltos, setVerResueltos] = useState(false);

  const cargar = async () => {
    const sb = supabase();
    const { data: peds } = await sb.from("pedidos_vecinos").select("*").eq("location_id", locationId)
      .order("created_at", { ascending: false }).limit(100);
    if (!peds || peds.length === 0) { setPedidos([]); setRespuestas({}); return; }

    const userIds = Array.from(new Set(peds.map((p: any) => p.user_id)));
    const { data: perfiles } = await sb.from("user_profiles").select("user_id, display_name").in("user_id", userIds);
    const nombres = Object.fromEntries((perfiles || []).map((p: any) => [p.user_id, p.display_name || "Vecino"]));
    setPedidos(peds.map((p: any) => ({ ...p, autor: nombres[p.user_id] || "Vecino" })));

    const { data: resps } = await sb.from("pedido_respuestas").select("*").in("pedido_id", peds.map((p: any) => p.id)).order("created_at");
    if (resps && resps.length > 0) {
      const rUserIds = Array.from(new Set(resps.map((r: any) => r.user_id)));
      const bizIds = Array.from(new Set(resps.map((r: any) => r.business_id).filter(Boolean)));
      const [{ data: rPerfiles }, { data: negocios }] = await Promise.all([
        sb.from("user_profiles").select("user_id, display_name").in("user_id", rUserIds),
        bizIds.length > 0 ? sb.from("businesses").select("id, name, slug").in("id", bizIds) : Promise.resolve({ data: [] }),
      ]);
      const rNombres = Object.fromEntries((rPerfiles || []).map((p: any) => [p.user_id, p.display_name || "Vecino"]));
      const negociosPorId = Object.fromEntries((negocios || []).map((n: any) => [n.id, n]));
      const agrupado: Record<string, Respuesta[]> = {};
      for (const r of resps) {
        const item: Respuesta = { ...r, autor: rNombres[r.user_id] || "Vecino", negocio: r.business_id ? negociosPorId[r.business_id] || null : null };
        (agrupado[r.pedido_id] ||= []).push(item);
      }
      setRespuestas(agrupado);
    } else {
      setRespuestas({});
    }
  };

  useEffect(() => { cargar(); }, [locationId]);

  useEffect(() => {
    if (!user) { setMisNegocio(null); return; }
    supabase().from("businesses").select("id, name").eq("owner_id", user.id).maybeSingle().then(({ data }) => setMisNegocio(data));
  }, [user]);

  const publicar = async () => {
    if (!user) { router.push("/login"); return; }
    if (texto.trim().length < 5) return;
    setPublicando(true);
    const { error } = await supabase().from("pedidos_vecinos").insert({ user_id: user.id, location_id: locationId, texto: texto.trim() });
    if (error) {
      show(`❌ ${friendlyError(error, "No se pudo publicar.")}`, "error");
    } else {
      setTexto("");
      await cargar();
    }
    setPublicando(false);
  };

  const responder = async (pedidoId: string) => {
    if (!user) { router.push("/login"); return; }
    if (respTexto.trim().length < 2) return;
    setRespondiendo(true);
    const { error } = await supabase().from("pedido_respuestas").insert({
      pedido_id: pedidoId, user_id: user.id, business_id: misNegocio?.id || null, mensaje: respTexto.trim(),
    });
    if (error) {
      show(`❌ ${friendlyError(error, "No se pudo enviar.")}`, "error");
    } else {
      setRespTexto("");
      setAbierto(null);
      await cargar();
      show("✅ Respuesta enviada", "success");
    }
    setRespondiendo(false);
  };

  const marcarResuelto = async (pedidoId: string) => {
    const { error } = await supabase().from("pedidos_vecinos").update({ resuelto: true }).eq("id", pedidoId);
    if (!error) setPedidos((prev) => prev.map((p) => p.id === pedidoId ? { ...p, resuelto: true } : p));
  };

  const visibles = pedidos.filter((p) => verResueltos || !p.resuelto);

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[.03] p-4">
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} maxLength={280}
          placeholder="¿Qué estás buscando? Ej: alguien que tenga un repuesto de..."
          className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-orange-400" />
        <div className="mt-2 flex justify-end">
          <button onClick={publicar} disabled={publicando || texto.trim().length < 5}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2 text-sm font-black disabled:opacity-50">
            <Send className="h-4 w-4" /> {publicando ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </div>

      {pedidos.some((p) => p.resuelto) && (
        <button onClick={() => setVerResueltos((v) => !v)} className="mb-3 text-xs text-white/40 hover:text-white/60">
          {verResueltos ? "Ocultar resueltos" : "Ver resueltos también"}
        </button>
      )}

      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/50">
          Todavía nadie pidió nada por acá. ¡Arrancá vos!
        </p>
      ) : (
        <div className="space-y-3">
          {visibles.map((p) => (
            <div key={p.id} className={`rounded-2xl border p-4 ${p.resuelto ? "border-white/5 bg-white/[.015] opacity-60" : "border-white/10 bg-white/[.03]"}`}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-white/50">{p.autor} · {tiempoDesde(p.created_at)}</p>
                {p.resuelto && <span className="flex items-center gap-1 text-[10px] font-black uppercase text-green-400"><CheckCircle2 className="h-3 w-3" /> Resuelto</span>}
              </div>
              <p className="mb-3 text-sm text-white/90">{p.texto}</p>

              {(respuestas[p.id] || []).length > 0 && (
                <div className="mb-3 space-y-2 border-l-2 border-white/10 pl-3">
                  {respuestas[p.id].map((r) => (
                    <div key={r.id} className="text-xs text-white/70">
                      <span className="font-bold">
                        {r.negocio ? <Link href={`/negocio/${r.negocio.slug}`} className="text-orange-300 hover:text-orange-200"><Store className="mr-1 inline h-3 w-3" />{r.negocio.name}</Link> : r.autor}
                      </span>: {r.mensaje}
                    </div>
                  ))}
                </div>
              )}

              {!p.resuelto && (
                <div className="flex flex-wrap items-center gap-3">
                  {abierto === p.id ? (
                    <div className="flex w-full gap-2">
                      <input type="text" value={respTexto} onChange={(e) => setRespTexto(e.target.value)} maxLength={200}
                        placeholder="Yo tengo / conozco un lugar..." autoFocus
                        className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs outline-none focus:border-orange-400" />
                      <button onClick={() => responder(p.id)} disabled={respondiendo || respTexto.trim().length < 2}
                        className="rounded-lg bg-orange-500/20 border border-orange-400/40 px-3 py-1.5 text-xs font-bold text-orange-300 disabled:opacity-50">
                        Enviar
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setAbierto(p.id); setRespTexto(""); }}
                      className="flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-white/80">
                      <MessageCircle className="h-3.5 w-3.5" /> Responder
                    </button>
                  )}
                  {user?.id === p.user_id && (
                    <button onClick={() => marcarResuelto(p.id)} className="text-xs font-bold text-white/40 hover:text-green-400">
                      Marcar resuelto
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
