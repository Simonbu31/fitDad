// The plan calls for a session every 3-4 days. We treat a gap of more than
// this many days between workouts as a broken streak (a little slack for
// life happening, without being so loose it feels meaningless).
const STREAK_GAP_DAYS = 5

function toDayString(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / msPerDay)
}

/** dates: finished_at timestamps, any order. Returns current streak in workouts. */
export function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  const uniqueDays = Array.from(new Set(dates.map(toDayString))).sort((a, b) => (a < b ? 1 : -1))

  const today = new Date().toISOString().slice(0, 10)
  if (daysBetween(today, uniqueDays[0]) > STREAK_GAP_DAYS) return 0

  let streak = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const gap = daysBetween(uniqueDays[i - 1], uniqueDays[i])
    if (gap <= STREAK_GAP_DAYS) {
      streak++
    } else {
      break
    }
  }
  return streak
}
