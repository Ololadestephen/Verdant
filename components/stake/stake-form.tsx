"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ShieldCheck, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAppStore } from "@/hooks/use-app-store";
import { useProfileSummary } from "@/hooks/use-profile-summary";
import { submitStake } from "@/lib/starknet/wallet";

const formSchema = z.object({ amount: z.coerce.number().positive().max(1_000_000) });

type FormInput = z.infer<typeof formSchema>;

export function StakeForm() {
  const { walletAddress, walletType, activeSessionId, setActiveSessionId } = useAppStore();
  const { data } = useProfileSummary();
  const queryClient = useQueryClient();

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: 10 }
  });

  const startSession = useMutation({
    mutationFn: async (values: FormInput) => {
      if (!walletAddress || !walletType) {
        throw new Error("Connect wallet first.");
      }

      const TIMEOUT_MS = 90_000;

      const mutationWork = async () => {
        toast.info("Signing transaction... approve in your wallet.");
        const txHash = await submitStake(values.amount, walletType);

        toast.info("Transaction submitted! Recording session...");

        const response = await fetch("/api/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            stakeAmount: values.amount,
            stakeTxHash: txHash
          })
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        return response.json() as Promise<{ sessionId: string }>;
      };

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Staking timed out. Please check your wallet and try again.")), TIMEOUT_MS)
      );

      return Promise.race([mutationWork(), timeout]);
    },
    onSuccess: (responseData) => {
      setActiveSessionId(responseData.sessionId);
      queryClient.invalidateQueries({ queryKey: ["profile-summary", walletAddress] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-overview", walletAddress] });
      toast.success("Stake successful! Session started. 🌿");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const quickStakes = [10, 50, 100];
  const isServerStaked = Boolean(data?.activeSession?.id);
  const isStaked = isServerStaked || !!activeSessionId;

  return (
    <section className="tg-card relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Initiate Session</h2>
          <p className="text-xs text-muted-foreground mt-1">Stake STRK to start earning rewards.</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
      </div>

      <form
        className="space-y-6"
        onSubmit={form.handleSubmit((values) => startSession.mutate(values))}
      >
        <div className="space-y-4">
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">
            Stake Amount (STRK)
          </label>
          <div className="relative group">
            <input
              type="number"
              step="0.01"
              min="0"
              disabled={isStaked}
              className="w-full rounded-2xl border border-border bg-white/5 px-4 py-4 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 shadow-inner group-hover:bg-white/10 disabled:opacity-50"
              placeholder="0.00"
              {...form.register("amount")}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-sm font-bold text-primary">STRK</span>
            </div>
          </div>

          <div className="flex gap-2">
            {quickStakes.map((amt) => (
              <button
                key={amt}
                type="button"
                disabled={isStaked}
                onClick={() => form.setValue("amount", amt)}
                className="flex-1 py-2 rounded-lg border border-border bg-white/5 text-xs font-bold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all active:scale-95 disabled:hover:bg-white/5 disabled:hover:text-muted-foreground disabled:hover:border-border disabled:opacity-50"
              >
                {amt}
              </button>
            ))}
          </div>

          {form.formState.errors.amount ? (
            <p className="text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1 ml-1">
              {form.formState.errors.amount.message}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={startSession.isPending || isStaked}
          className="tg-button w-full h-14 group"
        >
          {startSession.isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Securing Stake...</span>
            </div>
          ) : isStaked ? (
            <div className="flex items-center gap-2">
              <span>Stake Active</span>
              <ShieldCheck className="h-5 w-5" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Stake & Launch Session</span>
              <ArrowUpRight className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          )}
        </button>

        {startSession.error ? (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-medium text-red-500 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {startSession.error.message}
          </div>
        ) : null}
      </form>

      <p className="mt-6 text-[10px] text-center text-muted-foreground leading-relaxed">
        Your STRK is staked directly on Starknet. <br />
        Rewards are calculated based on session duration and activity.
      </p>
    </section>
  );
}
