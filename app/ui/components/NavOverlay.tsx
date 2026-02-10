export function RadialNavOverlay({
  nav,
  onHover,
  onLeave,
}: {
  nav: any[];
  onHover: (angle: number) => void;
  onLeave: () => void;
}) {
  const size = 500;
  const cx = size / 2.1;
  const cy = size / 2.1;
  const r = size * 0.55;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      viewBox={`-50 -50 ${size} ${size}`}
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      style={{ pointerEvents: "none" }}
    >
      {nav.map((n) => {
        const nx = Math.cos(n.angle);
        const ny = Math.sin(n.angle);

        const x0 = cx + nx * r;
        const y0 = cy + ny * r;

        const x1 = cx + nx * (r + 30);
        const y1 = cy + ny * (r + 40);

        const tx = cx + nx * (r + 44);
        const ty = cy + ny * (r + 44);

        return (
              <a
                key={n.label}
                href={n.href}
                onMouseEnter={() => onHover(n.angle)}
                onMouseLeave={onLeave}
                style={{ pointerEvents: "auto", cursor: "pointer" }}
              >
                <g key={n.label}>
                    <line
                    x1={x0}
                    y1={y0+15}
                    x2={x1}
                    y2={y1}
                    stroke="currentColor"
                    strokeWidth="1"
                    opacity="0.45"
                    />
                    <text
                    x={tx}
                    y={ty}
                    dominantBaseline="middle"
                    textAnchor={nx >= 0 ? "start" : "end"}
                    fontSize="24"
                    fill="currentColor"
                    opacity="0.75"
                    >
                    {n.label}
                    </text>
                </g>
            </a>
        );
      })}
    </svg>
  );
}