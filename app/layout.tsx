import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
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

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0d0a12",
  colorScheme: "dark",
};

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
        <ToastProvider>
        <AuthProvider>
        <HeartbeatActivator />
          <Header />
          {children}
          <Footer />
          <BottomNav />
          <OnlineNow />
      <FloatingAssistant />
      <Spotlight />
      <ScrollReveal />
        </AuthProvider>
      </ToastProvider>
      <InstallApp />
      </body>
    </html>
  );
}
