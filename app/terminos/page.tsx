import PageHero from "@/components/ui/page-hero";

export const metadata = {
  title: "Términos y Condiciones | La Gran Barata Digital",
  description: "Condiciones de uso de La Gran Barata Digital, la plataforma de ofertas y negocios de San Lorenzo.",
};

export default function TerminosPage() {
  return (
    <main className="bg-[var(--bg)] text-[var(--text)] min-h-screen">
      <PageHero title="Términos y Condiciones" subtitle="San Lorenzo Digital · Ley 25.326" />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm text-[var(--muted2)]">Última actualización: agosto 2026 · San Lorenzo, Santa Fe, Argentina</p>

        <div className="mt-10 space-y-10">
          {[
            { t: "Qué es La Gran Barata Digital", body: <p>Una plataforma que conecta a los comercios de San Lorenzo y la región con clientes, mediante miniwebs, ofertas, promociones y un mapa comercial. La plataforma no vende productos directamente: cada negocio es responsable de su propia oferta.</p> },
            { t: "Uso de la plataforma", body: (
              <>
                <p>Al usar La Gran Barata Digital, aceptás:</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  <li>No utilizar la plataforma con fines ilegales o fraudulentos.</li>
                  <li>No intentar acceder a áreas restringidas del sistema.</li>
                  <li>No realizar scraping, bots o actividades que sobrecarguen los servidores.</li>
                  <li>Respetar a otros usuarios y comercios de la comunidad.</li>
                </ul>
              </>
            ) },
            { t: "Responsabilidad de los comercios", body: (
              <>
                <p>Cada negocio registrado es responsable de:</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  <li>La veracidad de la información publicada (productos, precios, ofertas).</li>
                  <li>Cumplir con las promociones y ofertas que publica.</li>
                  <li>Mantener actualizados sus datos de contacto y horarios.</li>
                  <li>Responder consultas y mensajes de clientes en tiempo razonable.</li>
                </ul>
              </>
            ) },
            { t: "Responsabilidad de los usuarios", body: (
              <>
                <p>Los usuarios son responsables de:</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  <li>Verificar la información de ofertas y productos directamente con el comercio.</li>
                  <li>Dejar reseñas honestas y respetuosas.</li>
                  <li>No utilizar la plataforma para spam o actividades comerciales no autorizadas.</li>
                </ul>
              </>
            ) },
            { t: "Propiedad intelectual", body: <p>El diseño, código y marca &quot;La Gran Barata Digital&quot; son propiedad de la plataforma. Los comercios mantienen la propiedad de sus logos, fotos y contenido publicado.</p> },
            { t: "Planes y pagos", body: <p>Los planes Premium se pagan por adelantado. El servicio se mantiene activo durante el período contratado. No hay reembolsos automáticos, pero podés cancelar en cualquier momento.</p> },
            { t: "Suspensión de cuentas", body: <p>Nos reservamos el derecho de suspender cuentas que violen estos términos, publiquen contenido ilegal o fraudulentas, o acumulen reportes de usuarios.</p> },
            { t: "Limitación de responsabilidad", body: <p>La plataforma no se hace responsable por transacciones, productos o servicios entre usuarios y comercios. Somos un intermediario tecnológico que facilita la conexión.</p> },
            { t: "Modificaciones", body: <p>Estos términos pueden modificarse. Los cambios se publicarán en esta página y entrarán en vigor 7 días después de su publicación.</p> },
            { t: "Jurisdicción", body: <p>Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa se resolverá en los tribunales de la ciudad de San Lorenzo, Santa Fe.</p> },
          ].map((s, i) => (
            <section key={s.t} className="border-t border-[var(--line)] pt-6 first:border-t-0 first:pt-0">
              <div className="flex items-baseline gap-3">
                <span className="text-xs font-black text-[var(--accent)]" style={{ fontFamily: "var(--font-ticket)" }}>{String(i + 1).padStart(2, "0")}</span>
                <h2 className="font-display text-lg uppercase tracking-tight">{s.t}</h2>
              </div>
              <div className="mt-3 text-sm leading-[1.75] text-[var(--muted)]">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
