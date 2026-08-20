import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EXERCISES } from '../lib/exercises'
import { fetchFinishedWorkouts, saveWorkout, type SetToSave } from '../lib/queries'
import { computeAllTimeBests, computeLastPerformance, type BestSet } from '../lib/stats'
import { loadDraft, saveDraft, clearDraft } from '../lib/draft'
import { sendNotification } from '../lib/notify'
import Stepper from '../components/Stepper'
import RestTimer from '../components/RestTimer'
import PrCelebration from '../components/PrCelebration'

const WARMUP_ITEMS = [
  'Wrist circles — a few turns each way',
  'Arm circles — 10 forward, 10 back',
  'Jumping jacks — 40 reps',
  'Dynamic hip lunges — 8–10 per side',
  'Cat-Cow stretch — 8–10 slow reps',
]

function isPr(exerciseBest: BestSet | undefined, weight: number, reps: number): boolean {
  if (!exerciseBest) return false
  return weight > exerciseBest.weight || (weight === exerciseBest.weight && reps > exerciseBest.reps)
}

export default function Workout() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [resumeAvailable, setResumeAvailable] = useState(false)

  const [phase, setPhase] = useState<'warmup' | 'lifting' | 'saving'>('warmup')
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString())
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [sets, setSets] = useState<SetToSave[]>([])
  const [allTimeBests, setAllTimeBests] = useState<Record<number, BestSet>>({})
  const [lastPerformance, setLastPerformance] = useState<Record<number, BestSet>>({})

  const [weightInput, setWeightInput] = useState(20)
  const [repsInput, setRepsInput] = useState(10)
  const [restSeconds, setRestSeconds] = useState<number | null>(null)
  const [restKey, setRestKey] = useState(0)
  const [celebration, setCelebration] = useState<string | null>(null)
  const [warmupChecked, setWarmupChecked] = useState<boolean[]>(WARMUP_ITEMS.map(() => false))
  const [saveError, setSaveError] = useState<string | null>(null)

  const exercise = EXERCISES[exerciseIndex]

  // Load history for PR comparisons + suggested starting weights, and check
  // for an unfinished workout draft.
  useEffect(() => {
    fetchFinishedWorkouts()
      .then((workouts) => {
        setAllTimeBests(computeAllTimeBests(workouts))
        setLastPerformance(computeLastPerformance(workouts))
      })
      .catch(() => {
        // No history available (offline?) — PR detection just won't fire
        // this session, and starting weights fall back to defaults.
      })
      .finally(() => setLoading(false))

    const draft = loadDraft()
    if (draft && draft.sets.length > 0) {
      setResumeAvailable(true)
    }
  }, [])

  // Default the input fields to "last time's" numbers whenever the current
  // exercise changes, so logging a set is often just a single tap.
  useEffect(() => {
    const last = lastPerformance[exercise.id]
    setWeightInput(last?.weight ?? 20)
    setRepsInput(last ? last.reps : exercise.repsMax)
  }, [exerciseIndex, lastPerformance, exercise.id, exercise.repsMax])

  function resumeDraft() {
    const draft = loadDraft()
    if (!draft) return
    setStartedAt(draft.startedAt)
    setExerciseIndex(draft.exerciseIndex)
    setSets(draft.sets)
    setPhase('lifting')
    setResumeAvailable(false)
  }

  function discardDraft() {
    clearDraft()
    setResumeAvailable(false)
  }

  const currentExerciseSets = sets.filter((s) => s.exercise_id === exercise.id)
  const targetReached = currentExerciseSets.length >= exercise.setsTarget

  function handleLogSet() {
    const setNumber = currentExerciseSets.length + 1
    const priorBest = allTimeBests[exercise.id]
    const setIsPr = isPr(priorBest, weightInput, repsInput)

    const newSet: SetToSave = {
      exercise_id: exercise.id,
      set_number: setNumber,
      weight_kg: weightInput,
      reps: repsInput,
      is_pr: setIsPr,
    }
    const newSets = [...sets, newSet]
    setSets(newSets)
    saveDraft({ startedAt, exerciseIndex, sets: newSets })

    if (setIsPr) {
      setAllTimeBests((prev) => ({ ...prev, [exercise.id]: { weight: weightInput, reps: repsInput } }))
      setCelebration(`${exercise.name}: ${weightInput} kg × ${repsInput}`)
      sendNotification(
        '🏆 New PR!',
        `Dad just hit a PR on ${exercise.name}: ${weightInput} kg × ${repsInput}`,
        'trophy',
      )
    }

    setRestSeconds(exercise.restSeconds)
    setRestKey((k) => k + 1)
  }

  function handleRemoveLastSet() {
    const newSets = sets.slice(0, -1)
    setSets(newSets)
    saveDraft({ startedAt, exerciseIndex, sets: newSets })
  }

  function goToExercise(index: number) {
    setExerciseIndex(index)
    saveDraft({ startedAt, exerciseIndex: index, sets })
  }

  async function handleFinish() {
    setPhase('saving')
    setSaveError(null)
    try {
      await saveWorkout(startedAt, sets)
      const prCount = sets.filter((s) => s.is_pr).length
      sendNotification(
        '✅ Workout logged',
        `Dad finished a workout — ${sets.length} sets${prCount ? `, ${prCount} PR${prCount > 1 ? 's' : ''} 🏆` : ''}.`,
        prCount ? 'trophy' : 'muscle',
      )
      clearDraft()
      navigate('/progress', { state: { justSaved: true } })
    } catch {
      setSaveError("Couldn't save — check your internet connection and try again.")
      setPhase('lifting')
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-neutral-400">
        Loading…
      </div>
    )
  }

  if (resumeAvailable) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-6">
        <div className="max-w-sm w-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 text-center">
          <p className="text-lg font-semibold mb-1">Unfinished workout found</p>
          <p className="text-neutral-500 dark:text-neutral-400 mb-5">Pick up where you left off, or start fresh.</p>
          <button
            onClick={resumeDraft}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold mb-2"
          >
            Resume
          </button>
          <button onClick={discardDraft} className="w-full py-3 rounded-xl text-neutral-500">
            Start over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
      <div className="max-w-md mx-auto px-6 py-6 flex flex-col gap-6">
        <button onClick={() => navigate('/')} className="text-neutral-400 self-start">
          ← Exit
        </button>

        {phase === 'warmup' && (
          <div className="flex flex-col gap-5">
            <h1 className="text-2xl font-bold">Warm-up</h1>
            <p className="text-neutral-500 dark:text-neutral-400 -mt-3">
              Bike ride to the gym already warmed up your legs. Do these before your first set:
            </p>
            <ul className="flex flex-col gap-3">
              {WARMUP_ITEMS.map((item, i) => (
                <li key={item}>
                  <button
                    onClick={() =>
                      setWarmupChecked((prev) => prev.map((c, idx) => (idx === i ? !c : c)))
                    }
                    className="w-full flex items-center gap-3 text-left p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                  >
                    <span
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        warmupChecked[i]
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                    >
                      {warmupChecked[i] && '✓'}
                    </span>
                    <span className={warmupChecked[i] ? 'line-through text-neutral-400' : ''}>{item}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-sm text-neutral-400">
              Also: before each exercise, do one light warm-up set (empty bar / lightest setting) for ~10 reps before your working weight.
            </p>
            <button
              onClick={() => setPhase('lifting')}
              className="w-full py-5 rounded-2xl bg-blue-600 text-white text-xl font-bold mt-2"
            >
              Start Lifting
            </button>
          </div>
        )}

        {phase !== 'warmup' && (
          <>
            <div className="flex items-center justify-center gap-2">
              {EXERCISES.map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => i <= exerciseIndex && goToExercise(i)}
                  className={`w-2.5 h-2.5 rounded-full transition ${
                    i === exerciseIndex
                      ? 'bg-blue-600 scale-125'
                      : sets.some((s) => s.exercise_id === e.id)
                        ? 'bg-blue-300'
                        : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                  aria-label={e.name}
                />
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm text-neutral-400">
                Exercise {exerciseIndex + 1} of {EXERCISES.length}
              </p>
              <h1 className="text-2xl font-bold mt-1">{exercise.name}</h1>
              <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                Target: {exercise.setsTarget} sets × {exercise.repsMin === exercise.repsMax ? exercise.repsMax : `${exercise.repsMin}–${exercise.repsMax}`} reps
              </p>
              {lastPerformance[exercise.id] && (
                <p className="text-sm text-blue-500 mt-1">
                  Last time: {lastPerformance[exercise.id].weight} kg × {lastPerformance[exercise.id].reps}
                </p>
              )}
            </div>

            {currentExerciseSets.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {currentExerciseSets.map((s) => (
                  <span
                    key={s.set_number}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      s.is_pr
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    {s.is_pr && '🏆 '}
                    {s.weight_kg} kg × {s.reps}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-center gap-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 py-6">
              <Stepper label="Weight" value={weightInput} step={2.5} unit="kg" onChange={setWeightInput} />
              <Stepper label="Reps" value={repsInput} step={1} unit="reps" onChange={setRepsInput} />
            </div>

            <button
              onClick={handleLogSet}
              className="w-full py-5 rounded-2xl bg-blue-600 text-white text-xl font-bold active:scale-[0.98] transition"
            >
              Log Set
            </button>

            {currentExerciseSets.length > 0 && (
              <button onClick={handleRemoveLastSet} className="text-sm text-neutral-400 -mt-3">
                Undo last set
              </button>
            )}

            {targetReached && (
              <div className="flex flex-col gap-3 mt-2">
                {exerciseIndex < EXERCISES.length - 1 ? (
                  <button
                    onClick={() => goToExercise(exerciseIndex + 1)}
                    className="w-full py-4 rounded-2xl bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white font-semibold"
                  >
                    Next Exercise →
                  </button>
                ) : (
                  <button
                    onClick={handleFinish}
                    disabled={phase === 'saving'}
                    className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-semibold disabled:opacity-60"
                  >
                    {phase === 'saving' ? 'Saving…' : 'Finish Workout 🎉'}
                  </button>
                )}
              </div>
            )}

            {saveError && <p className="text-sm text-red-500 text-center">{saveError}</p>}
          </>
        )}
      </div>

      {restSeconds !== null && (
        <RestTimer
          key={restKey}
          seconds={restSeconds}
          onDone={() => setRestSeconds(null)}
          onSkip={() => setRestSeconds(null)}
        />
      )}

      {celebration && <PrCelebration message={celebration} onDone={() => setCelebration(null)} />}
    </div>
  )
}
