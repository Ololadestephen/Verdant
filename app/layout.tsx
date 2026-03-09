import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Space_Grotesk } from "next/font/google";

import "@/styles/globals.css";
import { Providers } from "@/components/providers";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Verdant",
  description: "Starknet DeFi game that rewards outdoor activity.",
  icons: {
    icon: "/favicon.svg",
  },
};

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display"
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${fraunces.variable}`}>
        <Providers>
          <RegisterServiceWorker />
          {children}
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
