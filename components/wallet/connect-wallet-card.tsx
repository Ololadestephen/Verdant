"use client";

import { Mail, Twitter, Chrome } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";

export function ConnectWalletCard() {
  const { walletAddress, walletType, connect, disconnect, isConnecting, error, isConnected } = useWallet();

  return (
    <section className="tg-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Account</h2>
        {isConnected && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            Connected
          </span>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Authenticated Address</p>
            <p className="text-sm font-medium font-mono text-foreground break-all">
              {walletAddress}
            </p>
            <p className="mt-2 text-[10px] text-muted-foreground italic flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
              Connected via {walletType}
            </p>
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
        <div className="space-y-6">
          {/* Social Section */}
          <div>
            <p className="text-[10px] items-center gap-2 uppercase tracking-loose font-bold text-muted-foreground mb-3 flex">
              <span className="h-[1px] flex-1 bg-border" />
              Social Onboarding (Gasless)
              <span className="h-[1px] flex-1 bg-border" />
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => void connect("cartridge")}
                disabled={isConnecting}
                className="tg-button bg-stone-950 hover:bg-black text-white gap-3 h-11 border-none relative overflow-hidden group shadow-lg shadow-black/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Chrome className="h-4 w-4" />
                Connect with Google
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void connect("cartridge")}
                  disabled={isConnecting}
                  className="tg-button-ghost hover:bg-muted/50 gap-2 h-10 text-xs"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => void connect("cartridge")}
                  disabled={isConnecting}
                  className="tg-button-ghost hover:bg-muted/50 gap-2 h-10 text-xs"
                >
                  <Twitter className="h-4 w-4 text-blue-400" />
                  X / Twitter
                </button>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-center text-muted-foreground px-4">
              Instant setup. No extension required. Powered by <span className="text-primary font-semibold">Starkzap</span>.
            </p>
          </div>

          {/* Extension Section */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3 text-center">
              Browser Extensions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void connect("argentX")}
                disabled={isConnecting}
                className="tg-button-ghost h-10 text-xs hover:border-orange-200"
              >
                Argent X
              </button>
              <button
                type="button"
                onClick={() => void connect("braavos")}
                disabled={isConnecting}
                className="tg-button-ghost h-10 text-xs hover:border-blue-200"
              >
                Braavos
              </button>
            </div>
          </div>
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
