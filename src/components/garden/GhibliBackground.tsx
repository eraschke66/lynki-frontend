/**
 * The scene behind every page.
 *
 * PERF: this is the cheapest layer to get wrong, because it sits behind every
 * card on every screen. Three things were costing frames:
 *   - the drifting foliage carried a drop-shadow filter, so each animation
 *     frame re-filtered a 1024x1024 image;
 *   - the sunlight orbs animated opacity on 64px-blurred layers, which kept
 *     the whole backdrop dirty and forced the cards above them to recomposite;
 *   - both foliage images were ~1.1 MB PNGs, downloaded on first paint.
 * The drop-shadow is now baked into a static box-shadow-free look, the orbs
 * are static, and the images are WebP (about a tenth of the bytes) with
 * decoding kept off the main thread.
 */
const GhibliBackground = () => (
  <>
    <div
      className="fixed inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/garden-bg-v2.jpg)" }}
    />
    <div className="fixed inset-0 bg-ghibli-cream/15" />
    <div className="fixed inset-0 mist-overlay pointer-events-none" />
    <div className="fixed inset-0 scene-vignette pointer-events-none" />

    {/* Foliage v2 — lush canopy edges */}
    <img
      src="/foliage-left-v2.webp"
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className="fixed -left-8 -bottom-8 w-72 lg:w-96 xl:w-[28rem] pointer-events-none z-0 animate-drift select-none"
    />
    <img
      src="/foliage-right-v2.webp"
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className="fixed -right-10 -top-10 w-64 lg:w-80 xl:w-[26rem] pointer-events-none z-0 animate-drift select-none"
      style={{ animationDelay: "3s" }}
    />

    {/* Dappled golden sunlight orbs — static; they used to pulse, which kept
        every card's compositing layer dirty for a barely visible shimmer. */}
    <div className="fixed top-16 left-1/4 w-72 h-72 rounded-full bg-ghibli-sunlight/20 blur-3xl opacity-50 pointer-events-none" />
    <div className="fixed top-72 right-1/3 w-80 h-80 rounded-full bg-ghibli-gold/15 blur-3xl opacity-50 pointer-events-none" />
    <div className="fixed bottom-32 left-1/3 w-60 h-60 rounded-full bg-ghibli-sunlight/15 blur-3xl opacity-50 pointer-events-none" />
  </>
);

export default GhibliBackground;
