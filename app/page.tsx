import { DashboardCards } from "@/components/dashboard-cards";

export default function DashboardPage() {
  return (
    <div className="space-y-7 animate-rise">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke">
          Standing context
        </p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight text-bone">
          What the coach holds
        </h1>
        <p className="mt-2 max-w-2xl text-ash">
          The frame carried into every conversation — what works, what doesn&apos;t, and the one
          question it all turns on.
        </p>
      </header>
      <DashboardCards />
    </div>
  );
}
