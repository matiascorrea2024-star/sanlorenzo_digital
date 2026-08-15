"use client";
import Link from "next/link";
import { Bot } from "lucide-react";

export default function FloatingAssistant() {
  return (
    <Link
      href="/asistente"
      title="🤖 Asistente IA de San Lorenzo"
      className="fixed bottom-[5.5rem] right-4 z-40 flex h-12 w-12 md:bottom-8 md:h-14 md:w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/40 transition hover:scale-110 md:bottom-8"
    >
      <Bot className="h-5 w-5 md:h-6 md:w-6 text-white" />
    </Link>
  );
}
