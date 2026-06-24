import { DashboardCards } from "@/components/dashboard-cards";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <p className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke">
          Standing context
        </p>
        <h1 className="mt-3 font-serif text-[clamp(2.4rem,6vw,3.6rem)] font-light leading-[1.02] tracking-tight text-bone">
          What the coach <em className="italic text-ember">holds</em>
        </h1>
        <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ash">
          The frame carried into every conversation — what works, what doesn&apos;t, and the one
          question it all turns on.
        </p>
      </header>
      <DashboardCards />
    </div>
  );
}
