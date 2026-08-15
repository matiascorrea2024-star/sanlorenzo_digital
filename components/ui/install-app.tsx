"use client";
import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

// Singleton a nivel de módulo: el listener se registra UNA sola vez
let deferredPrompt: any = null;
let listenerRegistered = false;

export default function InstallApp() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!listenerRegistered) {
      listenerRegistered = true;
      window.addEventListener("beforeinstallprompt", (e: any) => {
        e.preventDefault();
        deferredPrompt = e;
        try {
          if (!localStorage.getItem("sld-installed")) setVisible(true);
        } catch {}
      });
    }
  }, []);

  const install = async () => {
    if (deferredPrompt) {
      try { await deferredPrompt.prompt(); } catch {}
      deferredPrompt = null;
    }
    setVisible(false);
    try { localStorage.setItem("sld-installed", "1"); } catch {}
  };

  const close = () => {
    setVisible(false);
    try { localStorage.setItem("sld-installed", "1"); } catch {}
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-36 left-4 right-4 z-[90] mx-auto max-w-sm rounded-2xl border border-orange-400/40 bg-[#141018]/95 p-4 shadow-2xl backdrop-blur-xl md:bottom-24">
      <button onClick={close} aria-label="Cerrar aviso de instalación"
        className="absolute right-2 top-2 text-white/40 hover:text-white">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-pink-500">
          <Download className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-black">Instalá La Gran Barata</p>
          <p className="text-xs text-white/60">Accedé más rápido desde tu teléfono</p>
        </div>
      </div>
      <button onClick={install}
        className="mt-3 w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-2.5 text-sm font-black hover:opacity-90">
        Instalar app
      </button>
    </div>
  );
}
