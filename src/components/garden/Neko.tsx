/**
 * Neko — the PassAI garden cat.
 * A lo-fi line-drawn sleeping cat. Present on the dashboard,
 * breathing gently. Never judges, never celebrates. Just there.
 */

interface NekoProps {
  size?: number;
  className?: string;
}

export function Neko({ size = 80, className = "" }: NekoProps) {
  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 120 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="A sleeping cat"
    >
      {/* Body */}
      <ellipse cx="60" cy="48" rx="38" ry="20" fill="#E8E4E1" stroke="#B0A99F" strokeWidth="1.5" />
      {/* Head */}
      <circle cx="88" cy="38" r="14" fill="#E8E4E1" stroke="#B0A99F" strokeWidth="1.5" />
      {/* Ears */}
      <path d="M80 26 L76 14 L84 22" fill="#E8E4E1" stroke="#B0A99F" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M96 26 L100 14 L92 22" fill="#E8E4E1" stroke="#B0A99F" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M80.5 25 L78 17 L83 22" fill="#F0D9D0" />
      <path d="M95.5 25 L98 17 L93 22" fill="#F0D9D0" />
      {/* Eyes — closed */}
      <path d="M83 37 Q85 39 87 37" stroke="#B0A99F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M91 37 Q93 39 95 37" stroke="#B0A99F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Nose */}
      <ellipse cx="89" cy="41" rx="1.2" ry="0.8" fill="#C4A69D" />
      {/* Mouth */}
      <path d="M89 42 Q87 44 85 43" stroke="#B0A99F" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      {/* Tail */}
      <path d="M24 42 Q16 36 20 28 Q24 22 30 26" stroke="#B0A99F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Whiskers */}
      <line x1="98" y1="38" x2="110" y2="36" stroke="#C8C0B8" strokeWidth="0.7" />
      <line x1="98" y1="40" x2="110" y2="41" stroke="#C8C0B8" strokeWidth="0.7" />
      <line x1="80" y1="38" x2="68" y2="36" stroke="#C8C0B8" strokeWidth="0.7" />
      <line x1="80" y1="40" x2="68" y2="41" stroke="#C8C0B8" strokeWidth="0.7" />
      {/* Breathing */}
      <animateTransform attributeName="transform" type="translate" values="0,0; 0,-0.8; 0,0" dur="4s" repeatCount="indefinite" />
    </svg>
  );
}
