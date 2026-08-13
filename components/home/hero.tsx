"use client";
const POPULAR=["zapatillas","café","ferretería","barbería","ropa","regalos"];
export default function Hero({onSearch}:{onSearch:(q:string)=>void}){return <section className="relative overflow-hidden border-b border-[var(--line)] sld-grid">
  <div className="absolute left-1/2 top-[-240px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[110px]"/><div className="absolute right-[-180px] top-24 h-[320px] w-[320px] rounded-full bg-cyan-400/10 blur-[100px]"/>
  <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 md:pb-28 md:pt-24">
    <div className="mx-auto max-w-4xl text-center"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--muted)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--ok)] shadow-[0_0_12px_var(--ok)]"/> San Lorenzo · Santa Fe</div>
      <h1 className="text-5xl font-black leading-[.96] tracking-[-.045em] sm:text-6xl md:text-8xl" style={{fontFamily:"var(--font-space)"}}>Todo San Lorenzo,<br/><span className="bg-gradient-to-r from-white via-violet-300 to-cyan-300 bg-clip-text text-transparent">en un solo lugar.</span></h1>
      <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">Encontrá comercios, productos, servicios, promociones y lugares de confianza. Buscá lo que necesitás y conectá directo con el negocio.</p>
      <form onSubmit={e=>{e.preventDefault();const v=new FormData(e.currentTarget).get("q") as string;onSearch(v||"")}} className="sld-glow mx-auto mt-9 flex max-w-3xl flex-col gap-2 rounded-2xl border border-white/10 bg-[#0d1017]/90 p-2 shadow-2xl sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-white/[.035] px-4"><span className="text-lg">⌕</span><input name="q" placeholder="¿Qué estás buscando?" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-[var(--muted2)] sm:text-base"/></div><div className="hidden items-center gap-2 rounded-xl border border-white/5 bg-white/[.025] px-4 text-sm text-[var(--muted)] sm:flex">📍 San Lorenzo</div><button className="rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/30">Buscar</button>
      </form>
      <div className="mt-5 flex flex-wrap justify-center gap-2">{POPULAR.map(p=><button key={p} onClick={()=>onSearch(p)} className="rounded-full border border-white/10 bg-white/[.025] px-3 py-1.5 text-xs text-[var(--muted)] hover:border-violet-400/40 hover:text-white">{p}</button>)}</div>
    </div>
    <div className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-4"><Stat n="+" label="comercios"/><Stat n="24/7" label="directorio online"/><Stat n="📍" label="mapa local"/><Stat n="💬" label="contacto directo"/></div>
  </div>
</section>}
function Stat({n,label}:{n:string,label:string}){return <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4 text-center backdrop-blur"><div className="text-lg font-bold text-white">{n}</div><div className="mt-1 text-[11px] uppercase tracking-[.16em] text-[var(--muted2)]">{label}</div></div>}
