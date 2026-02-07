function polarToScreen(angle: number, r: number, cx: number, cy: number) {
  return {
    x: cx + Math.cos(angle) * r,
    y: cy + Math.sin(angle) * r,
    dx: Math.cos(angle),
    dy: Math.sin(angle),
  };
}

export function RadialNavOverlay({ nav }: { nav: any[] }) {
  const size = 500;
  const cx = size / 1.8;
  const cy = size / 2.5;
  const r = size * 0.40;

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
        const y1 = cy + ny * (r + 30);

        const tx = cx + nx * (r + 44);
        const ty = cy + ny * (r + 44);

        return (
            <a
                key={n.label}
                href={n.href}
                style={{ pointerEvents: "auto", cursor: "pointer" }}
            >
                <g key={n.label}>
                    <line
                    x1={x0}
                    y1={y0}
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