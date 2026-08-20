import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchFinishedWorkouts, type WorkoutWithSets } from '../lib/queries'
import { computeExerciseHistory } from '../lib/stats'
import { computeStreak } from '../lib/streak'
import { EXERCISES } from '../lib/exercises'
import StreakCalendar from '../components/StreakCalendar'
import ExerciseChart from '../components/ExerciseChart'

export default function Progress() {
  const navigate = useNavigate()
  const location = useLocation()
  const justSaved = (location.state as { justSaved?: boolean } | null)?.justSaved

  const [workouts, setWorkouts] = useState<WorkoutWithSets[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchFinishedWorkouts()
      .then(setWorkouts)
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-6 text-center">
        <p className="text-red-500">Couldn't load progress — check your internet connection.</p>
      </div>
    )
  }

  if (!workouts) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-neutral-400">
        Loading…
      </div>
    )
  }

  const workoutDays = new Set(workouts.map((w) => new Date(w.finished_at!).toISOString().slice(0, 10)))
  const streak = computeStreak(workouts.map((w) => w.finished_at!))
  const prSets = workouts
    .flatMap((w) => w.workout_sets.filter((s) => s.is_pr).map((s) => ({ ...s, date: w.finished_at! })))
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
      <div className="max-w-md mx-auto px-6 py-6 flex flex-col gap-5">
        <button onClick={() => navigate('/')} className="text-neutral-400 self-start">
          ← Home
        </button>

        {justSaved && (
          <div className="rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-4 py-3 font-semibold text-center">
            Workout saved — nice work! 💪
          </div>
        )}

        <h1 className="text-2xl font-bold">Progress</h1>

        {workouts.length === 0 ? (
          <p className="text-neutral-500 dark:text-neutral-400">
            No workouts logged yet — finish your first one and it'll show up here.
          </p>
        ) : (
          <>
            <div className="flex gap-3">
              <div className="flex-1 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 text-center">
                <p className="text-3xl font-bold">{workouts.length}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Workouts</p>
              </div>
              <div className="flex-1 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 text-center">
                <p className="text-3xl font-bold">🔥 {streak}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Streak</p>
              </div>
              <div className="flex-1 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 text-center">
                <p className="text-3xl font-bold">🏆 {prSets.length}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">PRs</p>
              </div>
            </div>

            <StreakCalendar workoutDays={workoutDays} />

            {prSets.length > 0 && (
              <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4">
                <p className="font-semibold mb-3">Personal records</p>
                <ul className="flex flex-col gap-2">
                  {prSets.slice(0, 8).map((s) => (
                    <li key={s.id} className="flex justify-between text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400">
                        {EXERCISES.find((e) => e.id === s.exercise_id)?.name}
                      </span>
                      <span className="font-medium">
                        {s.weight_kg} kg × {s.reps} 🏆
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="font-semibold -mb-2">By exercise</p>
            {EXERCISES.map((e) => (
              <ExerciseChart key={e.id} name={e.name} points={computeExerciseHistory(workouts, e.id)} />
            ))}
          </>
        )}

        <button
          onClick={() => navigate('/workout')}
          className="w-full py-5 rounded-2xl bg-blue-600 text-white text-xl font-bold mt-2"
        >
          Start Workout
        </button>
      </div>
    </div>
  )
}
