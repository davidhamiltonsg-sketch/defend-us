"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command, LayoutDashboard, MessageCircle, NotebookPen, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Mark } from "./mark";

const LINKS = [
  { href: "/", label: "Context", icon: LayoutDashboard },
  { href: "/chat", label: "Talk", icon: MessageCircle },
  { href: "/incidents", label: "Log", icon: NotebookPen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();
  const { allowed, signOut } = useAuth();

  if (!allowed) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-night-hair/70 bg-night/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3.5">
        <Link href="/" className="group flex items-center gap-2 text-ember">
          <Mark className="h-6 w-6 transition group-hover:text-ember-soft" />
          <span className="font-display text-xl tracking-tight text-bone">defend-us</span>
        </Link>

        <nav className="flex items-center gap-1">
          <button
            onClick={() => window.dispatchEvent(new Event("du:open-command"))}
            className="mr-1 hidden items-center gap-1.5 rounded-lg border border-night-hair px-2.5 py-1.5 text-smoke transition hover:border-ember/40 hover:text-ash sm:flex"
            aria-label="Open command palette"
          >
            <Command className="h-3.5 w-3.5" />
            <span className="font-mono text-[10px] uppercase tracking-eyebrow">K</span>
          </button>
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active ? "text-ember" : "text-ash hover:text-bone"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} />
                <span className="hidden sm:inline">{label}</span>
                {active && (
                  <span className="absolute inset-x-2 -bottom-[15px] h-px bg-ember shadow-[0_0_8px_rgba(224,162,74,0.7)]" />
                )}
              </Link>
            );
          })}
          <button
            onClick={() => signOut().catch(() => {})}
            className="ml-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-smoke transition hover:text-ash"
          >
            Leave
          </button>
        </nav>
      </div>
    </header>
  );
}
