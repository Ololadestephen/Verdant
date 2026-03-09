import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { TopWalletControls } from "@/components/wallet/top-wallet-controls";

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
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="group flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
                <img src="/favicon.svg" alt="Verdant Logo" className="h-full w-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold leading-none">Verdant</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Starknet DeFi</p>
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

      <main className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {children}
      </main>
    </div>
  );
}
