/**
 * Simple SVG line chart for displaying daily trends
 * Lightweight alternative to heavy charting libraries
 */

interface DataPoint {
  date: string;
  value: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  height?: number;
  className?: string;
}

export function SimpleLineChart({ data, height = 200, className = "" }: SimpleLineChartProps) {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  const padding = 40;
  const width = 800;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate scales
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = 0;
  const valueRange = maxValue - minValue || 1;

  // Generate path
  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
    return { x, y, ...point };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  // Generate grid lines (5 horizontal lines)
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const value = minValue + (valueRange * i) / 4;
    const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
    return { y, label: Math.round(value).toString() };
  });

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height: `${height}px` }}
      >
        {/* Grid lines */}
        {gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={padding}
              y1={line.y}
              x2={width - padding}
              y2={line.y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
              strokeDasharray="4 4"
            />
            <text
              x={padding - 10}
              y={line.y + 4}
              textAnchor="end"
              className="text-[10px] fill-muted-foreground"
            >
              {line.label}
            </text>
          </g>
        ))}

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        />

        {/* Dots */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="currentColor"
            className="text-primary"
          >
            <title>{`${point.date}: ${point.value}`}</title>
          </circle>
        ))}

        {/* X-axis labels (show every 5th date for 30-day view) */}
        {points
          .filter((_, i) => i % Math.ceil(points.length / 6) === 0 || i === points.length - 1)
          .map((point, i) => (
            <text
              key={i}
              x={point.x}
              y={height - 10}
              textAnchor="middle"
              className="text-[10px] fill-muted-foreground"
            >
              {point.date}
            </text>
          ))}
      </svg>
    </div>
  );
}
