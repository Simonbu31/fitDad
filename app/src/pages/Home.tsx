import { useEffect, useState } from 'react'
import { fetchFinishedWorkouts, type WorkoutWithSets } from '../lib/queries'
import { computeStreak } from '../lib/streak'
import { exerciseById } from '../lib/exercises'

type HomeProps = {
  onStartWorkout: () => void
  onViewProgress: () => void
  onSettings: () => void
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const days = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.round(days / 7)
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
}

export default function Home({ onStartWorkout, onViewProgress, onSettings }: HomeProps) {
  const [workouts, setWorkouts] = useState<WorkoutWithSets[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchFinishedWorkouts()
      .then(setWorkouts)
      .catch(() => setError(true))
  }, [])

  const streak = workouts ? computeStreak(workouts.map((w) => w.finished_at!)) : null
  const lastWorkout = workouts?.[0]
  const totalWorkouts = workouts?.length ?? 0

  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 max-w-md mx-auto w-full">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Fit Dad 💪</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {totalWorkouts > 0
              ? `${totalWorkouts} workout${totalWorkouts === 1 ? '' : 's'} logged`
              : 'Ready for your first workout'}
          </p>
        </div>

        {streak !== null && streak > 0 && (
          <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 px-5 py-2.5 rounded-full font-semibold text-lg">
            <span>🔥</span>
            <span>{streak} workout streak</span>
          </div>
        )}

        <button
          onClick={onStartWorkout}
          className="w-full py-6 rounded-3xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition text-white text-2xl font-bold shadow-lg shadow-blue-600/20"
        >
          Start Workout
        </button>

        {error && (
          <p className="text-sm text-red-500 text-center">
            Couldn't reach the server. Check your internet connection.
          </p>
        )}

        {lastWorkout && (
          <div className="w-full rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
              Last workout · {formatRelativeDate(lastWorkout.finished_at!)}
            </p>
            <ul className="text-sm space-y-1">
              {Object.entries(
                lastWorkout.workout_sets.reduce<Record<number, number>>((acc, s) => {
                  acc[s.exercise_id] = Math.max(acc[s.exercise_id] ?? 0, s.weight_kg)
                  return acc
                }, {}),
              ).map(([exerciseId, weight]) => (
                <li key={exerciseId} className="flex justify-between">
                  <span>{exerciseById(Number(exerciseId))?.name}</span>
                  <span className="font-medium">{weight} kg</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-6">
          <button onClick={onViewProgress} className="text-blue-600 dark:text-blue-400 font-medium">
            View Progress →
          </button>
          <button onClick={onSettings} className="text-neutral-400 font-medium">
            Settings
          </button>
        </div>
      </div>
    </div>
  )
}
