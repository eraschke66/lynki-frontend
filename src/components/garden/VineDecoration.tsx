export function VineDecoration() {
  return (
    <div
      className="fixed left-0 top-0 h-screen w-14 pointer-events-none hidden lg:block"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <svg
        width="56"
        height="100%"
        viewBox="0 0 56 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main winding stem */}
        <path
          d="M28,0 C32,60 22,120 28,180 C34,240 38,300 28,360 C18,420 22,480 28,540 C34,600 38,660 28,720 C18,780 22,840 28,900"
          stroke="#2D6A4F"
          strokeWidth="1.5"
          opacity="0.28"
          strokeLinecap="round"
        />

        {/* Leaf 1 — right, y≈80 */}
        <line x1="28" y1="82" x2="41" y2="77" stroke="#2D6A4F" strokeWidth="0.8" opacity="0.22" />
        <ellipse cx="43" cy="75" rx="11" ry="5.5" fill="#52B788" opacity="0.22" transform="rotate(-32 43 75)" />

        {/* Leaf 2 — left, y≈160 */}
        <line x1="28" y1="162" x2="14" y2="157" stroke="#2D6A4F" strokeWidth="0.8" opacity="0.22" />
        <ellipse cx="12" cy="155" rx="10" ry="5" fill="#40916C" opacity="0.2" transform="rotate(28 12 155)" />

        {/* Leaf 3 — right, y≈255 */}
        <line x1="29" y1="257" x2="43" y2="252" stroke="#2D6A4F" strokeWidth="0.8" opacity="0.22" />
        <ellipse cx="46" cy="249" rx="12" ry="6" fill="#74C69D" opacity="0.18" transform="rotate(-40 46 249)" />

        {/* Tendril at y≈310 */}
        <path
          d="M28,310 C35,305 38,297 33,291 C28,285 22,288 25,294"
          stroke="#40916C"
          strokeWidth="1"
          opacity="0.18"
          strokeLinecap="round"
        />

        {/* Leaf 4 — left, y≈345 */}
        <line x1="27" y1="347" x2="12" y2="342" stroke="#2D6A4F" strokeWidth="0.8" opacity="0.22" />
        <ellipse cx="10" cy="340" rx="11" ry="5.5" fill="#52B788" opacity="0.2" transform="rotate(30 10 340)" />

        {/* Small bud at y≈410 */}
        <circle cx="28" cy="410" r="3.5" fill="#B7E4C7" opacity="0.28" />
        <circle cx="28" cy="410" r="1.8" fill="#52B788" opacity="0.38" />

        {/* Leaf 5 — right, y≈445 */}
        <line x1="28" y1="447" x2="42" y2="442" stroke="#2D6A4F" strokeWidth="0.8" opacity="0.22" />
        <ellipse cx="44" cy="440" rx="11" ry="5.5" fill="#40916C" opacity="0.18" transform="rotate(-26 44 440)" />

        {/* Leaf 6 — left, y≈530 */}
        <line x1="28" y1="532" x2="13" y2="527" stroke="#2D6A4F" strokeWidth="0.8" opacity="0.22" />
        <ellipse cx="11" cy="525" rx="10" ry="5" fill="#74C69D" opacity="0.2" transform="rotate(35 11 525)" />

        {/* Tendril at y≈575 */}
        <path
          d="M28,575 C21,570 18,562 23,556 C28,550 34,554 31,560"
          stroke="#40916C"
          strokeWidth="1"
          opacity="0.18"
          strokeLinecap="round"
        />

        {/* Leaf 7 — right, y≈618 */}
        <line x1="28" y1="620" x2="43" y2="615" stroke="#2D6A4F" strokeWidth="0.8" opacity="0.22" />
        <ellipse cx="46" cy="612" rx="12" ry="5.5" fill="#52B788" opacity="0.18" transform="rotate(-35 46 612)" />

        {/* Leaf 8 — left, y≈700 */}
        <line x1="27" y1="702" x2="12" y2="697" stroke="#2D6A4F" strokeWidth="0.8" opacity="0.22" />
        <ellipse cx="10" cy="695" rx="11" ry="5.5" fill="#40916C" opacity="0.2" transform="rotate(28 10 695)" />

        {/* Small bud at y≈755 */}
        <circle cx="28" cy="755" r="3" fill="#B7E4C7" opacity="0.25" />
        <circle cx="28" cy="755" r="1.5" fill="#52B788" opacity="0.35" />

        {/* Leaf 9 — right, y≈790 */}
        <line x1="28" y1="792" x2="42" y2="787" stroke="#2D6A4F" strokeWidth="0.8" opacity="0.22" />
        <ellipse cx="44" cy="784" rx="11" ry="5.5" fill="#74C69D" opacity="0.18" transform="rotate(-30 44 784)" />

        {/* Leaf 10 — left, y≈875 */}
        <line x1="28" y1="877" x2="13" y2="872" stroke="#2D6A4F" strokeWidth="0.8" opacity="0.22" />
        <ellipse cx="11" cy="870" rx="10" ry="5" fill="#52B788" opacity="0.2" transform="rotate(32 11 870)" />
      </svg>
    </div>
  );
}
