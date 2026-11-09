"use client";

import { useLeaderboard } from "@/hooks/use-leaderboard";
import { shortAddress } from "@/lib/utils";

export default function LeaderboardPage() {
  const { data, isLoading, error } = useLeaderboard();

  return (
    <section className="tg-card">
      <h1 className="text-3xl font-semibold">Leaderboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Realtime ranking by check-in activity points on BOT Chain.</p>

      {isLoading ? <p className="mt-4 text-sm">Loading...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error.message}</p> : null}

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-white/70 p-2">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="py-2 pl-2">Rank</th>
              <th className="py-2">Wallet</th>
              <th className="py-2">Streak</th>
              <th className="py-2 pr-2">Activity Points</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={row.id} className="border-b border-border/60 last:border-0">
                <td className="py-2 pl-2 font-medium">#{row.rank}</td>
                <td className="py-2 font-mono text-xs">{row.username ?? shortAddress(row.wallet_address)}</td>
                <td className="py-2 font-semibold">{row.current_streak} days</td>
                <td className="py-2 pr-2 font-medium">{Math.floor(Number(row.total_earned) * 10)} PTS</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
