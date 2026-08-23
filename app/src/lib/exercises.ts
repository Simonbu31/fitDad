export type Exercise = {
  id: number
  slug: string
  name: string
  setsTarget: number
  repsMin: number
  repsMax: number
  restSeconds: number
}

// Mirrors the `exercises` table (static plan, doesn't change often).
// Kept as a local constant so the workout screen doesn't depend on a
// network round-trip just to know what's on today's plan.
export const EXERCISES: Exercise[] = [
  { id: 1, slug: 'leg-press', name: 'Leg Press', setsTarget: 3, repsMin: 8, repsMax: 10, restSeconds: 180 },
  { id: 2, slug: 'rdl', name: 'Trap Bar Deadlift / RDL', setsTarget: 2, repsMin: 6, repsMax: 8, restSeconds: 180 },
  { id: 3, slug: 'bench-press', name: 'Bench Press', setsTarget: 3, repsMin: 6, repsMax: 8, restSeconds: 180 },
  { id: 4, slug: 'lat-pulldown', name: 'Lat Pulldown', setsTarget: 3, repsMin: 8, repsMax: 8, restSeconds: 90 },
  { id: 5, slug: 'seated-row', name: 'Seated Row (Cable) / T-Bar', setsTarget: 3, repsMin: 8, repsMax: 10, restSeconds: 90 },
  { id: 6, slug: 'chest-fly', name: 'Chest Fly / Butterfly', setsTarget: 3, repsMin: 10, repsMax: 10, restSeconds: 90 },
  { id: 7, slug: 'bicep-curls', name: 'Bicep Curls', setsTarget: 3, repsMin: 10, repsMax: 10, restSeconds: 90 },
]

// Not part of the plan's superset pairing — always done solo at the very
// end, in both Straight Sets and Superset mode.
export const FINISHER_EXERCISE_ID = 7

export function exerciseById(id: number): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id)
}

// From the plan's "Supersets (optional)" section: pair upper + lower body so
// Leg Press and RDL/Trap Bar Deadlift never land back-to-back (pre-fatigued
// legs on a technical hip-hinge movement is a real injury risk).
export const SUPERSET_PAIRS: [number, number][] = [
  [1, 3], // Leg Press + Bench Press
  [2, 4], // Trap Bar Deadlift / RDL + Lat Pulldown
  [5, 6], // Seated Row + Chest Fly
]

// Set A, ~30-45s to switch, set B, then 90s-2min before the next round.
export const SUPERSET_SHORT_REST = 40
export const SUPERSET_LONG_REST = 105
