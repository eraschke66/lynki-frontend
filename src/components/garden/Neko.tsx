import { useEffect, useState } from "react";

interface NekoProps {
  className?: string;
  width?: number;
}

export function Neko({ className = "", width = 180 }: NekoProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f === 0 ? 1 : 0));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`neko-container ${className}`}
      style={{ width, display: "inline-block", position: "relative" }}
      aria-hidden="true"
    >
      <img
        src="/neko-1.png"
        alt=""
        style={{
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          opacity: frame === 0 ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      />
      <img
        src="/neko-2.png"
        alt=""
        style={{
          width: "100%",
          position: "relative",
          opacity: frame === 1 ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      />
    </div>
  );
}
