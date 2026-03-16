"use client";

import { Chrome, Fingerprint, Wallet } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { shortAddress } from "@/lib/utils";

export function TopWalletControls() {
  const { walletAddress, walletType, connect, disconnect, isConnecting, isConnected } = useWallet();

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">
            {walletType}
          </span>
          <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-sm">
            {shortAddress(walletAddress ?? "")}
          </span>
        </div>
        <button 
          type="button" 
          onClick={disconnect} 
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-red-600 transition-colors"
          title="Disconnect"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2">
        <button
          type="button"
          onClick={() => void connect("argentX")}
          disabled={isConnecting}
          className="tg-button-ghost px-3 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-orange-500/10 hover:text-orange-600 transition-colors"
        >
          <Fingerprint className="h-3.5 w-3.5 text-orange-500" />
          Argent X
        </button>
        <button
          type="button"
          onClick={() => void connect("braavos")}
          disabled={isConnecting}
          className="tg-button-ghost px-3 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-blue-500/10 hover:text-blue-600 transition-colors"
        >
          <Wallet className="h-3.5 w-3.5 text-blue-500" />
          Braavos
        </button>
      </div>

      <div className="hidden sm:block h-6 w-px bg-border/50 mx-1" />

      <button 
        type="button" 
        onClick={() => void connect("cartridge")} 
        disabled={isConnecting} 
        className="tg-button bg-stone-950 hover:bg-black text-white px-4 py-2 text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-black/5"
      >
        <Chrome className="h-3.5 w-3.5" />
        Connect with Social
      </button>
    </div>
  );
}

