"use client";

import { useSubmissions } from "@/hooks/use-submissions";
import { ClaimNftButton } from "@/components/gamification/claim-nft-button";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export default function SubmissionsPage() {
  const { data, isLoading, error } = useSubmissions();

  return (
    <section className="tg-card">
      <h1 className="text-3xl font-semibold">Submissions & Check-Ins</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        All outdoor photo proofs, AI verification status, and BOT Chain claim actions.
      </p>

      {isLoading ? <p className="mt-4 text-sm text-muted-foreground">Loading submissions...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error.message}</p> : null}

      <div className="mt-6 space-y-3">
        {(data ?? []).map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-border bg-white/80 p-4 transition-all hover:bg-white"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {item.verification_status === "approved" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : item.verification_status === "rejected" ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500 animate-spin-slow" />
                  )}
                  <p className="text-sm font-bold tracking-tight">
                    {item.verification_status.toUpperCase()}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submitted: {new Date(item.submitted_at).toLocaleString()}
                </p>
                {item.rejection_reason ? (
                  <p className="mt-1 text-xs text-red-600 font-medium">{item.rejection_reason}</p>
                ) : null}
              </div>

              {item.verification_status === "approved" ? (
                <div className="flex items-center gap-3">
                  <ClaimNftButton submissionId={item.id} />
                </div>
              ) : null}
            </div>
          </article>
        ))}
        {(data ?? []).length === 0 && !isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No submissions yet. Initiate a session and capture your first outdoor photo!
          </div>
        ) : null}
      </div>
    </section>
  );
}
