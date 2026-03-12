/**
 * Lush vine decoration — Sora-generated Studio Ghibli watercolor vine.
 * Replaces SVG paths with a tiling PNG image for the left border.
 */
export function VineDecoration() {
  return (
    <div
      className="fixed left-0 top-0 h-screen pointer-events-none hidden lg:block"
      style={{ zIndex: 0, width: 90 }}
      aria-hidden="true"
    >
      <img
        src="/vine-border.png"
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          opacity: 0.55,
        }}
      />
    </div>
  );
}
