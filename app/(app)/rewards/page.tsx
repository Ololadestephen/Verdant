"use client";

import { useRewardsSummary } from "@/hooks/use-rewards-summary";

export default function RewardsPage() {
  const { data, isLoading, error } = useRewardsSummary();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="tg-card md:col-span-2">
        <h1 className="text-3xl font-semibold">Rewards</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track lifetime and recent STRK earnings.</p>
      </section>

      {isLoading ? <p className="text-sm">Loading...</p> : null}
      {error ? <p className="text-sm text-red-600">{error.message}</p> : null}

      <section className="tg-card">
        <h2 className="text-lg font-semibold">Lifetime</h2>
        <p className="mt-2 text-4xl font-semibold">{Number(data?.lifetime ?? 0).toFixed(2)} STRK</p>
      </section>
      <section className="tg-card">
        <h2 className="text-lg font-semibold">Last 7 Days</h2>
        <p className="mt-2 text-4xl font-semibold">{Number(data?.last7Days ?? 0).toFixed(2)} STRK</p>
      </section>
      <section className="tg-card">
        <h2 className="text-lg font-semibold">Last 30 Days</h2>
        <p className="mt-2 text-4xl font-semibold">{Number(data?.last30Days ?? 0).toFixed(2)} STRK</p>
      </section>
      <section className="tg-card">
        <h2 className="text-lg font-semibold">Approved Submissions</h2>
        <p className="mt-2 text-4xl font-semibold">{data?.approvedCount ?? 0}</p>
      </section>
    </div>
  );
}
