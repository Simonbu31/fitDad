import type { SetToSave } from './queries'

const DRAFT_KEY = 'fitdad-draft-v1'

export type WorkoutMode = 'straight' | 'superset'

export type WorkoutDraft = {
  startedAt: string
  mode: WorkoutMode
  exerciseIndex: number
  pairIndex: number
  sets: SetToSave[]
}

export function loadDraft(): WorkoutDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as Partial<WorkoutDraft>
    // Defensive defaults in case a draft was saved by an older version.
    return {
      startedAt: draft.startedAt ?? new Date().toISOString(),
      mode: draft.mode ?? 'straight',
      exerciseIndex: draft.exerciseIndex ?? 0,
      pairIndex: draft.pairIndex ?? 0,
      sets: draft.sets ?? [],
    }
  } catch {
    return null
  }
}

export function saveDraft(draft: WorkoutDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // storage full/unavailable — non-critical, in-memory state still works
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}
