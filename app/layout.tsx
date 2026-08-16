import type { Metadata } from "next";
import { Inter, Space_Grotesk, Big_Shoulders } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import BottomNav from "@/components/layout/bottom-nav";
import OnlineNow from "@/components/live/online-now";
import FloatingAssistant from "@/components/ui/floating-assistant";
import Spotlight from "@/components/ui/spotlight";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { ToastProvider } from "@/components/ui/toast";
import HeartbeatActivator from "@/components/heartbeat-activator";
import { AuthProvider } from "@/components/providers/auth-provider";
import OnboardingOverlay from "@/components/onboarding/onboarding-overlay";
import ReferralTracker from "@/components/referral-tracker";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
// Cara "cartel de mercado / ticket" para el wordmark, precios y descuentos --
// condensada y de peso pesado, referencia al cordón industrial real de San
// Lorenzo (Big Shoulders nació para la cartelería de Chicago), no una
// tipografía de SaaS genérica.
const ticket = Big_Shoulders({ subsets: ["latin"], weight: "variable", axes: ["opsz"], variable: "--font-ticket" });

import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#120d09",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sanlorenzodigital.vercel.app"),
  openGraph: {
    images: [{ url: "/banner.jpg", width: 1200, height: 630, alt: "La Gran Barata Digital" }],
    locale: "es_AR",
  },
  twitter: { card: "summary_large_image", images: ["/banner.jpg"] },
  title: "San Lorenzo Digital — Todo San Lorenzo, en un solo lugar",
  description: "Descubrí comercios, productos, servicios, promociones y lugares de San Lorenzo, Santa Fe.",
};

import InstallApp from "@/components/ui/install-app";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${inter.variable} ${space.variable} ${ticket.variable}`}>
      <body>
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
        <ToastProvider>
        <AuthProvider>
        <HeartbeatActivator />
          <Header />
          <div id="contenido">{children}</div>
          <Footer />
          <BottomNav />
          <OnlineNow />
      <FloatingAssistant />
      <Spotlight />
      <ScrollReveal />
      <OnboardingOverlay />
      <ReferralTracker />
        </AuthProvider>
      </ToastProvider>
      <InstallApp />
      </body>
    </html>
  );
}
