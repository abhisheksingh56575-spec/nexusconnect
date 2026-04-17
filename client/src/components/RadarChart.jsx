import { useEffect, useState } from 'react';

export default function RadarChart({ skills = {}, size = 300 }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const categories = Object.keys(skills);
  if (categories.length < 3) return null;

  const center = size / 2;
  const radius = (size / 2) - 40;
  const levels = 5;
  const angleStep = (2 * Math.PI) / categories.length;

  const getPoint = (angle, r) => ({
    x: center + r * Math.cos(angle - Math.PI / 2),
    y: center + r * Math.sin(angle - Math.PI / 2),
  });

  // Grid lines
  const gridPaths = [];
  for (let level = 1; level <= levels; level++) {
    const r = (radius / levels) * level;
    const points = categories.map((_, i) => getPoint(i * angleStep, r));
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
    gridPaths.push(path);
  }

  // Data points
  const dataPoints = categories.map((cat, i) => {
    const value = skills[cat] / 100;
    const r = animated ? radius * value : 0;
    return getPoint(i * angleStep, r);
  });

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  // Axis lines
  const axisLines = categories.map((_, i) => {
    const end = getPoint(i * angleStep, radius);
    return { x1: center, y1: center, x2: end.x, y2: end.y };
  });

  // Labels
  const labels = categories.map((cat, i) => {
    const p = getPoint(i * angleStep, radius + 20);
    return { text: cat, x: p.x, y: p.y };
  });

  return (
    <div className="radar-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {gridPaths.map((path, i) => (
          <path
            key={i}
            d={path}
            fill="none"
            stroke="rgba(108, 92, 231, 0.15)"
            strokeWidth="1"
          />
        ))}

        {/* Axes */}
        {axisLines.map((line, i) => (
          <line
            key={i}
            {...line}
            stroke="rgba(108, 92, 231, 0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Data area */}
        <path
          d={dataPath}
          fill="rgba(108, 92, 231, 0.2)"
          stroke="rgba(108, 92, 231, 0.8)"
          strokeWidth="2"
          style={{ transition: 'all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#6c5ce7"
            stroke="white"
            strokeWidth="2"
            style={{ transition: 'all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transitionDelay: `${i * 0.1}s` }}
          />
        ))}

        {/* Labels */}
        {labels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#a0a0cc"
            fontSize="11"
            fontFamily="Inter, sans-serif"
          >
            {label.text}
          </text>
        ))}
      </svg>
    </div>
  );
}
