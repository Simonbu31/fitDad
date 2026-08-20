type StepperProps = {
  label: string
  value: number
  step: number
  min?: number
  unit?: string
  onChange: (value: number) => void
}

// Big +/- buttons are far easier to hit mid-workout than typing on a phone
// keyboard. The number itself is still editable by tapping it directly.
export default function Stepper({ label, value, step, min = 0, unit, onChange }: StepperProps) {
  const clamp = (v: number) => Math.max(min, Math.round(v * 100) / 100)

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-neutral-500 dark:text-neutral-400">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 text-2xl font-bold active:scale-95 transition"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
          className="w-20 text-center text-3xl font-bold bg-transparent focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 text-2xl font-bold active:scale-95 transition"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
      {unit && <span className="text-xs text-neutral-400">{unit}</span>}
    </div>
  )
}
