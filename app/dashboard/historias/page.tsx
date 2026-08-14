"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import { postActivity } from "@/lib/activity";

const FONDOS = [
  "from-orange-500 to-pink-500",
  "from-green-500 to-teal-500",
  "from-blue-500 to-purple-500",
  "from-red-500 to-orange-500",
];

export default function HistoriasPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [text, setText] = useState("");
  const [background, setBackground] = useState(FONDOS[0]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      supabase().from("businesses").select("*").eq("owner_id", user.id).then(({ data }) => {
        if (data) { setBusinesses(data); if (data[0]) setBusinessId(data[0].id); }
      });
    }
  }, [user]);

  const publicar = async () => {
    setLoading(true);
    let image_url: string | null = null;
    if (file) {
      const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error: upErr } = await supabase().storage.from("stories").upload(path, file, { upsert: true });
      if (!upErr) image_url = supabase().storage.from("stories").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase().from("business_stories").insert({
      business_id: businessId, text, background, image_url,
      expires_at: new Date(Date.now() + 24*3600*1000).toISOString(),
    });
    if (!error) {
      const b = businesses.find(x => x.id === businessId);
      await postActivity({ type: "story_posted", businessId, title: `📸 ${b?.name} publicó una historia` });
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <main className="bg-[#0d0a12] min-h-screen text-white">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/dashboard" className="text-sm text-orange-400">← Volver</Link>
        <h1 className="text-3xl font-black mt-2">📸 Publicar Historia (24h)</h1>
        <p className="text-white/60 mt-1">Desaparece automáticamente en 24 horas</p>

        <div className="mt-6 space-y-4">
          <select value={businessId} onChange={e => setBusinessId(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3">
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
            placeholder="Ej: 🔥 HOY 20% OFF en todo el local"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3" />

          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-white/70 file:mr-3 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-orange-500 file:to-pink-500 file:px-4 file:py-2 file:text-sm file:font-black file:text-white" />

          <div className="flex gap-2">
            {FONDOS.map(f => (
              <button key={f} onClick={() => setBackground(f)}
                className={`h-10 w-10 rounded-full bg-gradient-to-br ${f} ${background === f ? "ring-2 ring-white" : ""}`} />
            ))}
          </div>

          <div className={`rounded-3xl bg-gradient-to-br ${background} p-8 text-center`}>
            <p className="text-xl font-black whitespace-pre-wrap">{text || "Vista previa"}</p>
          </div>

          <button onClick={publicar} disabled={loading || !text || !businessId}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-3 font-black disabled:opacity-50">
            {loading ? "Publicando..." : "Publicar Historia"}
          </button>
        </div>
      </div>
    </main>
  );
}
