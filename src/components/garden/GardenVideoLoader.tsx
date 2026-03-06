import { useEffect, useRef } from "react";

interface GardenVideoLoaderProps {
  message?: string;
}

/**
 * Full-screen loading overlay using the Sora garden video as background.
 * Used for long Render cold-start waits (can be 1-4 min on first load).
 * Usage: render this component when isLoading=true and backend hasn't responded yet.
 */
export function GardenVideoLoader({ message = "Tending the garden..." }: GardenVideoLoaderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked — video stays on first frame, still looks fine
      });
    }
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background video */}
      <video
        ref={videoRef}
        src="/garden-loader.mp4"
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Dark wash overlay so text is readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(27,67,50,0.35) 0%, rgba(27,67,50,0.55) 100%)",
        }}
      />

      {/* Loader content */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
          padding: "2.5rem 3rem",
          background: "rgba(250, 243, 224, 0.12)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: "1.25rem",
          border: "1px solid rgba(250, 243, 224, 0.25)",
          boxShadow: "0 8px 40px rgba(27,67,50,0.3)",
        }}
      >
        {/* Spinning leaf */}
        <div
          style={{
            fontSize: "2.5rem",
            animation: "gardenSpin 2s linear infinite",
          }}
        >
          🌿
        </div>

        {/* Message */}
        <p
          style={{
            margin: 0,
            fontSize: "1rem",
            fontWeight: 500,
            color: "rgba(250, 243, 224, 0.92)",
            letterSpacing: "0.03em",
            textShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }}
        >
          {message}
        </p>

        {/* Dot pulse */}
        <div style={{ display: "flex", gap: "6px" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "rgba(116, 198, 157, 0.85)",
                animation: `gardenPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes gardenSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes gardenPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
