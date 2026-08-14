"use client";
import { useAuth } from "@/components/providers/auth-provider";
import { useHeartbeat } from "@/lib/use-heartbeat";

export default function HeartbeatActivator() {
  const { user } = useAuth();
  useHeartbeat(user?.id);
  return null;
}
