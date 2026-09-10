type NavItem = {
  label: string;
  href: string;
  angle: number;
};

type NavOverlayProps = {
  nav: NavItem[];
  onHover: (angle: number) => void;
  onLeave: () => void;
  onNavigate: (href: string) => void;
};

export function RadialNavOverlay({ nav, onHover, onLeave, onNavigate, }: NavOverlayProps) {
  const size = 500;
  const cx = size / 2.3;
  const cy = size / 2.4;
  const r = size * 0.45;

  const characterWidth = 14.4;
  const hitPaddingX = 8;
  const hitHeight = 34;

  return (
    <svg
      viewBox={`-50 -50 ${size} ${size}`}
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      style={{pointerEvents: "none", }}
    >
      {nav.map((item) => {
        const nx = Math.cos(item.angle);
        const ny = Math.sin(item.angle);

        const tx = cx + nx * (r + 44);
        const ty = cy + ny * (r + 44);

        const textWidth = item.label.length * characterWidth;
        const hitWidth = textWidth + hitPaddingX * 2;

        const hitX = nx >= 0 ? tx - hitPaddingX : tx - textWidth - hitPaddingX;
        const hitY = ty - hitHeight / 2;

        return (
          <a
           key={item.label}
            href={item.href}
            aria-label={item.label}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(item.href);
            }}
            onPointerEnter={() => { onHover(item.angle); }}
            onPointerLeave={onLeave}
            style={{ pointerEvents: "auto", cursor: "pointer", }}
          >
            <rect
              x={hitX}
              y={hitY}
              width={hitWidth}
              height={hitHeight}
              fill="transparent"
              pointerEvents="all"
            />
            <text
              x={tx}
              y={ty}
              dominantBaseline="middle"
              textAnchor={nx >= 0 ? "start" : "end" }
              fontSize="24"
              fill="currentColor"
              opacity="0.75"
              pointerEvents="none"
            >
              {item.label}
            </text>
          </a>
        );
      })}
    </svg>
  );
}