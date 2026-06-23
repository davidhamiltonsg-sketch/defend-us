"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircle, NotebookPen, ShieldHalf } from "lucide-react";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/incidents", label: "Incidents", icon: NotebookPen },
];

export function Nav() {
  const pathname = usePathname();
  const { allowed, signOut } = useAuth();

  if (!allowed) return null;

  return (
    <header className="sticky top-0 z-20 border-b border-paper-edge bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-clay">
          <ShieldHalf className="h-5 w-5" />
          <span className="font-serif text-xl tracking-tight text-ink">defend-us</span>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-clay-wash text-clay"
                    : "text-ink-muted hover:bg-paper-card hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => signOut().catch(() => {})}
            className="ml-2 rounded-lg px-3 py-1.5 text-sm text-ink-muted transition hover:bg-paper-card hover:text-ink"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
