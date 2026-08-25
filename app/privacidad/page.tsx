import PageHero from "@/components/ui/page-hero";

export const metadata = {
  title: "Política de Privacidad | La Gran Barata Digital",
  description: "Cómo tratamos tus datos en La Gran Barata Digital, conforme la Ley 25.326 de Protección de Datos Personales (Argentina).",
};

export default function PrivacidadPage() {
  return (
    <main className="bg-[#0c0a0b] text-[#f7f3ec] min-h-screen">
      <PageHero title="Política de Privacidad" subtitle="San Lorenzo Digital · Ley 25.326" />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm text-[#7d6f5c]">Última actualización: agosto 2026 · San Lorenzo, Santa Fe, Argentina</p>

        <div className="mt-10 space-y-10">
          {[
            { t: "Datos que recopilamos", body: (
              <ul className="list-disc space-y-1.5 pl-5">
                <li><strong className="text-[var(--text)]">Cuenta:</strong> email y nombre al registrarte como comerciante o usuario.</li>
                <li><strong className="text-[var(--text)]">Navegación:</strong> dirección IP, tipo de dispositivo y páginas visitadas, con fines estadísticos y de seguridad.</li>
                <li><strong className="text-[var(--text)]">Datos de negocios:</strong> la información que el comerciante decide publicar (nombre, dirección, fotos, ofertas, WhatsApp).</li>
              </ul>
            ) },
            { t: "Uso de los datos", body: (
              <>
                <p>Usamos tus datos para:</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  <li>Brindarte acceso a la plataforma y sus funciones.</li>
                  <li>Mostrarte negocios, ofertas y contenido relevante de San Lorenzo.</li>
                  <li>Enviar notificaciones (solo si las activás).</li>
                  <li>Mejorar la experiencia general de la plataforma.</li>
                </ul>
              </>
            ) },
            { t: "Almacenamiento y seguridad", body: <p>Tus datos se almacenan en servidores seguros con encriptación. No vendemos ni compartimos tu información con terceros sin tu consentimiento explícito.</p> },
            { t: "Tus derechos (Ley 25.326)", body: <p>Tenés derecho a acceder, rectificar, actualizar y eliminar tus datos personales. Para ejercer estos derechos, escribinos a través del formulario de contacto o por WhatsApp.</p> },
            { t: "Cookies", body: <p>Usamos cookies para mantener tu sesión activa y mejorar la experiencia. Podés desactivarlas desde la configuración de tu navegador, aunque algunas funciones pueden verse afectadas.</p> },
            { t: "Menores de edad", body: <p>La plataforma está dirigida a mayores de 18 años. No recopilamos intencionalmente datos de menores sin consentimiento parental verificable.</p> },
            { t: "Cambios en esta política", body: <p>Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios importantes a través de la plataforma o por email.</p> },
            { t: "Contacto", body: <p>Para consultas sobre privacidad de datos, escribinos por WhatsApp o a través de la sección de contacto de la plataforma.</p> },
          ].map((s, i) => (
            <section key={s.t} className="border-t border-white/5 pt-6 first:border-t-0 first:pt-0">
              <div className="flex items-baseline gap-3">
                <span className="text-xs font-black text-[var(--accent)]" style={{ fontFamily: "var(--font-ticket)" }}>{String(i + 1).padStart(2, "0")}</span>
                <h2 className="font-display text-lg uppercase tracking-tight">{s.t}</h2>
              </div>
              <div className="mt-3 text-sm leading-[1.75] text-[#a99b86]">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
