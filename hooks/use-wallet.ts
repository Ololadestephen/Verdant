"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { connectEVMWallet } from "@/lib/evm/wallet";
import { useAppStore } from "@/hooks/use-app-store";

export type SupportedWallet = "evm" | "metamask" | "rabby";

export function useWallet() {
  const { walletAddress, walletType, authToken, setWallet, clearWallet } = useAppStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (_providerType: string = "evm") => {
    setIsConnecting(true);
    setError(null);
    try {
      const result = await connectEVMWallet();
      setWallet(result.address, "EVM Wallet", result.token);
      return result.address;
    } catch (err) {
      console.error("[useWallet] Connection Error:", err);
      const message = err instanceof Error ? err.message : "Failed to connect EVM wallet.";
      setError(message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [setWallet]);

  // Check auth status on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (walletAddress) {
      fetch("/api/auth/me")
        .then((res) => {
          if (!res.ok) {
            // Session expired or invalid
            clearWallet();
          }
        })
        .catch(() => {
          // ignore network error
        });
    }
  }, [walletAddress, clearWallet]);

  const disconnect = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    clearWallet();
  }, [clearWallet]);

  return useMemo(() => ({
    walletAddress,
    walletType: walletType || "BOT Chain EVM",
    authToken,
    isConnecting,
    error,
    connect,
    disconnect,
    isConnected: Boolean(walletAddress)
  }), [walletAddress, walletType, authToken, isConnecting, error, connect, disconnect]);
}
