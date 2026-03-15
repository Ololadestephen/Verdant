"use client";

import { useSessionGuard } from "@/hooks/use-session-guard";

export function SessionGuardProvider() {
  useSessionGuard();
  return null;
}
