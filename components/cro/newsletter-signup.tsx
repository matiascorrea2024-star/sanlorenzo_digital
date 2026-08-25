"use client";
import { useState } from "react";
import { Mail } from "lucide-react";
import { useToast } from "@/components/ui/toast";

declare global {
  interface Window {
    trackEvent?: (name: string, params: Record<string, any>) => void;
  }
}

export default function NewsletterSignup() {
  const { show } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        show("✅ ¡Te agregamos a la newsletter!", "success");
        setEmail("");
        if (typeof window !== "undefined" && window.trackEvent) {
          window.trackEvent("newsletter_signup", { email: email.split("@")[1] });
        }
      } else {
        show("⚠️ Algo salió mal. Probá de nuevo.", "error");
      }
    } catch {
      show("❌ Error al suscribirse.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface2)] p-4 sm:flex-row"
    >
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-[var(--accent)]" />
        <input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-transparent text-sm placeholder-[var(--muted)] focus:outline-none"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="whitespace-nowrap rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--accent2)] disabled:opacity-50"
      >
        {loading ? "Suscribiendo..." : "Suscribirse"}
      </button>
    </form>
  );
}
