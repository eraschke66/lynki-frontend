/**
 * Suspense fallback for lazily-loaded routes.
 *
 * Deliberately dependency-free — no framer-motion, no radix, no icon library —
 * so it stays in the entry chunk and can paint before any route chunk has
 * finished downloading. A route in flight must never show a blank screen.
 *
 * Visual language matches TendingLoading: sprout, soft glow, shimmer bar.
 */
export function RouteLoader({ label = "Finding your way to the garden…" }: { label?: string }) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] bg-ghibli-sunlight/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
        <div className="absolute inset-0 bg-ghibli-sunlight/20 blur-2xl rounded-full animate-pulse-soft" />
        <img
          src="/leaf-sprout.png"
          alt=""
          aria-hidden="true"
          className="w-16 relative z-10 animate-pulse-soft"
        />
      </div>

      <p className="relative z-10 font-serif text-ghibli-canopy text-lg md:text-xl text-center mb-6">
        {label}
      </p>

      <div className="relative z-10 w-48 h-1.5 rounded-full bg-ghibli-moss/10 overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-ghibli-moss to-ghibli-sage rounded-full animate-shimmer"
          style={{ width: "40%" }}
        />
      </div>
    </div>
  );
}
