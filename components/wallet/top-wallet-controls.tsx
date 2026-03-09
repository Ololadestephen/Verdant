"use client";

import { useWallet } from "@/hooks/use-wallet";
import { shortAddress } from "@/lib/utils";

export function TopWalletControls() {
  const { walletAddress, walletType, connect, disconnect, isConnecting, isConnected } = useWallet();

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-medium">
          {shortAddress(walletAddress ?? "")} ({walletType})
        </span>
        <button type="button" onClick={disconnect} className="tg-button-ghost px-3 py-1.5 text-xs">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => void connect("argentX")} disabled={isConnecting} className="tg-button px-3 py-1.5 text-xs">
        ArgentX
      </button>
      <button
        type="button"
        onClick={() => void connect("braavos")}
        disabled={isConnecting}
        className="tg-button-ghost px-3 py-1.5 text-xs"
      >
        Braavos
      </button>
    </div>
  );
}
