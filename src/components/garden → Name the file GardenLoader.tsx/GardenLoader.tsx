/**
 * GardenLoader — an animated growing plant that replaces the spinner
 * across all loading states in PassAI.
 *
 * Usage:
 *   import { GardenLoader } from "@/components/garden/GardenLoader";
 *   <GardenLoader message="Tending the garden..." />
 */

interface GardenLoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function GardenLoader({ message, size = "md" }: GardenLoaderProps) {
  const scale = size === "sm" ? 0.6 : size === "lg" ? 1.3 : 1;
  const svgSize = Math.round(64 * scale);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <style>{`
          @keyframes growStem {
            0%   { stroke-dashoffset: 40; opacity: 0.3; }
            60%  { stroke-dashoffset: 0;  opacity: 1; }
            100% { stroke-dashoffset: 0;  opacity: 1; }
          }
          @keyframes growLeafL {
            0%   { transform: scale(0) rotate(-15deg); transform-origin: 28px 38px; opacity: 0; }
            40%  { transform: scale(0) rotate(-15deg); transform-origin: 28px 38px; opacity: 0; }
            75%  { transform: scale(1.1) rotate(-15deg); transform-origin: 28px 38px; opacity: 1; }
            100% { transform: scale(1) rotate(-15deg); transform-origin: 28px 38px; opacity: 1; }
          }
          @keyframes growLeafR {
            0%   { transform: scale(0) rotate(20deg); transform-origin: 36px 30px; opacity: 0; }
            55%  { transform: scale(0) rotate(20deg); transform-origin: 36px 30px; opacity: 0; }
            85%  { transform: scale(1.1) rotate(20deg); transform-origin: 36px 30px; opacity: 1; }
            100% { transform: scale(1) rotate(20deg); transform-origin: 36px 30px; opacity: 1; }
          }
          @keyframes growTopLeaf {
            0%   { transform: scale(0); transform-origin: 32px 18px; opacity: 0; }
            70%  { transform: scale(0); transform-origin: 32px 18px; opacity: 0; }
            95%  { transform: scale(1.1); transform-origin: 32px 18px; opacity: 1; }
            100% { transform: scale(1); transform-origin: 32px 18px; opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50%       { opacity: 1; }
          }
          .stem      { animation: growStem   1.6s cubic-bezier(0.4,0,0.2,1) infinite; stroke-dasharray: 40; }
          .leaf-l    { animation: growLeafL  1.6s cubic-bezier(0.4,0,0.2,1) infinite; }
          .leaf-r    { animation: growLeafR  1.6s cubic-bezier(0.4,0,0.2,1) infinite; }
          .leaf-top  { animation: growTopLeaf 1.6s cubic-bezier(0.4,0,0.2,1) infinite; }
          .soil      { animation: pulse      1.6s ease-in-out infinite; }
        `}</style>

        {/* Soil */}
        <ellipse
          className="soil"
          cx="32"
          cy="56"
          rx="14"
          ry="4"
          fill="#40916C"
          opacity="0.18"
        />

        {/* Stem */}
        <path
          className="stem"
          d="M32 54 C32 44 30 36 32 20"
          stroke="#40916C"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Left leaf */}
        <ellipse
          className="leaf-l"
          cx="22"
          cy="38"
          rx="10"
          ry="5"
          fill="#52B788"
          opacity="0.85"
        />

        {/* Right leaf */}
        <ellipse
          className="leaf-r"
          cx="42"
          cy="30"
          rx="9"
          ry="4.5"
          fill="#40916C"
          opacity="0.85"
        />

        {/* Top leaf */}
        <ellipse
          className="leaf-top"
          cx="32"
          cy="18"
          rx="7"
          ry="10"
          fill="#74C69D"
          opacity="0.9"
        />
      </svg>

      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}
