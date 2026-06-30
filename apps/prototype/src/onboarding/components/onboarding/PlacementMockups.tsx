import type { FloatingPosition } from "@onb/lib/types";

/**
 * HL-shell wireframes used in the wizard Placement step.
 *
 * Each mock shares the same HighLevel shell (top bar + left sidebar + content
 * area) so the agency picks by recognizing the placement target rendered in
 * its real position. The target itself is painted in currentColor, which the
 * card drives from var(--client-accent).
 */

const FRAME_W = 220;
const FRAME_H = 140;
const TOP_H = 16;
const SIDE_W = 36;
const ACCENT = "currentColor";

function Shell({
  children,
  highlightMenu = false,
}: {
  children?: React.ReactNode;
  highlightMenu?: boolean;
}) {
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-hidden
      style={{ display: "block", borderRadius: "var(--r-sm)" }}
    >
      {/* Canvas */}
      <rect
        x={0.5}
        y={0.5}
        width={FRAME_W - 1}
        height={FRAME_H - 1}
        rx={6}
        fill="var(--surface)"
        stroke="var(--border)"
      />
      {/* Top bar */}
      <rect x={1} y={1} width={FRAME_W - 2} height={TOP_H} fill="var(--bg-subtle)" />
      <circle cx={9} cy={1 + TOP_H / 2} r={2} fill="var(--border)" />
      <circle cx={16} cy={1 + TOP_H / 2} r={2} fill="var(--border)" />
      <circle cx={23} cy={1 + TOP_H / 2} r={2} fill="var(--border)" />

      {/* Sidebar */}
      <rect
        x={1}
        y={1 + TOP_H}
        width={SIDE_W}
        height={FRAME_H - 2 - TOP_H}
        fill="var(--bg-subtle)"
      />
      {/* Sidebar items (4) */}
      {[0, 1, 2, 3].map((i) => {
        const y = 1 + TOP_H + 10 + i * 14;
        const highlighted = highlightMenu && i === 2;
        return (
          <g key={i}>
            {highlighted && (
              <rect
                x={3}
                y={y - 4}
                width={SIDE_W - 4}
                height={10}
                rx={2}
                fill={ACCENT}
                opacity={0.18}
              />
            )}
            <rect
              x={7}
              y={y - 1}
              width={4}
              height={4}
              rx={1}
              fill={highlighted ? ACCENT : "var(--border)"}
            />
            <rect
              x={14}
              y={y}
              width={highlighted ? 18 : 16}
              height={3}
              rx={1}
              fill={highlighted ? ACCENT : "var(--border)"}
            />
          </g>
        );
      })}
      {children}
    </svg>
  );
}

/* Content-area helper: faint wireframe lines so the body doesn't look empty. */
function ContentLines() {
  const x0 = SIDE_W + 8;
  return (
    <g>
      <rect x={x0} y={28} width={120} height={4} rx={1} fill="var(--border)" />
      <rect x={x0} y={40} width={90} height={3} rx={1} fill="var(--border)" />
      <rect x={x0} y={60} width={140} height={3} rx={1} fill="var(--border)" />
      <rect x={x0} y={70} width={110} height={3} rx={1} fill="var(--border)" />
      <rect x={x0} y={88} width={130} height={3} rx={1} fill="var(--border)" />
      <rect x={x0} y={98} width={80} height={3} rx={1} fill="var(--border)" />
    </g>
  );
}

export function BannerMock() {
  // Slim accent strip across the top, sitting just under the HL top bar.
  const bandY = 1 + TOP_H;
  return (
    <Shell>
      <ContentLines />
      {/* Banner strip */}
      <rect
        x={SIDE_W + 1}
        y={bandY}
        width={FRAME_W - SIDE_W - 2}
        height={10}
        fill={ACCENT}
      />
      {/* Tiny checklist ticks inside the banner */}
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={SIDE_W + 8 + i * 14}
          y={bandY + 3.5}
          width={3}
          height={3}
          rx={0.5}
          fill="var(--surface)"
        />
      ))}
      <rect
        x={SIDE_W + 50}
        y={bandY + 4}
        width={80}
        height={2}
        rx={1}
        fill="var(--surface)"
        opacity={0.7}
      />
    </Shell>
  );
}

export function FloatingMock({
  position = "bottom-right-offset",
}: {
  position?: FloatingPosition;
}) {
  const { cx, cy } = (() => {
    switch (position) {
      case "bottom-left":
        return { cx: SIDE_W + 14, cy: FRAME_H - 16 };
      case "bottom-right":
        return { cx: FRAME_W - 14, cy: FRAME_H - 16 };
      default:
        return { cx: FRAME_W - 30, cy: FRAME_H - 16 };
    }
  })();
  return (
    <Shell>
      <ContentLines />
      {/* Floating bubble */}
      <circle cx={cx} cy={cy} r={9} fill={ACCENT} />
      <rect x={cx - 3.5} y={cy - 1.5} width={7} height={1.5} rx={0.5} fill="var(--surface)" />
      <rect x={cx - 3.5} y={cy + 1} width={5} height={1.5} rx={0.5} fill="var(--surface)" />
    </Shell>
  );
}

export function MenuMock() {
  // Sidebar item highlighted + a faint accent connector hinting it opens a panel.
  return (
    <Shell highlightMenu>
      <ContentLines />
    </Shell>
  );
}

export function EmbedMock() {
  // Full content-area checklist page (Launchpad-style), no overlay.
  const x0 = SIDE_W + 8;
  const yTop = 1 + TOP_H + 8;
  return (
    <Shell>
      {/* Page title */}
      <rect x={x0} y={yTop} width={70} height={5} rx={1} fill={ACCENT} />
      <rect x={x0} y={yTop + 10} width={110} height={3} rx={1} fill="var(--border)" />
      {/* Checklist rows */}
      {[0, 1, 2, 3].map((i) => {
        const ry = yTop + 24 + i * 16;
        return (
          <g key={i}>
            <rect
              x={x0}
              y={ry}
              width={9}
              height={9}
              rx={1.5}
              fill="var(--surface)"
              stroke={ACCENT}
              strokeWidth={1.2}
            />
            {i < 2 && (
              <path
                d={`M ${x0 + 2} ${ry + 4.5} L ${x0 + 4} ${ry + 6.5} L ${x0 + 7} ${ry + 3}`}
                stroke={ACCENT}
                strokeWidth={1.4}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <rect
              x={x0 + 14}
              y={ry + 2}
              width={100 + (i % 2 === 0 ? 30 : 10)}
              height={3}
              rx={1}
              fill="var(--border)"
            />
            <rect
              x={x0 + 14}
              y={ry + 7}
              width={70 + (i % 2 === 0 ? 10 : 30)}
              height={2}
              rx={1}
              fill="var(--border)"
              opacity={0.6}
            />
          </g>
        );
      })}
    </Shell>
  );
}
