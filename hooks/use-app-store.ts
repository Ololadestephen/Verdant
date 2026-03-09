import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { SupportedWallet } from "@/lib/starknet/wallet";

type CaptureMetadata = {
  file?: File;
  latitude?: number;
  longitude?: number;
  capturedAt?: string;
};

type AppState = {
  walletAddress: string | null;
  walletType: SupportedWallet | null;
  activeSessionId: string | null;
  capture: CaptureMetadata;
  setWallet: (walletAddress: string, walletType: SupportedWallet) => void;
  clearWallet: () => void;
  setActiveSessionId: (id: string | null) => void;
  setCapture: (capture: CaptureMetadata) => void;
  clearCapture: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      walletAddress: null,
      walletType: null,
      activeSessionId: null,
      capture: {},
      setWallet: (walletAddress, walletType) => set({ walletAddress, walletType }),
      clearWallet: () => set({ walletAddress: null, walletType: null, activeSessionId: null, capture: {} }),
      setActiveSessionId: (id) => set({ activeSessionId: id }),
      setCapture: (capture) => set({ capture }),
      clearCapture: () => set({ capture: {} })
    }),
    {
      name: "verdant-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist connection info, not the capture file (which can't be serialized easily)
      partialize: (state) => ({
        walletAddress: state.walletAddress,
        walletType: state.walletType,
        activeSessionId: state.activeSessionId
      })
    }
  )
);
