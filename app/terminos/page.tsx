import PageHero from "@/components/ui/page-hero";

export const metadata = {
  title: "Términos y Condiciones | La Gran Barata Digital",
  description: "Condiciones de uso de La Gran Barata Digital, la plataforma de ofertas y negocios de San Lorenzo.",
};

export default function TerminosPage() {
  return (
    <main className="bg-[#120d09] text-white min-h-screen">
      <PageHero title="📄 Términos y Condiciones" subtitle="San Lorenzo Digital · Ley 25.326" />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="mt-2 text-sm text-white/50">Última actualización: agosto 2026 · San Lorenzo, Santa Fe, Argentina</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-white/80">
          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">1. Qué es La Gran Barata Digital</h2>
            <p>Una plataforma que conecta a los comercios de San Lorenzo y la región con clientes, mediante miniwebs, ofertas, promociones y un mapa comercial. La plataforma no vende productos directamente: cada negocio es responsable de su propia oferta.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">2. Uso de la plataforma</h2>
            <p>Al usar La Gran Barata Digital, aceptás:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>No utilizar la plataforma con fines ilegales o fraudulentos.</li>
              <li>No intentar acceder a áreas restringidas del sistema.</li>
              <li>No realizar scraping, bots o actividades que sobrecarguen los servidores.</li>
              <li>Respetar a otros usuarios y comercios de la comunidad.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">3. Responsabilidad de los comercios</h2>
            <p>Cada negocio registrado es responsable de:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>La veracidad de la información publicada (productos, precios, ofertas).</li>
              <li>Cumplir con las promociones y ofertas que publica.</li>
              <li>Mantener actualizados sus datos de contacto y horarios.</li>
              <li>Responder consultas y mensajes de clientes en tiempo razonable.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">4. Responsabilidad de los usuarios</h2>
            <p>Los usuarios son responsables de:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Verificar la información de ofertas y productos directamente con el comercio.</li>
              <li>Dejar reseñas honestas y respetuosas.</li>
              <li>No utilizar la plataforma para spam o actividades comerciales no autorizadas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">5. Propiedad intelectual</h2>
            <p>El diseño, código y marca &quot;La Gran Barata Digital&quot; son propiedad de la plataforma. Los comercios mantienen la propiedad de sus logos, fotos y contenido publicado.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">6. Planes y pagos</h2>
            <p>Los planes Premium se pagan por adelantado. El servicio se mantiene activo durante el período contratado. No hay reembolsos automáticos, pero podés cancelar en cualquier momento.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">7. Suspensión de cuentas</h2>
            <p>Nos reservamos el derecho de suspender cuentas que violen estos términos, publiquen contenido ilegal o fraudulentas, o acumulen reportes de usuarios.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">8. Limitación de responsabilidad</h2>
            <p>La plataforma no se hace responsable por transacciones, productos o servicios entre usuarios y comercios. Somos un intermediario tecnológico que facilita la conexión.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">9. Modificaciones</h2>
            <p>Estos términos pueden modificarse. Los cambios se publicarán en esta página y entrarán en vigor 7 días después de su publicación.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">10. Jurisdicción</h2>
            <p>Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa se resolverá en los tribunales de la ciudad de San Lorenzo, Santa Fe.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
