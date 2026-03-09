const milestones = [7, 30, 100] as const;

export function NftMilestones({ minted }: { minted: number[] }) {
  return (
    <section className="tg-card">
      <h2 className="text-lg font-semibold">NFT Milestones</h2>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {milestones.map((day) => (
          <div
            key={day}
            className={`rounded-xl border p-3 text-center ${minted.includes(day) ? "border-primary bg-gradient-to-br from-accent to-emerald-100" : "border-border bg-white/75"}`}
          >
            <p className="text-xl font-semibold">{day}</p>
            <p className="text-xs text-muted-foreground">Days</p>
          </div>
        ))}
      </div>
    </section>
  );
}
