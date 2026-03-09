/**
 * Lush vine decoration — Studio Ghibli overgrown garden wall.
 *
 * Multiple intertwining vines with varying thickness,
 * leaves of different sizes, curling tendrils, small buds,
 * and gentle opacity to stay atmospheric without distracting.
 */
export function VineDecoration() {
  return (
    <div
      className="fixed left-0 top-0 h-screen pointer-events-none hidden lg:block"
      style={{ zIndex: 0, width: 80 }}
      aria-hidden="true"
    >
      <svg
        width="80"
        height="100%"
        viewBox="0 0 80 1000"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Primary vine — thick, slow S-curve ── */}
        <path
          d="M30,0 C36,50 20,100 26,160 C32,220 40,260 34,330
             C28,400 20,440 26,510 C32,580 40,630 34,700
             C28,770 20,820 26,890 C32,940 28,970 30,1000"
          stroke="#2D6A4F"
          strokeWidth="2.5"
          opacity="0.22"
          strokeLinecap="round"
        />

        {/* ── Secondary vine — thinner, offset rhythm ── */}
        <path
          d="M22,0 C18,70 30,110 24,180 C18,250 12,300 20,370
             C28,440 34,490 26,560 C18,630 12,680 20,750
             C28,820 34,870 26,940 C22,970 24,990 22,1000"
          stroke="#40916C"
          strokeWidth="1.8"
          opacity="0.18"
          strokeLinecap="round"
        />

        {/* ── Tertiary vine — delicate, wanders wider ── */}
        <path
          d="M38,0 C44,40 48,90 42,150 C36,210 30,250 38,310
             C46,370 52,420 44,480 C36,540 30,590 38,650
             C46,710 50,760 42,820 C36,880 32,930 38,1000"
          stroke="#52B788"
          strokeWidth="1.2"
          opacity="0.15"
          strokeLinecap="round"
        />

        {/* ── Wispy fourth vine — barely there, adds depth ── */}
        <path
          d="M16,40 C10,100 18,140 14,200 C10,260 6,310 14,370
             C22,430 16,480 10,540 C4,600 8,660 14,720
             C20,780 16,830 10,890 C6,940 10,970 14,1000"
          stroke="#74C69D"
          strokeWidth="0.8"
          opacity="0.12"
          strokeLinecap="round"
        />

        {/* ════════════════════════════════════════════
            LEAVES — grouped by vertical zone
            Mixed sizes: small (rx 6-8), medium (9-12), large (13-16)
            ════════════════════════════════════════════ */}

        {/* ── Zone 1: y 40–180 ── */}
        {/* Large leaf — right, drooping */}
        <path
          d="M30,65 Q48,52 56,60 Q50,70 30,65Z"
          fill="#52B788" opacity="0.20"
        />
        <path
          d="M30,65 Q42,60 56,60" stroke="#2D6A4F" strokeWidth="0.6" opacity="0.15"
        />
        {/* Small leaf — left */}
        <ellipse cx="14" cy="90" rx="7" ry="4" fill="#74C69D" opacity="0.18" transform="rotate(25 14 90)" />
        <line x1="22" y1="92" x2="14" y2="90" stroke="#2D6A4F" strokeWidth="0.6" opacity="0.15" />
        {/* Medium leaf — right, angled up */}
        <ellipse cx="48" cy="130" rx="11" ry="5.5" fill="#40916C" opacity="0.18" transform="rotate(-35 48 130)" />
        <line x1="30" y1="136" x2="46" y2="130" stroke="#2D6A4F" strokeWidth="0.7" opacity="0.16" />
        {/* Small leaf — left, overlapping */}
        <ellipse cx="10" cy="145" rx="8" ry="3.5" fill="#B7E4C7" opacity="0.16" transform="rotate(20 10 145)" />
        {/* Tendril curl */}
        <path
          d="M26,160 C33,154 37,146 32,140 C27,134 22,138 25,144"
          stroke="#40916C" strokeWidth="0.9" opacity="0.14" strokeLinecap="round" fill="none"
        />
        {/* Large leaf — left, lush */}
        <path
          d="M24,175 Q6,162 2,172 Q8,182 24,175Z"
          fill="#52B788" opacity="0.22"
        />
        <path
          d="M24,175 Q14,168 2,172" stroke="#2D6A4F" strokeWidth="0.6" opacity="0.16"
        />

        {/* ── Zone 2: y 180–340 ── */}
        {/* Medium leaf — right */}
        <ellipse cx="52" cy="210" rx="10" ry="5" fill="#74C69D" opacity="0.17" transform="rotate(-28 52 210)" />
        <line x1="34" y1="215" x2="50" y2="210" stroke="#2D6A4F" strokeWidth="0.7" opacity="0.15" />
        {/* Small leaf pair — left */}
        <ellipse cx="8" cy="235" rx="7" ry="3.5" fill="#52B788" opacity="0.19" transform="rotate(32 8 235)" />
        <ellipse cx="14" cy="245" rx="6" ry="3" fill="#95D5B2" opacity="0.15" transform="rotate(18 14 245)" />
        {/* Bud */}
        <circle cx="26" cy="270" r="3" fill="#B7E4C7" opacity="0.25" />
        <circle cx="26" cy="270" r="1.4" fill="#74C69D" opacity="0.35" />
        {/* Large leaf — right, broad */}
        <path
          d="M34,290 Q56,278 60,290 Q52,300 34,290Z"
          fill="#40916C" opacity="0.18"
        />
        <path
          d="M34,290 Q48,282 60,290" stroke="#2D6A4F" strokeWidth="0.6" opacity="0.14"
        />
        {/* Small leaf — left */}
        <ellipse cx="6" cy="310" rx="8" ry="4" fill="#74C69D" opacity="0.16" transform="rotate(38 6 310)" />
        <line x1="20" y1="314" x2="8" y2="310" stroke="#2D6A4F" strokeWidth="0.6" opacity="0.14" />
        {/* Tendril */}
        <path
          d="M20,335 C13,330 10,322 15,316 C20,310 26,314 23,320"
          stroke="#52B788" strokeWidth="0.8" opacity="0.13" strokeLinecap="round" fill="none"
        />

        {/* ── Zone 3: y 340–510 ── */}
        {/* Medium leaf — right */}
        <ellipse cx="50" cy="365" rx="11" ry="5" fill="#52B788" opacity="0.17" transform="rotate(-32 50 365)" />
        <line x1="34" y1="370" x2="48" y2="365" stroke="#2D6A4F" strokeWidth="0.7" opacity="0.15" />
        {/* Large leaf — left, reaching */}
        <path
          d="M26,395 Q4,380 0,392 Q8,404 26,395Z"
          fill="#40916C" opacity="0.20"
        />
        <path
          d="M26,395 Q12,386 0,392" stroke="#2D6A4F" strokeWidth="0.6" opacity="0.16"
        />
        {/* Small overlapping leaves */}
        <ellipse cx="46" cy="420" rx="7" ry="3.5" fill="#B7E4C7" opacity="0.16" transform="rotate(-22 46 420)" />
        <ellipse cx="42" cy="428" rx="8" ry="4" fill="#74C69D" opacity="0.14" transform="rotate(-38 42 428)" />
        {/* Bud with tiny petals */}
        <circle cx="22" cy="455" r="4" fill="#B7E4C7" opacity="0.22" />
        <circle cx="22" cy="455" r="2" fill="#95D5B2" opacity="0.30" />
        <circle cx="20" cy="453" r="1" fill="#F4A8B5" opacity="0.20" />
        {/* Medium leaf — left */}
        <ellipse cx="4" cy="480" rx="10" ry="5" fill="#52B788" opacity="0.18" transform="rotate(30 4 480)" />
        <line x1="20" y1="484" x2="6" y2="480" stroke="#2D6A4F" strokeWidth="0.6" opacity="0.14" />
        {/* Small leaf — right */}
        <ellipse cx="54" cy="505" rx="7" ry="3.5" fill="#40916C" opacity="0.15" transform="rotate(-25 54 505)" />

        {/* ── Zone 4: y 510–680 ── */}
        {/* Tendril — longer, lazier */}
        <path
          d="M26,520 C35,514 40,504 35,496 C30,488 23,492 27,500 C31,508 28,516 26,520"
          stroke="#40916C" strokeWidth="0.9" opacity="0.13" strokeLinecap="round" fill="none"
        />
        {/* Large leaf — right */}
        <path
          d="M38,545 Q58,530 64,542 Q56,554 38,545Z"
          fill="#74C69D" opacity="0.18"
        />
        <path
          d="M38,545 Q50,536 64,542" stroke="#2D6A4F" strokeWidth="0.6" opacity="0.14"
        />
        {/* Small leaf — left */}
        <ellipse cx="8" cy="565" rx="7" ry="3.5" fill="#52B788" opacity="0.17" transform="rotate(28 8 565)" />
        <line x1="22" y1="568" x2="10" y2="565" stroke="#2D6A4F" strokeWidth="0.6" opacity="0.14" />
        {/* Medium leaf pair — both sides */}
        <ellipse cx="50" cy="600" rx="10" ry="5" fill="#40916C" opacity="0.16" transform="rotate(-30 50 600)" />
        <ellipse cx="6" cy="615" rx="9" ry="4.5" fill="#74C69D" opacity="0.17" transform="rotate(34 6 615)" />
        <line x1="26" y1="605" x2="48" y2="600" stroke="#2D6A4F" strokeWidth="0.6" opacity="0.13" />
        <line x1="20" y1="618" x2="8" y2="615" stroke="#2D6A4F" strokeWidth="0.6" opacity="0.13" />
        {/* Small leaf — right */}
        <ellipse cx="46" cy="650" rx="7" ry="3" fill="#B7E4C7" opacity="0.15" transform="rotate(-20 46 650)" />
        {/* Bud */}
        <circle cx="30" cy="670" r="3.5" fill="#B7E4C7" opacity="0.22" />
        <circle cx="30" cy="670" r="1.6" fill="#52B788" opacity="0.30" />

        {/* ── Zone 5: y 680–850 ── */}
        {/* Large leaf — left, big and lush */}
        <path
          d="M24,700 Q2,685 -2,698 Q6,712 24,700Z"
          fill="#52B788" opacity="0.20"
        />
        <path
          d="M24,700 Q12,690 -2,698" stroke="#2D6A4F" strokeWidth="0.6" opacity="0.15"
        />
        {/* Medium leaf — right */}
        <ellipse cx="54" cy="730" rx="11" ry="5.5" fill="#40916C" opacity="0.16" transform="rotate(-36 54 730)" />
        <line x1="34" y1="735" x2="52" y2="730" stroke="#2D6A4F" strokeWidth="0.7" opacity="0.14" />
        {/* Tendril */}
        <path
          d="M20,755 C13,748 10,740 15,734 C20,728 26,732 22,738"
          stroke="#52B788" strokeWidth="0.8" opacity="0.12" strokeLinecap="round" fill="none"
        />
        {/* Small leaves — scattered */}
        <ellipse cx="8" cy="775" rx="7" ry="3.5" fill="#74C69D" opacity="0.16" transform="rotate(22 8 775)" />
        <ellipse cx="48" cy="790" rx="8" ry="4" fill="#52B788" opacity="0.15" transform="rotate(-28 48 790)" />
        <ellipse cx="12" cy="810" rx="6" ry="3" fill="#B7E4C7" opacity="0.14" transform="rotate(35 12 810)" />
        {/* Bud with flower hint */}
        <circle cx="38" cy="835" r="3.5" fill="#B7E4C7" opacity="0.20" />
        <circle cx="38" cy="835" r="1.8" fill="#95D5B2" opacity="0.28" />
        <circle cx="36.5" cy="833.5" r="0.9" fill="#F4A8B5" opacity="0.18" />

        {/* ── Zone 6: y 850–1000 ── */}
        {/* Large leaf — right */}
        <path
          d="M34,870 Q56,856 60,868 Q52,880 34,870Z"
          fill="#40916C" opacity="0.17"
        />
        <path
          d="M34,870 Q46,862 60,868" stroke="#2D6A4F" strokeWidth="0.6" opacity="0.13"
        />
        {/* Medium leaf — left */}
        <ellipse cx="4" cy="900" rx="10" ry="5" fill="#52B788" opacity="0.17" transform="rotate(30 4 900)" />
        <line x1="20" y1="904" x2="6" y2="900" stroke="#2D6A4F" strokeWidth="0.6" opacity="0.13" />
        {/* Small leaves trailing off */}
        <ellipse cx="50" cy="930" rx="7" ry="3.5" fill="#74C69D" opacity="0.14" transform="rotate(-24 50 930)" />
        <ellipse cx="10" cy="955" rx="8" ry="3.5" fill="#40916C" opacity="0.13" transform="rotate(28 10 955)" />
        <ellipse cx="44" cy="975" rx="6" ry="3" fill="#B7E4C7" opacity="0.12" transform="rotate(-20 44 975)" />

        {/* ── Ambient details — dewdrops, tiny dots ── */}
        <circle cx="50" cy="135" r="1.2" fill="#A8DADC" opacity="0.25" />
        <circle cx="8" cy="318" r="1" fill="#A8DADC" opacity="0.20" />
        <circle cx="48" cy="508" r="1.1" fill="#A8DADC" opacity="0.22" />
        <circle cx="10" cy="720" r="1" fill="#A8DADC" opacity="0.18" />
        <circle cx="46" cy="875" r="1.2" fill="#A8DADC" opacity="0.16" />
      </svg>
    </div>
  );
}
