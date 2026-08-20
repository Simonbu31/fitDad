import { supabase } from './supabase'

export type PersonalBest = { weight: number; reps: number }

// Best-ever weight (and best reps at that weight) per exercise, computed
// from all sets logged so far. Used to decide if a newly logged set is a PR.
export async function fetchPersonalBests(): Promise<Record<number, PersonalBest>> {
  const { data, error } = await supabase
    .from('workout_sets')
    .select('exercise_id, weight_kg, reps')
  if (error) throw error

  const bests: Record<number, PersonalBest> = {}
  for (const row of data ?? []) {
    const cur = bests[row.exercise_id]
    const isBetter =
      !cur || row.weight_kg > cur.weight || (row.weight_kg === cur.weight && row.reps > cur.reps)
    if (isBetter) {
      bests[row.exercise_id] = { weight: row.weight_kg, reps: row.reps }
    }
  }
  return bests
}

export type SetRow = {
  id: string
  exercise_id: number
  set_number: number
  weight_kg: number
  reps: number
  is_pr: boolean
}

export type WorkoutWithSets = {
  id: string
  started_at: string
  finished_at: string | null
  workout_sets: SetRow[]
}

export async function fetchFinishedWorkouts(): Promise<WorkoutWithSets[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, started_at, finished_at, workout_sets(id, exercise_id, set_number, weight_kg, reps, is_pr)')
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as WorkoutWithSets[]
}

export type SetToSave = {
  exercise_id: number
  set_number: number
  weight_kg: number
  reps: number
  is_pr: boolean
}

export async function fetchNotifyTopic(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('notify_topic')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data?.notify_topic ?? null
}

export async function saveNotifyTopic(userId: string, topic: string | null): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, notify_topic: topic })
  if (error) throw error
}

export async function saveWorkout(startedAt: string, sets: SetToSave[]): Promise<string> {
  const { data: workout, error: wErr } = await supabase
    .from('workouts')
    .insert({ started_at: startedAt, finished_at: new Date().toISOString() })
    .select('id')
    .single()
  if (wErr) throw wErr

  const { error: sErr } = await supabase
    .from('workout_sets')
    .insert(sets.map((s) => ({ ...s, workout_id: workout.id })))
  if (sErr) throw sErr

  return workout.id
}
