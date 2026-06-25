// Bespoke monogram: a shield whose interior reads as a lamp flame — protection
// plus the single light the whole app is built around.
export function Mark({ className = "h-6 w-6", glow = false }: { className?: string; glow?: boolean }) {
  return (
    <svg viewBox="0 0 32 36" fill="none" className={className} aria-hidden>
      {glow && <ellipse cx="16" cy="14" rx="9" ry="11" fill="#e0a24a" opacity="0.18" />}
      {/* shield */}
      <path
        d="M16 2 L29 7 V18 C29 27 23.5 32 16 35 C8.5 32 3 27 3 18 V7 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* flame */}
      <path
        d="M16 11 C19 14 20 16.5 20 19 C20 22 18.2 24 16 24 C13.8 24 12 22 12 19.4 C12 18.4 12.4 17.6 13 17 C13 18.4 13.7 19 14.4 19.2 C14 17 14.8 14.2 16 11 Z"
        fill="currentColor"
      />
    </svg>
  );
}
