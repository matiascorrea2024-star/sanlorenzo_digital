export const metadata = {
  title: "Política de Privacidad | La Gran Barata Digital",
  description: "Cómo tratamos tus datos en La Gran Barata Digital, conforme la Ley 25.326 de Protección de Datos Personales (Argentina).",
};

export default function PrivacidadPage() {
  return (
    <main className="bg-[#0d0a12] text-white min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <a href="/" className="text-sm text-orange-400 hover:text-orange-300">← Volver al inicio</a>
        <h1 className="mt-4 text-3xl font-black md:text-4xl">🔐 Política de Privacidad</h1>
        <p className="mt-2 text-sm text-white/50">Última actualización: agosto 2026 · San Lorenzo, Santa Fe, Argentina</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-white/80">
          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">1. Datos que recopilamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cuenta:</strong> email y nombre al registrarte como comerciante o usuario.</li>
              <li><strong>Navegación:</strong> dirección IP, tipo de dispositivo y páginas visitadas, con fines estadísticos y de seguridad.</li>
              <li><strong>Datos de negocios:</strong> la información que el comerciante decide publicar (nombre, dirección, fotos, ofertas, WhatsApp).</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">2. Para qué los usamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mostrar los negocios y ofertas en la plataforma.</li>
              <li>Generar estadísticas de visitas para los comercios y la administración.</li>
              <li>Prevenir abusos y mejorar el servicio.</li>
            </ul>
            <p className="mt-2">No vendemos ni cedemos tus datos a terceros.</p>
          </section>
          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">3. Base legal</h2>
            <p>El tratamiento se realiza conforme la <strong>Ley 25.326 de Protección de Datos Personales</strong> (Argentina). Los datos de navegación se tratan con consentimiento implícito al usar el sitio; los datos de cuenta, con tu consentimiento expreso al registrarte.</p>
          </section>
          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">4. Tus derechos</h2>
            <p>Podés ejercer los derechos de acceso, rectificación y supresión de tus datos en cualquier momento escribiéndonos desde tu cuenta o al contacto del comercio. La baja de la cuenta elimina tus datos personales.</p>
          </section>
          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">5. Conservación y seguridad</h2>
            <p>Los datos se almacenan en servidores seguros (Supabase/Vercel) con control de acceso. Las estadísticas de IP se conservan de forma agregada y se depuran periódicamente.</p>
          </section>
          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">6. Cookies y almacenamiento local</h2>
            <p>Usamos almacenamiento técnico necesario para mantener tu sesión iniciada. No usamos cookies publicitarias de terceros.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
