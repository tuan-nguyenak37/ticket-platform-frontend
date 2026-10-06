export function UpcomingEventsSkeleton() {
  return (
    <div className="flex gap-4 md:gap-5 overflow-hidden pb-3 pt-1" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex-none w-[240px] sm:w-[260px] md:w-[275px] lg:w-[calc((100%-48px)/4)] animate-pulse"
        >
          {/* Landscape banner skeleton */}
          <div className="aspect-[16/10] rounded-xl bg-white/10" />

          {/* Info skeleton */}
          <div className="mt-3 space-y-2 px-0.5">
            <div className="h-4 w-4/5 rounded bg-white/10" />
            <div className="h-3 w-1/3 rounded bg-white/10" />
            <div className="h-3 w-1/2 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
