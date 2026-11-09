const milestones = [
  { day: 1, label: "Welcome" },
  { day: 7, label: "7 Days" },
  { day: 30, label: "30 Days" },
  { day: 100, label: "100 Days" }
] as const;

export function NftMilestones({ minted }: { minted: number[] }) {
  return (
    <section className="tg-card">
      <h2 className="text-lg font-semibold">BOT Chain Milestone Badges</h2>
      <p className="text-xs text-muted-foreground mt-1">
        Soulbound, non-transferable milestone proof badges awarded on-chain.
      </p>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {milestones.map((item) => {
          const isMinted = minted.includes(item.day);
          return (
            <div
              key={item.day}
              className={`rounded-xl border p-3 text-center transition-all ${
                isMinted
                  ? "border-primary bg-gradient-to-br from-accent to-emerald-100 shadow-sm"
                  : "border-border bg-white/75 opacity-70"
              }`}
            >
              <p className="text-2xl font-bold">{item.day === 1 ? "🌿" : item.day}</p>
              <p className="text-sm font-semibold mt-1">{item.label}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                {isMinted ? "Claimed" : "Locked"}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
