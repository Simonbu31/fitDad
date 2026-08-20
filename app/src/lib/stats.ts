import type { WorkoutWithSets } from './queries'

export type HistoryPoint = { date: string; weight: number; reps: number; isPr: boolean }

/** Top-set weight per workout for one exercise, oldest → newest, for charting. */
export function computeExerciseHistory(workouts: WorkoutWithSets[], exerciseId: number): HistoryPoint[] {
  const points: HistoryPoint[] = []
  // workouts arrives newest-first; walk it reversed for chronological order.
  for (const w of [...workouts].reverse()) {
    const setsForExercise = w.workout_sets.filter((s) => s.exercise_id === exerciseId)
    if (setsForExercise.length === 0) continue
    const top = setsForExercise.reduce((best, s) =>
      s.weight_kg > best.weight_kg || (s.weight_kg === best.weight_kg && s.reps > best.reps) ? s : best,
    )
    points.push({ date: w.finished_at!, weight: top.weight_kg, reps: top.reps, isPr: top.is_pr })
  }
  return points
}

export type BestSet = { weight: number; reps: number }

function betterOf(a: BestSet | undefined, b: BestSet): BestSet {
  if (!a) return b
  if (b.weight > a.weight) return b
  if (b.weight === a.weight && b.reps > a.reps) return b
  return a
}

/** All-time heaviest set per exercise, across every finished workout. */
export function computeAllTimeBests(workouts: WorkoutWithSets[]): Record<number, BestSet> {
  const bests: Record<number, BestSet> = {}
  for (const w of workouts) {
    for (const s of w.workout_sets) {
      bests[s.exercise_id] = betterOf(bests[s.exercise_id], { weight: s.weight_kg, reps: s.reps })
    }
  }
  return bests
}

/**
 * Heaviest set per exercise from the most recent workout that included it
 * (workouts must be sorted most-recent-first). Used to suggest a starting
 * weight ("last time you did...") for progressive overload.
 */
export function computeLastPerformance(workouts: WorkoutWithSets[]): Record<number, BestSet> {
  const last: Record<number, BestSet> = {}
  for (const w of workouts) {
    // Best set per exercise within THIS workout only.
    const withinWorkout: Record<number, BestSet> = {}
    for (const s of w.workout_sets) {
      withinWorkout[s.exercise_id] = betterOf(withinWorkout[s.exercise_id], {
        weight: s.weight_kg,
        reps: s.reps,
      })
    }
    // Only fill in exercises we haven't already locked in from a more
    // recent workout — older workouts must never override a newer one.
    for (const [exerciseId, best] of Object.entries(withinWorkout)) {
      if (!last[Number(exerciseId)]) {
        last[Number(exerciseId)] = best
      }
    }
  }
  return last
}
