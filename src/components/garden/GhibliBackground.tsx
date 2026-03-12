const GhibliBackground = () => (
  <>
    <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url(/ghibli-bg.jpg)" }} />
    <div className="fixed inset-0 bg-background/40" />
    <div className="fixed inset-0 mist-overlay pointer-events-none" />
    <img src="/foliage-left.png" alt="" className="fixed left-0 bottom-0 w-64 lg:w-80 xl:w-96 pointer-events-none z-20 animate-drift select-none" style={{ filter: "drop-shadow(4px 0 15px hsl(var(--ghibli-canopy) / 0.2))" }} />
    <img src="/foliage-right.png" alt="" className="fixed right-0 top-0 w-56 lg:w-72 xl:w-80 pointer-events-none z-20 animate-drift select-none" style={{ animationDelay: "3s", filter: "drop-shadow(-4px 0 15px hsl(var(--ghibli-canopy) / 0.2))" }} />
    <div className="fixed top-20 left-1/4 w-40 h-40 rounded-full bg-ghibli-sunlight/10 blur-3xl animate-shimmer pointer-events-none" />
    <div className="fixed bottom-40 right-1/4 w-56 h-56 rounded-full bg-ghibli-sunlight/10 blur-3xl animate-shimmer pointer-events-none" style={{ animationDelay: "2s" }} />
    <img src="/sleeping-cat.png" alt="" className="fixed bottom-4 right-6 w-28 lg:w-36 pointer-events-none z-30 select-none animate-pulse-soft" style={{ animationDuration: "5s" }} />
  </>
);
export default GhibliBackground;
