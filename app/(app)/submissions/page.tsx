"use client";

import { useSubmissions } from "@/hooks/use-submissions";

export default function SubmissionsPage() {
  const { data, isLoading, error } = useSubmissions();

  return (
    <section className="tg-card">
      <h1 className="text-3xl font-semibold">Submissions</h1>
      <p className="mt-1 text-sm text-muted-foreground">All verification attempts and outcomes.</p>

      {isLoading ? <p className="mt-4 text-sm">Loading...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error.message}</p> : null}

      <div className="mt-4 space-y-2">
        {(data ?? []).map((item) => (
          <article key={item.id} className="rounded-xl border border-border bg-white/80 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{item.verification_status.toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">{new Date(item.submitted_at).toLocaleString()}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Reward: {Number(item.reward_amount).toFixed(2)} STRK</p>
            {item.rejection_reason ? <p className="mt-1 text-xs text-red-600">{item.rejection_reason}</p> : null}
          </article>
        ))}
        {(data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No submissions yet.</p> : null}
      </div>
    </section>
  );
}
