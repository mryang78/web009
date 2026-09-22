import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-secondary/70", className)} />;
}

/** Generic page-shaped skeleton: header block + stat tiles + a couple of content blocks. */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-7 w-56" />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      <Skeleton className="mt-5 h-64 rounded-xl" />
      <Skeleton className="mt-4 h-40 rounded-xl" />
    </div>
  );
}

/** Compact admin-page-shaped skeleton: breadcrumb + title + a table block. */
export function AdminPageSkeleton() {
  return (
    <div>
      <Skeleton className="h-3.5 w-32" />
      <Skeleton className="mt-3 h-6 w-44" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>

      <Skeleton className="mt-4 h-96 rounded-xl" />
    </div>
  );
}
