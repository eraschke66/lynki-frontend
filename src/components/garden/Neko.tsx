import { useEffect, useRef, useState } from "react";

interface NekoProps {
  className?: string;
  size?: number;
  width?: number;
}

/**
 * Strips the uniform light-gray background from the neko images via Canvas API
 * so the cat composites cleanly over any page colour without a pre-processed PNG.
 */
function useBgRemovedCanvas(src: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        // Grey/near-white background: low saturation + bright
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        if (saturation < 0.12 && max > 170) {
          data[i + 3] = 0; // transparent
        }
      }
      ctx.putImageData(imageData, 0, 0);
      setReady(true);
    };
    img.src = src;
  }, [src]);

  return { canvasRef, ready };
}

export function Neko({ className = "", size, width }: NekoProps) {
  const [frame, setFrame] = useState(0);
  const w = width ?? size ?? 180;

  const { canvasRef: canvas1Ref, ready: ready1 } = useBgRemovedCanvas("/neko-1.png");
  const { canvasRef: canvas2Ref, ready: ready2 } = useBgRemovedCanvas("/neko-2.png");

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f === 0 ? 1 : 0));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`neko-container ${className}`}
      style={{ width: w, display: "inline-block", position: "relative" }}
      aria-hidden="true"
    >
      <canvas
        ref={canvas1Ref}
        style={{
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          opacity: frame === 0 && ready1 ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      />
      <canvas
        ref={canvas2Ref}
        style={{
          width: "100%",
          position: "relative",
          opacity: frame === 1 && ready2 ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      />
    </div>
  );
}
