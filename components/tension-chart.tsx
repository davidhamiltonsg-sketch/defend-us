"use client";

import type { TensionPoint } from "@/lib/types";

function bucketColor(level: number): string {
  if (level >= 67) return "bg-[#E59A8C]";
  if (level >= 34) return "bg-ember";
  return "bg-moss";
}

export function TensionChart({ points }: { points: TensionPoint[] }) {
  if (points.length === 0) return null;

  return (
    <div>
      <div className="flex items-end gap-2 sm:gap-3" style={{ height: 160 }}>
        {points.map((p, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="font-mono text-[10px] text-smoke">{p.concernLevel}</span>
            <div
              className={`w-full rounded-t-md transition-all ${bucketColor(p.concernLevel)}`}
              style={{ height: `${Math.max(4, p.concernLevel)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3">
        {points.map((p, i) => (
          <div key={i} className="flex-1 text-center">
            <p className="truncate font-mono text-[9px] uppercase tracking-wide text-smoke" title={p.label}>
              {p.label}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-eyebrow text-smoke">
        <span>Start of transcript</span>
        <span>End of transcript</span>
      </div>
    </div>
  );
}
