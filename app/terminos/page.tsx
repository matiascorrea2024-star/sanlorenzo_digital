export const metadata = {
  title: "Términos y Condiciones | La Gran Barata Digital",
  description: "Condiciones de uso de La Gran Barata Digital, la plataforma de ofertas y negocios de San Lorenzo.",
};

export default function TerminosPage() {
  return (
    <main className="bg-[#0d0a12] text-white min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <a href="/" className="text-sm text-orange-400 hover:text-orange-300">← Volver al inicio</a>
        <h1 className="mt-4 text-3xl font-black md:text-4xl">📄 Términos y Condiciones</h1>
        <p className="mt-2 text-sm text-white/50">Última actualización: agosto 2026 · San Lorenzo, Santa Fe, Argentina</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-white/80">
          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">1. Qué es La Gran Barata Digital</h2>
            <p>Una plataforma que conecta a los comercios de San Lorenzo y la región con clientes, mediante miniwebs, ofertas, promociones y un mapa comercial. La plataforma no vende productos directamente: cada negocio es responsable de su propia oferta.</p>
          </section>
          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">2. Responsabilidades del comercio</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Publicar información verídica: precios, stock, horarios y ubicación.</li>
              <li>Mantener actualizadas sus ofertas; las vencidas se ocultan automáticamente.</li>
              <li>Responder directamente ante sus clientes por productos y servicios.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">3. Moderación</h2>
            <p>La administración puede ocultar o dar de baja negocios, ofertas o reseñas que incumplan estas condiciones, contengan información falsa o afecten a terceros. Las reseñas son opinión de los usuarios; el comercio puede moderar las de su propio negocio.</p>
          </section>
          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">4. Gratuidad y planes futuros</h2>
            <p>El alta de negocios es gratuita durante la etapa de lanzamiento. Cuando se lancen planes pagos, los comercios serán notificados con anticipación y ningún cobro se realizará sin consentimiento expreso.</p>
          </section>
          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">5. Propiedad intelectual</h2>
            <p>La marca y el diseño de La Gran Barata Digital son de su titular. Cada comercio conserva los derechos sobre sus fotos, logos y contenidos publicados.</p>
          </section>
          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">6. Aceptación</h2>
            <p>Al registrarte o usar la plataforma aceptás estos términos y la Política de Privacidad.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
