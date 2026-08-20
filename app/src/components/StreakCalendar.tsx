type StreakCalendarProps = {
  /** Set of workout days as 'YYYY-MM-DD' strings. */
  workoutDays: Set<string>
  weeks?: number
}

const DAY_LABELS = ['Mon', 'Wed', 'Fri']

function toDayString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function StreakCalendar({ workoutDays, weeks = 12 }: StreakCalendarProps) {
  const today = new Date()
  // Align the grid so the last column ends on the current week, Monday-start.
  const todayDow = (today.getDay() + 6) % 7 // 0 = Monday
  const gridStart = new Date(today)
  gridStart.setDate(today.getDate() - todayDow - (weeks - 1) * 7)

  const columns = Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = new Date(gridStart)
      date.setDate(gridStart.getDate() + week * 7 + day)
      return date
    }),
  )

  return (
    <div className="viz-root rounded-2xl border border-(--border) bg-(--surface) p-4">
      <p className="font-semibold text-(--text-primary) mb-3">Training days</p>
      <div className="flex gap-3">
        <div className="flex flex-col justify-between text-[10px] text-(--text-muted) py-0.5">
          {DAY_LABELS.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <div className="flex gap-[3px] overflow-x-auto">
          {columns.map((col, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              {col.map((date, j) => {
                const isFuture = date > today
                const trained = workoutDays.has(toDayString(date))
                return (
                  <div
                    key={j}
                    title={toDayString(date)}
                    className="w-3 h-3 rounded-[3px]"
                    style={{
                      backgroundColor: isFuture
                        ? 'transparent'
                        : trained
                          ? 'var(--line)'
                          : 'var(--streak-empty)',
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
