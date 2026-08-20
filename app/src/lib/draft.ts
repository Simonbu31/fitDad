import type { SetToSave } from './queries'

const DRAFT_KEY = 'fitdad-draft-v1'

export type WorkoutDraft = {
  startedAt: string
  exerciseIndex: number
  sets: SetToSave[]
}

export function loadDraft(): WorkoutDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as WorkoutDraft
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
