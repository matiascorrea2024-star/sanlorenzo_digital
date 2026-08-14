"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type Toast = { id: number; msg: string; type: "success" | "error" | "info" };
type ToastContextType = { show: (msg: string, type?: Toast["type"]) => void };

const ToastContext = createContext<ToastContextType>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = (msg: string, type: Toast["type"] = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  return (
    <ToastContext.Provider value={{ show }}>
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
                : "border-orange-400/30 bg-orange-500/20 text-orange-200"
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
