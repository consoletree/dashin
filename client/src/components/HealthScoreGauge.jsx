import { getHealthScoreColor } from '../utils/helpers';

export default function HealthScoreGauge({ score, size = 'md', showLabel = true }) {
  const sizes = {
    sm: { width: 60, stroke: 6, fontSize: 'text-sm' },
    md: { width: 100, stroke: 8, fontSize: 'text-2xl' },
    lg: { width: 150, stroke: 10, fontSize: 'text-4xl' }
  };

  const { width, stroke, fontSize } = sizes[size];
  const radius = (width - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - score) / 100) * circumference;
  const color = getHealthScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={width} height={width} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke="#2a2a3a"
          strokeWidth={stroke}
        />
        {/* Progress circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out',
            filter: `drop-shadow(0 0 6px ${color}40)`
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${fontSize}`} style={{ color }}>
            {score}
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-gray-500">Health</span>
          )}
        </div>
      )}
    </div>
  );
}
