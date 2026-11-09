"use client";

import { Wallet, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { publicEnv } from "@/lib/public-env";

export function ConnectWalletCard() {
  const { walletAddress, connect, disconnect, isConnecting, error, isConnected } = useWallet();

  return (
    <section className="tg-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Account & Network</h2>
        {isConnected ? (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            Authenticated
          </span>
        ) : (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            BOT Chain (677)
          </span>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Authenticated EVM Address</p>
            <p className="text-sm font-medium font-mono text-foreground break-all">
              {walletAddress}
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                BOT Chain Mainnet
              </span>
              <a
                href={`${publicEnv.NEXT_PUBLIC_BOT_EXPLORER_URL}/address/${walletAddress}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary flex items-center gap-1 text-[10px] underline"
              >
                View on BotScan <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={disconnect}
            className="tg-button-ghost w-full border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 h-10"
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground leading-relaxed">
            <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Cryptographic Session Verification</span>
            </div>
            Sign a short challenge message with your EVM wallet to establish session ownership without sharing private keys.
          </div>

          <button
            type="button"
            onClick={() => void connect()}
            disabled={isConnecting}
            className="tg-button w-full h-12 gap-3"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Connecting & Verifying...</span>
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                <span>Connect EVM Wallet</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-muted-foreground">
            Supports MetaMask, Rabby, Coinbase Wallet, Brave, or any EIP-1193 browser wallet.
          </p>
        </div>
      )}

      {error ? (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100">
          <p className="text-xs text-red-600 leading-tight">{error}</p>
        </div>
      ) : null}
    </section>
  );
}
