import Link from "next/link";
import { Sparkles, Footprints, Wallet, Chrome, Mail, Twitter } from "lucide-react";

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

            <h1 className="max-w-4xl text-5xl font-bold leading-[1.1] sm:text-7xl">
              Turn your outdoor habits into <span className="text-primary italic">DeFi rewards</span>
            </h1>

            <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Verdant bridges the gap between physical activity and decentralized finance. Stake STRK,
              prove you&apos;ve &quot;touched grass&quot;, and earn yield on your daily runs.
            </p>

            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/dashboard" className="tg-button bg-stone-950 hover:bg-black text-white group gap-2 h-14 px-10 rounded-2xl shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  Connect via Social
                  <div className="flex -space-x-1 ml-2">
                    <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center p-1 border border-border shadow-sm">
                      <Chrome className="h-3 w-3 text-red-500" />
                    </div>
                    <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center p-1 border border-border shadow-sm">
                      <Mail className="h-3 w-3 text-primary" />
                    </div>
                    <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center p-1 border border-border shadow-sm">
                      <Twitter className="h-3 w-3 text-blue-400" />
                    </div>
                  </div>
                </Link>
                <Link href="/leaderboard" className="tg-button-ghost h-14 px-8 rounded-2xl bg-white/50 backdrop-blur-sm border-border/50">
                  View Leaderboard
                </Link>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Gasless social onboarding powered by Starkzap
              </p>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="tg-card group hover:translate-y-[-4px]">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Stake & Play</h3>
            <p className="text-sm text-muted-foreground">Stake STRK to start your session. Your stake is safe while you stay active.</p>
          </div>

          <div className="tg-card group hover:translate-y-[-4px]">
            <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Proof of Outdoor</h3>
            <p className="text-sm text-muted-foreground">Submit geotagged photos of nature to verify your activity and unlock rewards.</p>
          </div>

          <div className="tg-card group hover:translate-y-[-4px]">
            <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Footprints className="h-6 w-6 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Build Streaks</h3>
            <p className="text-sm text-muted-foreground">Keep your daily run active to multiply your earnings and climb the leaderboard.</p>
          </div>
        </div>
      </main>

      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-accent to-primary opacity-10 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
      </div>
    </div>
  );
}
