export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0710] py-10 text-center text-sm text-white/50">
      <p className="text-lg font-black text-white">
        🛍️ LA GRAN{" "}
        <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
          BARATA
        </span>{" "}
        DIGITAL
      </p>
      <p className="mt-2">Todas las ofertas y negocios de San Lorenzo en un solo lugar.</p>
      <p className="mt-1 text-xs">Hecho en San Lorenzo, Santa Fe · Argentina</p>
    <p className="mt-3 text-xs flex justify-center gap-4">
          <a href="/privacidad" className="hover:text-orange-400 transition-colors">Política de Privacidad</a>
          <span className="text-white/20">·</span>
          <a href="/terminos" className="hover:text-orange-400 transition-colors">Términos y Condiciones</a>
        </p>
      </footer>
  );
}
