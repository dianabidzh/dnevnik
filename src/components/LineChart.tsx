export interface ChartPoint {
  t: number; // время в миллисекундах
  v: number;
}

interface Props {
  points: ChartPoint[];
  from: number;
  to: number;
  startLabel: string;
  endLabel: string;
  decimals?: number;
}

const W = 320;
const H = 150;
const PAD = { l: 10, r: 10, t: 18, b: 24 };

function fmt(v: number, decimals: number): string {
  return v.toFixed(decimals).replace(".", ",");
}

/** Простой линейный график: точки по датам, линия между ними */
export function LineChart({ points, from, to, startLabel, endLabel, decimals = 1 }: Props) {
  if (points.length === 0) return null;
  const values = points.map((p) => p.v);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.12;
  min -= pad;
  max += pad;

  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const span = Math.max(1, to - from);
  const x = (t: number) => PAD.l + ((t - from) / span) * innerW;
  const y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * innerH;

  const coords = points.map((p) => [x(p.t), y(p.v)] as const);
  const line = coords.map(([cx, cy]) => cx.toFixed(1) + "," + cy.toFixed(1)).join(" ");
  const firstP = points[0];
  const lastP = points[points.length - 1];

  return (
    <svg className="chart" viewBox={"0 0 " + W + " " + H} role="img" aria-label="График изменений">
      {[0, 1, 2].map((i) => (
        <line key={i} x1={PAD.l} x2={W - PAD.r} y1={PAD.t + (innerH / 2) * i} y2={PAD.t + (innerH / 2) * i} className="chart-grid" />
      ))}
      {points.length > 1 && <polyline points={line} className="chart-line" />}
      {coords.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={points.length > 60 ? 1.8 : 3.4} className="chart-dot" />
      ))}
      <text x={Math.min(W - 24, Math.max(24, x(firstP.t)))} y={y(firstP.v) - 8} textAnchor="middle">
        {fmt(firstP.v, decimals)}
      </text>
      {points.length > 1 && (
        <text x={Math.min(W - 24, Math.max(24, x(lastP.t)))} y={y(lastP.v) - 8} textAnchor="middle">
          {fmt(lastP.v, decimals)}
        </text>
      )}
      <text x={PAD.l} y={H - 6} textAnchor="start">
        {startLabel}
      </text>
      <text x={W - PAD.r} y={H - 6} textAnchor="end">
        {endLabel}
      </text>
    </svg>
  );
}
