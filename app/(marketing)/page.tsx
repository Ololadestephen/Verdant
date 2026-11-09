import Link from "next/link";
import { ArrowRight, Sparkles, Footprints, ShieldCheck } from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="relative isolate overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-accent opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <main className="space-y-24 py-16">
        <section className="relative">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live on BOT Chain Mainnet (Chain ID 677)
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-[1.1] sm:text-7xl">
              Turn your outdoor habits into <span className="text-primary italic">on-chain badges</span>
            </h1>

            <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Verdant connects daily outdoor habits with on-chain milestone proofs.
              Prove you&apos;ve &quot;touched grass&quot;, advance your consecutive streak, and mint verified
              milestone badges directly on BOT Chain.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/dashboard" className="tg-button group gap-2 h-12 px-8">
                Start Daily Check-In
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/leaderboard" className="tg-button-ghost h-12 px-8">
                View Leaderboard
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="tg-card group hover:translate-y-[-4px]">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Connect & Check In</h3>
            <p className="text-sm text-muted-foreground">
              Sign in with your EVM wallet. No staking or financial promises required—everyday outdoor proof.
            </p>
          </div>

          <div className="tg-card group hover:translate-y-[-4px]">
            <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Proof of Outdoor</h3>
            <p className="text-sm text-muted-foreground">
              Submit fresh, private photos of outdoor vegetation to pass AI verification and earn check-in approvals.
            </p>
          </div>

          <div className="tg-card group hover:translate-y-[-4px]">
            <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Footprints className="h-6 w-6 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">On-Chain Badges</h3>
            <p className="text-sm text-muted-foreground">
              Claim soulbound milestone badges on BOT Chain. First check-in earns the Welcome Badge; streaks unlock 7d, 30d, and 100d tiers.
            </p>
          </div>
        </div>
      </main>

      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-accent to-primary opacity-10 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
      </div>
    </div>
  );
}
