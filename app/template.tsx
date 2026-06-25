// Remounts on every navigation, giving each route a quiet fade-in.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-rise">{children}</div>;
}
