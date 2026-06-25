import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/auth-gate";
import { Nav } from "@/components/nav";
import { Ambient } from "@/components/ambient";
import { UiProviders } from "@/components/ui";
import { CommandPalette } from "@/components/command-palette";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
});
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
const mono = Spline_Sans_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "defend-us",
  description: "A private space to think clearly about your relationship — between the moments.",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "defend-us", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#15120e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable} ${mono.variable}`}>
      <body className="font-sans">
        <Ambient />
        <UiProviders>
          <AuthProvider>
            <AuthGate>
              <Nav />
              <CommandPalette />
              <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
            </AuthGate>
          </AuthProvider>
        </UiProviders>
      </body>
    </html>
  );
}
