import { useCallback, useMemo, useState, useEffect } from "react";

import { connectWallet, type SupportedWallet } from "@/lib/starknet/wallet";
import { useAppStore } from "@/hooks/use-app-store";

export function useWallet() {
  const { walletAddress, walletType, setWallet, clearWallet } = useAppStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (provider: SupportedWallet) => {
    setIsConnecting(true);
    setError(null);
    try {
      if (provider === "cartridge") {
        const { starkzap } = await import("@/lib/starknet/starkzap");
        const { OnboardStrategy } = await import("starkzap");
        const result = await starkzap.onboard({ strategy: OnboardStrategy.Cartridge });
        const address = result.wallet.address.toLowerCase();
        setWallet(address, "cartridge");
        return address;
      }

      const result = await connectWallet(provider);
      setWallet(result.address, result.wallet);
      return result.address;
    } catch (err) {
      console.error("[useWallet] Connection Error:", err);
      const message = err instanceof Error ? err.message : "Failed to connect wallet.";
      setError(message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [setWallet]);


  // Auto-reconnect on mount if we have persisted credentials
  useEffect(() => {
    if (walletType && !isConnecting && !walletAddress) {
      connect(walletType).catch(() => {
        // Silently fail if extension is locked/unavailable
      });
    }
  }, [walletType, walletAddress, connect, isConnecting]);

  const disconnect = useCallback(() => {
    clearWallet();
  }, [clearWallet]);

  return useMemo(() => ({
    walletAddress,
    walletType,
    isConnecting,
    error,
    connect,
    disconnect,
    isConnected: Boolean(walletAddress && walletType)
  }), [walletAddress, walletType, isConnecting, error, connect, disconnect]);
}
