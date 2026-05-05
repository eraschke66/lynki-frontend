const GhibliBackground = () => (
  <>
    <div
      className="fixed inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/garden-bg-v2.jpg)" }}
    />
    <div className="fixed inset-0 bg-ghibli-cream/35" />
    <div className="fixed inset-0 mist-overlay pointer-events-none" />
    <div className="fixed inset-0 scene-vignette pointer-events-none" />

    {/* Foliage v2 — lush canopy edges */}
    <img
      src="/foliage-left-v2.png"
      alt=""
      aria-hidden
      className="fixed -left-8 -bottom-8 w-72 lg:w-96 xl:w-[28rem] pointer-events-none z-20 animate-drift select-none"
      style={{ filter: "drop-shadow(6px 0 24px hsl(var(--ghibli-canopy) / 0.25))" }}
    />
    <img
      src="/foliage-right-v2.png"
      alt=""
      aria-hidden
      className="fixed -right-10 -top-10 w-64 lg:w-80 xl:w-[26rem] pointer-events-none z-20 animate-drift select-none"
      style={{ animationDelay: "3s", filter: "drop-shadow(-6px 0 24px hsl(var(--ghibli-canopy) / 0.25))" }}
    />

    {/* Dappled golden sunlight orbs */}
    <div className="fixed top-16 left-1/4 w-72 h-72 rounded-full bg-ghibli-sunlight/20 blur-3xl animate-shimmer pointer-events-none" />
    <div
      className="fixed top-72 right-1/3 w-80 h-80 rounded-full bg-ghibli-gold/15 blur-3xl animate-shimmer pointer-events-none"
      style={{ animationDelay: "2s" }}
    />
    <div
      className="fixed bottom-32 left-1/3 w-60 h-60 rounded-full bg-ghibli-sunlight/15 blur-3xl animate-shimmer pointer-events-none"
      style={{ animationDelay: "4s" }}
    />

    {/* Sleeping cat — calm garden companion */}
    <div className="fixed bottom-6 right-8 z-30 pointer-events-none select-none">
      <div className="absolute inset-0 -bottom-2 bg-ghibli-canopy/25 blur-2xl rounded-full scale-90" />
      <img
        src="/sleeping-cat.png"
        alt=""
        className="relative w-28 lg:w-36 animate-pulse-soft drop-shadow-lg"
        style={{ animationDuration: "6s" }}
      />
    </div>
  </>
);

export default GhibliBackground;
