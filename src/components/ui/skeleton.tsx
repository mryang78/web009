import { cn } from "@/lib/utils";

// Metallic shimmer sweep instead of a flat opacity pulse — the `.shimmer`
// utility (styles.css) draws a soft light band that sweeps across the
// translucent base, which reads as "loading" rather than a blinking block.
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shimmer rounded-md", className)} {...props} />;
}

export { Skeleton };
