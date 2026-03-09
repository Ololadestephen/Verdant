"use client";

import { useWallet } from "@/hooks/use-wallet";
import { shortAddress } from "@/lib/utils";

export function ConnectWalletCard() {
  const { walletAddress, walletType, connect, disconnect, isConnecting, error, isConnected } = useWallet();

  return (
    <section className="tg-card">
      <h2 className="text-lg font-semibold">Wallet</h2>
      {isConnected ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted-foreground">
            Connected: <span className="font-medium text-foreground">{shortAddress(walletAddress ?? "")}</span> ({walletType})
          </p>
          <button
            type="button"
            onClick={disconnect}
            className="tg-button-ghost"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void connect("argentX")}
            disabled={isConnecting}
            className="tg-button"
          >
            Connect Argent X
          </button>
          <button
            type="button"
            onClick={() => void connect("braavos")}
            disabled={isConnecting}
            className="tg-button-ghost disabled:opacity-60"
          >
            Connect Braavos
          </button>
        </div>
      )}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
