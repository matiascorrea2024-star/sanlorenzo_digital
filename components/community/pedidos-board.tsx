"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2, MessageCircle, Store, PenTool, Share2 } from "lucide-react";
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
    supabase().from("businesses").select("id, name").eq("owner_id", user.id).order("name").limit(1).maybeSingle().then(({ data }) => setMisNegocio(data));
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
  // Stats reales -- ambos surgen de la misma data ya cargada, nada
  // inventado: activos = no resueltos, tasa de respuesta = % de pedidos
  // (de todos los tiempos, no solo los visibles) que tuvieron al menos
  // una respuesta.
  const activos = pedidos.filter((p) => !p.resuelto).length;
  const tasaRespuesta = pedidos.length > 0
    ? Math.round((pedidos.filter((p) => (respuestas[p.id] || []).length > 0).length / pedidos.length) * 100)
    : null;

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
      {/* IZQUIERDA: intro editorial + compositor + stats reales */}
      <div className="lg:col-span-5">
        <div className="rounded-[2rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
          <div className="rounded-[1.625rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ov-10)]"><PenTool className="h-3.5 w-3.5 text-[var(--accent)]" /></span>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Nueva solicitud</span>
            </div>
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} maxLength={280}
              placeholder="¿Qué estás buscando? Ej: alguien que tenga un repuesto de..."
              className="w-full resize-none border-none bg-transparent text-lg font-medium text-[var(--text)] outline-none placeholder:text-[var(--muted2)]" />
            <div className="flex items-center justify-end border-t border-[var(--ov-05)] pt-4">
              <button onClick={publicar} disabled={publicando || texto.trim().length < 5}
                className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
                <Send className="h-3.5 w-3.5" /> {publicando ? "Publicando..." : "Publicar pedido"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex gap-10">
          <div>
            <span className="block text-4xl font-black text-[var(--text)]" style={{ fontFamily: "var(--font-ticket)" }}>{activos}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted2)]">Pedidos activos</span>
          </div>
          {tasaRespuesta !== null && (
            <div>
              <span className="block text-4xl font-black text-[var(--accent)]" style={{ fontFamily: "var(--font-ticket)" }}>{tasaRespuesta}%</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted2)]">Tasa de respuesta</span>
            </div>
          )}
        </div>
      </div>

      {/* DERECHA: feed */}
      <div className="lg:col-span-7">
        {pedidos.some((p) => p.resuelto) && (
          <div className="mb-6 flex items-center justify-between border-b border-[var(--ov-05)] pb-4">
            <span className="text-xs font-black uppercase tracking-widest text-[var(--text)]">Pedidos</span>
            <button onClick={() => setVerResueltos((v) => !v)} className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted2)] hover:text-[var(--text)]">
              {verResueltos ? "Ocultar resueltos" : "Ver resueltos también"}
            </button>
          </div>
        )}

        {visibles.length === 0 ? (
          <p className="rounded-[2rem] border border-[var(--line)] bg-[var(--ov-02)] p-8 text-center text-sm text-[var(--muted)]">
            Todavía nadie pidió nada por acá. ¡Arrancá vos!
          </p>
        ) : (
          <div className="space-y-6">
            {visibles.map((p) => (
              <article key={p.id} className={`rounded-[2.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-6 transition-all duration-500 hover:-translate-y-1 sm:p-8 ${p.resuelto ? "opacity-60" : ""}`}>
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ov-05)] bg-gradient-to-br from-[var(--ov-10)] to-transparent text-sm font-bold text-[var(--text)]" style={{ fontFamily: "var(--font-space)" }}>
                      {p.autor.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <div>
                      <h3 className="font-bold text-[var(--text)]">{p.autor}</h3>
                      <span className="text-xs text-[var(--muted2)]">{tiempoDesde(p.created_at)}</span>
                    </div>
                  </div>
                  {p.resuelto ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--ok)]">
                      <CheckCircle2 className="h-3 w-3" /> Resuelto
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">Buscando</span>
                  )}
                </div>

                <p className={`mb-6 text-lg font-medium leading-snug ${p.resuelto ? "text-[var(--muted)]" : "text-[var(--text)]/90"}`}>{p.texto}</p>

                {(respuestas[p.id] || []).length > 0 && (
                  <div className="mb-6 space-y-3">
                    {respuestas[p.id].map((r) => (
                      <div key={r.id} className="flex items-start gap-3 rounded-3xl border border-[var(--ov-05)] bg-[var(--ov-05)] p-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20"><Store className="h-3.5 w-3.5 text-[var(--ok)]" /></span>
                        <div className="min-w-0">
                          {r.negocio ? (
                            <div className="mb-1 flex items-center gap-2">
                              <Link href={`/negocio/${r.negocio.slug}`} className="text-xs font-bold text-[var(--accent)] hover:underline">{r.negocio.name}</Link>
                              <span className="rounded bg-[var(--ov-10)] px-1.5 py-0.5 text-[9px] font-black uppercase text-[var(--muted2)]">Negocio</span>
                            </div>
                          ) : (
                            <p className="mb-1 text-xs font-bold text-[var(--text)]/70">{r.autor}</p>
                          )}
                          <p className="text-sm text-[var(--text)]/70">{r.mensaje}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!p.resuelto && (
                  <div className="flex items-center gap-4 border-t border-[var(--ov-05)] pt-4">
                    {abierto === p.id ? (
                      <div className="flex w-full gap-2">
                        <input type="text" value={respTexto} onChange={(e) => setRespTexto(e.target.value)} maxLength={200}
                          placeholder="Yo tengo / conozco un lugar..." autoFocus
                          className="flex-1 rounded-full border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]" />
                        <button onClick={() => responder(p.id)} disabled={respondiendo || respTexto.trim().length < 2}
                          className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/20 px-4 py-2 text-xs font-bold text-[var(--accent)] disabled:opacity-50">
                          Enviar
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setAbierto(p.id); setRespTexto(""); }}
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--muted2)] hover:text-[var(--accent)]">
                        <MessageCircle className="h-4 w-4" /> Responder
                      </button>
                    )}
                    <button onClick={() => {
                      const url = typeof window !== "undefined" ? `${window.location.origin}/pedidos` : "/pedidos";
                      if (navigator.share) navigator.share({ title: "¿Quién tiene esto?", text: p.texto, url }).catch(() => {});
                      else navigator.clipboard?.writeText(url);
                    }} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--muted2)] hover:text-[var(--text)]">
                      <Share2 className="h-4 w-4" /> Compartir
                    </button>
                    {user?.id === p.user_id && (
                      <button onClick={() => marcarResuelto(p.id)} className="ml-auto text-xs font-black uppercase tracking-widest text-[var(--ok)] hover:underline">
                        Marcar resuelto
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
