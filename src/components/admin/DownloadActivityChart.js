import { useMemo } from "react";
import { adminPalette } from "@/components/admin/admin-palette";

const CHART_BASE_W = 1280;
const CHART_MIN_INNER_PX_PER_DAY = 44;

export function DownloadActivityChart({ daily }) {
  const colors = adminPalette;
  const max = useMemo(() => {
    let m = 1;
    for (const d of daily) {
      m = Math.max(m, d.cv + d.cover);
    }
    return m;
  }, [daily]);

  const padL = 48;
  const padR = 24;
  const padT = 28;
  const n = daily.length || 1;
  const labelFontSize = n > 70 ? 8.5 : n > 45 ? 9.5 : 11;
  const padB = n > 55 ? 118 : n > 35 ? 102 : 90;
  const innerPlotH = 320;
  const h = padT + innerPlotH + padB;
  const padLR = padL + padR;
  const innerW = Math.max(CHART_BASE_W - padLR, n * CHART_MIN_INNER_PX_PER_DAY);
  const w = innerW + padLR;
  const innerH = innerPlotH;
  const barGap = 2;
  const groupW = innerW / n;
  const barW = Math.max(1.5, (groupW - barGap) / 2 - 1);
  const labelY = h - 14;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: "block", minWidth: w, maxHeight: "min(58vh, 560px)", height: "auto" }}
      role="img"
      aria-label="Downloads per day"
    >
      <rect x="0" y="0" width={w} height={h} fill="rgba(15, 23, 42, 0.5)" rx="10" />
      {daily.map((d, i) => {
        const x0 = padL + i * groupW + barGap / 2;
        const cvH = (d.cv / max) * innerH;
        const coverH = (d.cover / max) * innerH;
        const yCv = padT + innerH - cvH;
        const yCover = padT + innerH - coverH;
        return (
          <g key={d.date}>
            <rect x={x0} y={yCv} width={barW} height={Math.max(cvH, 0)} fill={colors.bar} rx="2" />
            <rect
              x={x0 + barW + 2}
              y={yCover}
              width={barW}
              height={Math.max(coverH, 0)}
              fill={colors.barCover}
              rx="2"
            />
            <text
              x={x0 + barW}
              y={labelY}
              fill={colors.muted}
              fontSize={labelFontSize}
              textAnchor="middle"
              transform={`rotate(-48 ${x0 + barW} ${labelY})`}
            >
              {d.date.slice(5)}
            </text>
          </g>
        );
      })}
      <text x={padL} y={20} fill={colors.muted} fontSize="13">
        CV (blue) · Cover letter (violet)
      </text>
    </svg>
  );
}
