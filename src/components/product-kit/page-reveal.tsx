"use client";

import { useEffect, useState, type ReactNode } from "react";

function Reveal({ children, skeleton, delay }: { children: ReactNode; skeleton: ReactNode; delay: number }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  if (!ready) return <>{skeleton}</>;
  return <div className="animate-in fade-in duration-200">{children}</div>;
}

/**
 * Shows a skeleton for a short, fixed delay after mount, then reveals the
 * real content with a quick fade-in. Pass a `revealKey` (e.g. a pathname or
 * product id) — it's used as the React `key`, so navigating between pages
 * remounts this component and re-triggers the effect instead of only firing
 * once ever. This is what makes route changes feel like they're actually
 * loading something, even though the data is static. Kept short (in tension
 * with feeling instant) so it reads as a real app's brief hydration, not a
 * slow product.
 */
export function PageReveal({
  children,
  skeleton,
  revealKey,
  delay = 340,
}: {
  children: ReactNode;
  skeleton: ReactNode;
  revealKey?: string;
  delay?: number;
}) {
  return (
    <Reveal key={revealKey} skeleton={skeleton} delay={delay}>
      {children}
    </Reveal>
  );
}
