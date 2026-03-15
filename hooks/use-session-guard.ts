"use client";

import { useEffect } from "react";
import { useAppStore } from "@/hooks/use-app-store";

/**
 * On app mount, validates the persisted activeSessionId against the database.
 * If the session is no longer active (failed, completed, expired, not found),
 * clears the stale session ID so the user can stake again.
 */
export function useSessionGuard() {
  const { activeSessionId, setActiveSessionId } = useAppStore();

  useEffect(() => {
    if (!activeSessionId) return;

    const check = async () => {
      try {
        const res = await fetch(`/api/session/status?sessionId=${activeSessionId}`);
        if (!res.ok) {
          setActiveSessionId(null);
          return;
        }
        const { status } = (await res.json()) as { status?: string };
        // Only keep the session ID if it's genuinely still active
        if (status !== "active" && status !== "pending_verification") {
          setActiveSessionId(null);
        }
      } catch {
        // Network error — leave as-is, don't clear
      }
    };

    void check();
  }, [activeSessionId, setActiveSessionId]);
}
