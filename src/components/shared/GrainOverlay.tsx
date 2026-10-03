/** Global film grain: SVG noise at ~4% opacity. */
export function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="grain pointer-events-none fixed inset-0 z-[200] opacity-[0.04] mix-blend-soft-light"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      }}
    />
  );
}
