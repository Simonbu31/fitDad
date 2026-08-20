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
]

export function exerciseById(id: number): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id)
}
