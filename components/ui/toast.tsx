"use client";
import { createContext, useContext, useState, useCallback, useMemo, useRef, ReactNode } from "react";

type Toast = { id: number; msg: string; type: "success" | "error" | "info" };
type ToastContextType = { show: (msg: string, type?: Toast["type"]) => void };

const ToastContext = createContext<ToastContextType>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Contador propio en vez de Date.now(): dos toasts disparados en el
  // mismo milisegundo (ej. un loop de errores) terminaban con el mismo
  // id -> "key" duplicada en el .map() de abajo y warning de React.
  const nextId = useRef(0);

  // show memoizado (useCallback) y el value del contexto memoizado
  // (useMemo): sin esto, `show` es una función nueva en cada render del
  // provider y cualquier componente que la use como dependencia de un
  // useCallback/useEffect (ej. components/dashboard/qr-vidriera.tsx)
  // vuelve a disparar su efecto en cada render -- causó un loop real de
  // fetch a /api/tracked-links (~29 llamadas en 4s hasta el 429) en
  // /dashboard. Ver HANDOFF.md.
  const show = useCallback((msg: string, type: Toast["type"] = "info") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-20 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-in fade-in slide-in-from-right-4 rounded-xl border px-4 py-3 text-sm font-bold shadow-lg backdrop-blur-md ${
              t.type === "success"
                ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-200"
                : t.type === "error"
                ? "border-red-400/30 bg-red-500/20 text-red-200"
                : "border-[var(--accent)]/30 bg-[var(--accent)]/20 text-[var(--accent)]"
            }`}
          >
            {t.type === "success" && "✅ "}
            {t.type === "error" && "❌ "}
            {t.type === "info" && "ℹ️ "}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
