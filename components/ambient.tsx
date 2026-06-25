"use client";

import { useEffect, useState } from "react";

// The lamp. A warm radial glow from above that (a) fades up once on load — the
// lamp turning on — and (b) shifts warmer and dimmer late at night, since this
// is an app opened between the moments.
export function Ambient() {
  const [lit, setLit] = useState(false);
  const [tone, setTone] = useState({ strength: 0.1, warm: "224, 162, 74" });

  useEffect(() => {
    const apply = () => {
      const h = new Date().getHours();
      const lateNight = h >= 22 || h < 6;
      const evening = h >= 18 && h < 22;
      if (lateNight) setTone({ strength: 0.07, warm: "210, 138, 70" }); // dimmer, redder
      else if (evening) setTone({ strength: 0.1, warm: "224, 162, 74" });
      else setTone({ strength: 0.12, warm: "232, 178, 96" }); // brighter, cooler-gold by day
    };
    apply();
    const id = setInterval(apply, 10 * 60 * 1000);
    const t = setTimeout(() => setLit(true), 60); // trigger the fade-up
    return () => {
      clearInterval(id);
      clearTimeout(t);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-[1600ms] ease-out"
      style={{
        opacity: lit ? 1 : 0,
        backgroundImage: `radial-gradient(120% 78% at 50% -14%, rgba(${tone.warm}, ${tone.strength}), transparent 58%), radial-gradient(90% 55% at 50% 120%, rgba(148, 160, 198, 0.06), transparent 60%)`,
      }}
    />
  );
}
