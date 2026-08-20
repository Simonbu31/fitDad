import { useState } from 'react'
import type { HistoryPoint } from '../lib/stats'

type ExerciseChartProps = {
  name: string
  points: HistoryPoint[]
}

const WIDTH = 320
const HEIGHT = 120
const PAD_X = 12
const PAD_Y = 16

export default function ExerciseChart({ name, points }: ExerciseChartProps) {
  const [active, setActive] = useState<number | null>(null)

  if (points.length === 0) {
    return (
      <div className="viz-root rounded-2xl border border-(--border) bg-(--surface) p-4">
        <p className="font-semibold text-(--text-primary)">{name}</p>
        <p className="text-sm text-(--text-muted) mt-6 mb-4 text-center">No sets logged yet</p>
      </div>
    )
  }

  const weights = points.map((p) => p.weight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1

  const xFor = (i: number) =>
    points.length === 1 ? WIDTH / 2 : PAD_X + (i / (points.length - 1)) * (WIDTH - PAD_X * 2)
  const yFor = (w: number) => HEIGHT - PAD_Y - ((w - min) / range) * (HEIGHT - PAD_Y * 2)

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.weight)}`).join(' ')

  const latest = points[points.length - 1]
  const first = points[0]
  const delta = latest.weight - first.weight

  return (
    <div className="viz-root rounded-2xl border border-(--border) bg-(--surface) p-4">
      <div className="flex items-baseline justify-between mb-1">
        <p className="font-semibold text-(--text-primary)">{name}</p>
        {points.length > 1 && (
          <p className={`text-sm font-medium ${delta >= 0 ? 'text-(--good)' : 'text-(--text-secondary)'}`}>
            {delta >= 0 ? '+' : ''}
            {delta} kg
          </p>
        )}
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        onMouseLeave={() => setActive(null)}
      >
        <line x1={PAD_X} y1={HEIGHT - PAD_Y} x2={WIDTH - PAD_X} y2={HEIGHT - PAD_Y} stroke="var(--grid)" strokeWidth="1" />
        <path d={linePath} fill="none" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => {
          const isEndpoint = i === 0 || i === points.length - 1
          const showLabel = isEndpoint || p.isPr || active === i
          return (
            <g key={i}>
              <circle
                cx={xFor(i)}
                cy={yFor(p.weight)}
                r={p.isPr ? 5 : 4}
                fill={p.isPr ? 'var(--pr)' : 'var(--line)'}
                stroke="var(--surface)"
                strokeWidth="2"
                onTouchStart={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
              />
              {/* generous invisible hit target for touch */}
              <circle cx={xFor(i)} cy={yFor(p.weight)} r={12} fill="transparent" onTouchStart={() => setActive(i)} onMouseEnter={() => setActive(i)} />
              {showLabel && (
                <text
                  x={xFor(i)}
                  y={yFor(p.weight) - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--text-secondary)"
                >
                  {p.weight}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {active !== null && (
        <p className="text-xs text-(--text-muted) text-center -mt-1">
          {new Date(points[active].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ·{' '}
          {points[active].weight} kg × {points[active].reps}
          {points[active].isPr && ' 🏆'}
        </p>
      )}
    </div>
  )
}
