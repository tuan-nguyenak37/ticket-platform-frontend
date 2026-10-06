export function HomeBannerSkeleton() {
  return <div role="status" aria-label="Đang tải banner sự kiện" className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-r from-violet-950/70 to-fuchsia-950/40 shadow-2xl shadow-violet-500/10 sm:aspect-[21/9]">
    <div aria-hidden="true" className="absolute inset-0 bg-white/5 motion-safe:animate-pulse" /><span className="sr-only">Đang tải sự kiện nổi bật…</span>
  </div>;
}
