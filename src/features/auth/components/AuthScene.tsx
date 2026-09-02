import type { ReactNode } from "react";

/** Garden backdrop and wooden notice board frame shared by every auth screen. */
export function AuthScene() {
  return (
    <>
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/garden-login-bg.jpg)" }}
      />
      <div
        className="fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, hsl(45 85% 70% / 0.2) 0%, transparent 60%), linear-gradient(to bottom, hsl(45 60% 50% / 0.08), hsl(33 30% 20% / 0.25))",
        }}
      />
      <div className="fixed inset-0 mist-overlay pointer-events-none" />
      <img
        src="/foliage-left.png"
        alt=""
        aria-hidden
        className="fixed left-0 bottom-0 w-72 lg:w-96 pointer-events-none z-20 animate-drift select-none"
        style={{ filter: "drop-shadow(4px 0 15px hsl(var(--ghibli-canopy) / 0.3))" }}
      />
      <img
        src="/foliage-right.png"
        alt=""
        aria-hidden
        className="fixed right-0 top-0 w-64 lg:w-80 pointer-events-none z-20 animate-drift select-none"
        style={{ animationDelay: "3s", filter: "drop-shadow(-4px 0 15px hsl(var(--ghibli-canopy) / 0.3))" }}
      />
      <div className="fixed top-16 left-1/3 w-48 h-48 rounded-full bg-ghibli-sunlight/15 blur-3xl animate-shimmer pointer-events-none" />
      <div
        className="fixed bottom-32 right-1/4 w-40 h-40 rounded-full bg-ghibli-sunlight/10 blur-3xl animate-shimmer pointer-events-none"
        style={{ animationDelay: "2.5s" }}
      />
    </>
  );
}

export function WoodenFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 w-full max-w-md mx-4 sm:mx-auto">
      <div
        className="rounded-3xl p-[10px]"
        style={{
          background: "linear-gradient(145deg, hsl(30 35% 38%), hsl(25 30% 28%))",
          boxShadow:
            "0 12px 40px -8px hsl(30 30% 15% / 0.5), inset 0 1px 0 hsl(35 40% 50% / 0.3), inset 0 -1px 0 hsl(25 25% 18% / 0.5)",
        }}
      >
        <div
          className="absolute inset-0 rounded-3xl opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 8px, hsl(30 20% 60% / 0.3) 8px, hsl(30 20% 60% / 0.3) 9px)",
          }}
        />
        <div className="relative parchment-solid rounded-[1.1rem] p-8">
          <div className="relative z-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
