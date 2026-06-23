import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/auth-gate";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "defend-us",
  description: "A private relationship coaching space — between the moments.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f6f3ee",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AuthGate>
            <Nav />
            <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
