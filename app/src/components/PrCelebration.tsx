import { useEffect, useState } from 'react'

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']

type PrCelebrationProps = {
  message: string
  onDone: () => void
}

// Lightweight CSS-only confetti — no extra dependency needed for a handful
// of falling squares.
export default function PrCelebration({ message, onDone }: PrCelebrationProps) {
  const [pieces] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.6 + Math.random() * 0.8,
      color: COLORS[i % COLORS.length],
      rotate: Math.random() * 360,
    })),
  )

  useEffect(() => {
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onDone}>
      <style>{`
        @keyframes pr-fall {
          from { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          to { transform: translateY(110vh) rotate(360deg); opacity: 0.9; }
        }
        @keyframes pr-pop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            width: 10,
            height: 10,
            backgroundColor: p.color,
            animation: `pr-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
      <div
        className="relative text-center px-8"
        style={{ animation: 'pr-pop 0.5s ease-out forwards' }}
      >
        <div className="text-6xl mb-3">🏆</div>
        <p className="text-white text-2xl font-bold">New Personal Record!</p>
        <p className="text-white/80 text-lg mt-1">{message}</p>
      </div>
    </div>
  )
}
