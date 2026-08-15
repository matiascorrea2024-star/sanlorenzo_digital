import PageHero from "@/components/ui/page-hero";

export const metadata = {
  title: "Política de Privacidad | La Gran Barata Digital",
  description: "Cómo tratamos tus datos en La Gran Barata Digital, conforme la Ley 25.326 de Protección de Datos Personales (Argentina).",
};

export default function PrivacidadPage() {
  return (
    <main className="bg-[#0a0710] text-white min-h-screen">
      <PageHero title="📄 Política de Privacidad" subtitle="San Lorenzo Digital · Ley 25.326" />
      <div className="mx-auto max-w-3xl px-4 py-12">
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
            <h2 className="text-lg font-black text-orange-400 mb-2">2. Uso de los datos</h2>
            <p>Usamos tus datos para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Brindarte acceso a la plataforma y sus funciones.</li>
              <li>Mostrarte negocios, ofertas y contenido relevante de San Lorenzo.</li>
              <li>Enviar notificaciones (solo si las activás).</li>
              <li>Mejorar la experiencia general de la plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">3. Almacenamiento y seguridad</h2>
            <p>Tus datos se almacenan en servidores seguros con encriptación. No vendemos ni compartimos tu información con terceros sin tu consentimiento explícito.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">4. Tus derechos (Ley 25.326)</h2>
            <p>Tenés derecho a acceder, rectificar, actualizar y eliminar tus datos personales. Para ejercer estos derechos, escribinos a través del formulario de contacto o por WhatsApp.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">5. Cookies</h2>
            <p>Usamos cookies para mantener tu sesión activa y mejorar la experiencia. Podés desactivarlas desde la configuración de tu navegador, aunque algunas funciones pueden verse afectadas.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">6. Menores de edad</h2>
            <p>La plataforma está dirigida a mayores de 18 años. No recopilamos intencionalmente datos de menores sin consentimiento parental verificable.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">7. Cambios en esta política</h2>
            <p>Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios importantes a través de la plataforma o por email.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-orange-400 mb-2">8. Contacto</h2>
            <p>Para consultas sobre privacidad de datos, escribinos por WhatsApp o a través de la sección de contacto de la plataforma.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
