"use client";

import { useRewardsSummary } from "@/hooks/use-rewards-summary";

export default function RewardsPage() {
  const { data, isLoading, error } = useRewardsSummary();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="tg-card md:col-span-2">
        <h1 className="text-3xl font-semibold">Activity Points</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track non-financial lifetime and recent check-in activity points on BOT Chain.
        </p>
      </section>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading points summary...</p> : null}
      {error ? <p className="text-sm text-red-600">{error.message}</p> : null}

      <section className="tg-card">
        <h2 className="text-lg font-semibold">Lifetime Points</h2>
        <p className="mt-2 text-4xl font-semibold">{Math.floor(Number(data?.lifetime ?? 0) * 10)} PTS</p>
      </section>
      <section className="tg-card">
        <h2 className="text-lg font-semibold">Last 7 Days</h2>
        <p className="mt-2 text-4xl font-semibold">{Math.floor(Number(data?.last7Days ?? 0) * 10)} PTS</p>
      </section>
      <section className="tg-card">
        <h2 className="text-lg font-semibold">Last 30 Days</h2>
        <p className="mt-2 text-4xl font-semibold">{Math.floor(Number(data?.last30Days ?? 0) * 10)} PTS</p>
      </section>
      <section className="tg-card">
        <h2 className="text-lg font-semibold">Approved Submissions</h2>
        <p className="mt-2 text-4xl font-semibold">{data?.approvedCount ?? 0}</p>
      </section>
    </div>
  );
}
