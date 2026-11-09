import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type CaptureMetadata = {
  file?: File;
  latitude?: number;
  longitude?: number;
  capturedAt?: string;
};

type AppState = {
  walletAddress: string | null;
  walletType: string | null;
  authToken: string | null;
  activeSessionId: string | null;
  capture: CaptureMetadata;
  setWallet: (walletAddress: string, walletType: string, authToken?: string) => void;
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
      authToken: null,
      activeSessionId: null,
      capture: {},
      setWallet: (walletAddress, walletType, authToken) =>
        set({ walletAddress, walletType, authToken: authToken ?? null }),
      clearWallet: () =>
        set({ walletAddress: null, walletType: null, authToken: null, activeSessionId: null, capture: {} }),
      setActiveSessionId: (id) => set({ activeSessionId: id }),
      setCapture: (capture) => set({ capture }),
      clearCapture: () => set({ capture: {} })
    }),
    {
      name: "verdant-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        walletAddress: state.walletAddress,
        walletType: state.walletType,
        authToken: state.authToken,
        activeSessionId: state.activeSessionId
      })
    }
  )
);
