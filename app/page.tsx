import { DashboardCards } from "@/components/dashboard-cards";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl tracking-tight text-ink">Standing context</h1>
        <p className="mt-1 text-ink-muted">
          The frame the coach holds in every conversation — what works, what doesn&apos;t, and the
          one question it all turns on.
        </p>
      </header>
      <DashboardCards />
    </div>
  );
}
