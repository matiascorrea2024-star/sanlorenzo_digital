"use client";
import Link from "next/link";
import { Bot } from "lucide-react";

export default function FloatingAssistant() {
  return (
    <Link
      href="/asistente"
      title="🤖 Asistente IA de San Lorenzo"
      className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/40 transition hover:scale-110 md:bottom-8"
    >
      <Bot className="h-6 w-6 text-white" />
    </Link>
  );
}
