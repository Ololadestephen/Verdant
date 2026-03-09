"use client";

import { useMutation } from "@tanstack/react-query";
import { CloudUpload, Loader2, CheckCircle2, AlertCircle, Cpu } from "lucide-react";

import { useAppStore } from "@/hooks/use-app-store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

async function digestSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((value) => value.toString(16).padStart(2, "0")).join("");
}

export function SubmitCapture() {
  const { walletAddress, activeSessionId, capture } = useAppStore();
  const router = useRouter();

  const submission = useMutation({
    mutationFn: async () => {
      if (!walletAddress || !activeSessionId) throw new Error("No active session.");
      if (!capture.file || !capture.capturedAt) {
        throw new Error("Capture proof image first.");
      }

      // Send file + metadata as FormData — upload happens server-side via admin client
      const formData = new FormData();
      formData.append("file", capture.file);
      formData.append("walletAddress", walletAddress);
      formData.append("sessionId", activeSessionId);
      formData.append("capturedAt", capture.capturedAt);
      formData.append("latitude", String(capture.latitude ?? 0));
      formData.append("longitude", String(capture.longitude ?? 0));

      const uploadResponse = await fetch("/api/submission/create", {
        method: "POST",
        body: formData
      });

      if (!uploadResponse.ok) {
        const errBody = await uploadResponse.json().catch(() => ({ error: uploadResponse.statusText }));
        throw new Error(errBody.error ?? "Submission failed.");
      }

      return uploadResponse.json() as Promise<{ submissionId: string; status: string }>;
    },
    onMutate: () => {
      toast.loading("Transmitting proof to AI verifier...");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Proof submitted successfully!");
      // Shift to submissions page so user sees the outcome
      setTimeout(() => router.push("/submissions"), 2000);
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message);
    }
  });

  const isReady = !!capture.file && !!activeSessionId;

  return (
    <section className="tg-card relative overflow-hidden group">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Finalize Verification</h2>
          <p className="text-xs text-muted-foreground mt-1 underline md:no-underline md:text-muted-foreground text-red-500">Securely transmit proof to AI validation engine.</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <CloudUpload className="h-6 w-6 text-primary" />
        </div>
      </div>

      <div className="space-y-4">
        {submission.data ? (
          <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="text-sm font-bold text-green-600">Proof Submitted Successfully</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-green-600/70 font-bold uppercase tracking-widest pl-8">
              <Cpu className="h-3 w-3" />
              <span>AI Validation Status: {submission.data.status}</span>
            </div>
          </div>
        ) : (
          <div className={`p-4 rounded-2xl border transition-colors ${isReady ? 'bg-primary/5 border-primary/20' : 'bg-secondary/20 border-border/50'}`}>
            <p className="text-xs font-medium leading-relaxed">
              {isReady
                ? "Your proof-of-outdoor is ready for submission. Transmitting will consume 0.0012 STRK in gas."
                : "Active session and proof capture required to enable submission."}
            </p>
          </div>
        )}

        <button
          type="button"
          disabled={submission.isPending || !isReady || !!submission.data}
          onClick={() => submission.mutate()}
          className="tg-button w-full h-14"
        >
          {submission.isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Transmitting Proof...</span>
            </div>
          ) : submission.data ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Submission Confirmed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CloudUpload className="h-5 w-5" />
              <span>Begin AI Validation</span>
            </div>
          )}
        </button>

        {submission.error ? (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">
              Error: {submission.error.message}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex items-center justify-center gap-4 py-2 opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
        <div className="h-4 w-4 rounded-full bg-white/10" />
        <div className="h-4 w-4 rounded-full bg-white/10" />
        <div className="h-4 w-4 rounded-full bg-white/10" />
      </div>
    </section>
  );
}
