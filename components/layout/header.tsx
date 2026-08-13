import Link from 'next/link';
import AuthButton from './auth-button';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="text-3xl">🛍️</div>
            <div>
              <h1 className="text-xl font-bold leading-tight group-hover:scale-105 transition-transform">
                LA GRAN BARATA
              </h1>
              <p className="text-xs text-orange-100 leading-tight">DIGITAL</p>
            </div>
          </Link>

          {/* Nav Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/negocios" className="hover:text-orange-200 transition-colors font-medium">
              Negocios
            </Link>
            <Link href="/mapa" className="hover:text-orange-200 transition-colors font-medium">
              Mapa
            </Link>
              <Link href="/feed" className="hover:text-orange-200 transition-colors font-medium">Muro</Link>
              <Link  href="/ranking" className="hover:text-orange-200 transition-colors font-medium">Ranking</Link>
            <Link href="/para-negocios" className="hover:text-orange-200 transition-colors font-medium">
              Para Negocios
            </Link>
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3">
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
}
