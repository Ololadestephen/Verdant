import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import type { ReactNode } from "react";
import { TopWalletControls } from "@/components/wallet/top-wallet-controls";
import { SessionGuardProvider } from "@/components/session/session-guard-provider";
import { ExternalLink } from "lucide-react";
import { publicEnv } from "@/lib/public-env";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Submissions", href: "/submissions" },
  { name: "Rewards", href: "/rewards" },
  { name: "Achievements", href: "/achievements" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Settings", href: "/settings" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <SessionGuardProvider />

        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/60 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="group flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
                  <Image src="/favicon.svg" alt="Verdant Logo" width={32} height={32} className="h-full w-full object-cover" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold leading-none">Verdant</h1>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">BOT Chain</p>
                </div>
              </Link>

              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href as Route}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <TopWalletControls />
            </div>
          </div>
        </header>

        {/* Mobile Nav */}
        <nav className="lg:hidden border-b border-border bg-white/50 backdrop-blur-sm overflow-x-auto whitespace-nowrap px-4 py-2 scrollbar-none">
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href as Route}
                className="px-3 py-1 text-xs font-medium rounded-md hover:bg-secondary/50"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        <main className="animate-in fade-in slide-in-from-bottom-4 duration-700 py-6">
          {children}
        </main>
      </div>

      <footer className="border-t border-border/40 bg-card/30 backdrop-blur-md py-6 px-4 mt-12">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Verdant</span>
            <span>•</span>
            <span>Outdoor Check-In & Milestone Badges</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              BOT Chain <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href={publicEnv.NEXT_PUBLIC_BOT_EXPLORER_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              BotScan Explorer <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-[11px] font-mono bg-primary/5 px-2 py-0.5 rounded border border-primary/20 text-primary">
              Chain ID: 677
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
