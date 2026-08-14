import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import BottomNav from "@/components/layout/bottom-nav";
import OnlineNow from "@/components/live/online-now";
import { AuthProvider } from "@/components/providers/auth-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  metadataBase: new URL("https://sanlorenzodigital.vercel.app"),
  openGraph: {
    images: [{ url: "/banner.png", width: 1200, height: 630, alt: "La Gran Barata Digital" }],
    locale: "es_AR",
  },
  twitter: { card: "summary_large_image", images: ["/banner.png"] },
  title: "San Lorenzo Digital — Todo San Lorenzo, en un solo lugar",
  description: "Descubrí comercios, productos, servicios, promociones y lugares de San Lorenzo, Santa Fe.",
};

import InstallApp from "@/components/ui/install-app";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${inter.variable} ${space.variable}`}>
      <body>
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
        <AuthProvider>
          <Header />
          {children}
          <Footer />
          <BottomNav />
          <OnlineNow />
        </AuthProvider>
      <InstallApp />
      </body>
    </html>
  );
}
