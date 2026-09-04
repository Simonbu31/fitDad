import { useEffect, useState } from 'react'
import {
  EXERCISES,
  exerciseById,
  SUPERSET_PAIRS,
  SUPERSET_SHORT_REST,
  SUPERSET_LONG_REST,
  FINISHER_EXERCISE_ID,
} from '../lib/exercises'
import { fetchFinishedWorkouts, fetchNotifyTopic, saveWorkout, type SetToSave } from '../lib/queries'
import { computeAllTimeBests, computeLastPerformance, type BestSet } from '../lib/stats'
import { loadDraft, saveDraft, clearDraft, type WorkoutMode } from '../lib/draft'
import { sendNotification } from '../lib/notify'
import Stepper from '../components/Stepper'
import RestTimer from '../components/RestTimer'
import PrCelebration from '../components/PrCelebration'

type WorkoutProps = {
  userId: string
  onExit: () => void
  onFinish: () => void
}

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

export default function Workout({ userId, onExit, onFinish }: WorkoutProps) {
  const [loading, setLoading] = useState(true)
  const [resumeAvailable, setResumeAvailable] = useState(false)
  const [notifyTopic, setNotifyTopic] = useState<string | null>(null)

  const [phase, setPhase] = useState<'warmup' | 'lifting' | 'saving'>('warmup')
  const [mode, setMode] = useState<WorkoutMode>('straight')
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString())
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [pairIndex, setPairIndex] = useState(0)
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

  // --- straight-sets derived state ---
  const straightExercise = EXERCISES[exerciseIndex]
  const straightSets = sets.filter((s) => s.exercise_id === straightExercise.id)
  const straightTargetReached = straightSets.length >= straightExercise.setsTarget

  // --- superset derived state ---
  // pairIndex counts through the 3 real pairs, then one more step for the
  // finisher (bicep curls) done solo at the end, not part of any pair.
  const inFinisher = mode === 'superset' && pairIndex === SUPERSET_PAIRS.length
  const pair = SUPERSET_PAIRS[pairIndex]
  const exerciseA = pair ? exerciseById(pair[0])! : null
  const exerciseB = pair ? exerciseById(pair[1])! : null
  const setsForA = exerciseA ? sets.filter((s) => s.exercise_id === exerciseA.id).length : 0
  const setsForB = exerciseB ? sets.filter((s) => s.exercise_id === exerciseB.id).length : 0
  const aDone = exerciseA ? setsForA >= exerciseA.setsTarget : true
  const bDone = exerciseB ? setsForB >= exerciseB.setsTarget : true
  // A goes first each round; once A catches up to (or passes) B for this
  // round, it's B's turn — this is what makes it alternate A,B,A,B,... instead
  // of finishing all of A before starting B.
  const nextInPair: 'A' | 'B' | null = !aDone && setsForA <= setsForB ? 'A' : !bDone ? 'B' : null
  const pairRounds = exerciseA && exerciseB ? Math.max(exerciseA.setsTarget, exerciseB.setsTarget) : 0
  const activeRoundNumber = nextInPair === 'A' ? setsForA + 1 : nextInPair === 'B' ? setsForB + 1 : pairRounds
  const supersetPairComplete = mode === 'superset' && !inFinisher && aDone && bDone

  const finisherExercise = exerciseById(FINISHER_EXERCISE_ID)!
  const finisherSets = sets.filter((s) => s.exercise_id === finisherExercise.id)
  const finisherDone = finisherSets.length >= finisherExercise.setsTarget

  // The exercise the Log Set button currently acts on, in either mode.
  const activeExercise =
    mode === 'superset'
      ? inFinisher
        ? finisherDone
          ? null
          : finisherExercise
        : nextInPair === 'A'
          ? exerciseA
          : nextInPair === 'B'
            ? exerciseB
            : null
      : straightExercise
  const activeSets = activeExercise ? sets.filter((s) => s.exercise_id === activeExercise.id) : []

  const targetReached = mode === 'superset' ? (inFinisher ? finisherDone : supersetPairComplete) : straightTargetReached
  const isLastStep = mode === 'straight' ? exerciseIndex === EXERCISES.length - 1 : inFinisher
  const nextStepIsFinisher = mode === 'superset' && pairIndex === SUPERSET_PAIRS.length - 1

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

    fetchNotifyTopic(userId)
      .then(setNotifyTopic)
      .catch(() => {
        // Notifications just won't fire this session — non-critical.
      })

    const draft = loadDraft()
    if (draft && draft.sets.length > 0) {
      setResumeAvailable(true)
    }
  }, [userId])

  // Default the input fields to "last time's" numbers whenever the active
  // exercise changes, so logging a set is often just a single tap.
  useEffect(() => {
    if (!activeExercise) return
    const last = lastPerformance[activeExercise.id]
    setWeightInput(last?.weight ?? 20)
    setRepsInput(last ? last.reps : activeExercise.repsMax)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExercise?.id, lastPerformance])

  function resumeDraft() {
    const draft = loadDraft()
    if (!draft) return
    setStartedAt(draft.startedAt)
    setMode(draft.mode)
    setExerciseIndex(draft.exerciseIndex)
    setPairIndex(draft.pairIndex)
    setSets(draft.sets)
    setPhase('lifting')
    setResumeAvailable(false)
  }

  function discardDraft() {
    clearDraft()
    setResumeAvailable(false)
  }

  function handleLogSet() {
    if (!activeExercise) return
    const setNumber = activeSets.length + 1
    const priorBest = allTimeBests[activeExercise.id]
    const setIsPr = isPr(priorBest, weightInput, repsInput)

    const newSet: SetToSave = {
      exercise_id: activeExercise.id,
      set_number: setNumber,
      weight_kg: weightInput,
      reps: repsInput,
      is_pr: setIsPr,
    }
    const newSets = [...sets, newSet]
    setSets(newSets)
    saveDraft({ startedAt, mode, exerciseIndex, pairIndex, sets: newSets })

    if (setIsPr) {
      setAllTimeBests((prev) => ({ ...prev, [activeExercise.id]: { weight: weightInput, reps: repsInput } }))
      setCelebration(`${activeExercise.name}: ${weightInput} kg × ${repsInput}`)
      sendNotification(
        notifyTopic,
        '🏆 New PR!',
        `New PR on ${activeExercise.name}: ${weightInput} kg × ${repsInput}`,
        'trophy',
      )
    }

    if (mode === 'straight' || inFinisher) {
      setRestSeconds(activeExercise.restSeconds)
    } else {
      // Was the partner exercise still waiting on this same round? If so,
      // it's a quick switch; otherwise the round just finished.
      const partner = activeExercise.id === exerciseA?.id ? exerciseB : exerciseA
      const partnerCount = activeExercise.id === exerciseA?.id ? setsForB : setsForA
      const partnerStillPendingThisRound = partner ? partnerCount < setNumber && partnerCount < partner.setsTarget : false
      setRestSeconds(partnerStillPendingThisRound ? SUPERSET_SHORT_REST : SUPERSET_LONG_REST)
    }
    setRestKey((k) => k + 1)
  }

  function handleRemoveLastSet() {
    const newSets = sets.slice(0, -1)
    setSets(newSets)
    saveDraft({ startedAt, mode, exerciseIndex, pairIndex, sets: newSets })
  }

  function goToExercise(index: number) {
    setExerciseIndex(index)
    saveDraft({ startedAt, mode, exerciseIndex: index, pairIndex, sets })
  }

  function goToPair(index: number) {
    setPairIndex(index)
    saveDraft({ startedAt, mode, exerciseIndex, pairIndex: index, sets })
  }

  async function handleFinish() {
    setPhase('saving')
    setSaveError(null)
    try {
      await saveWorkout(startedAt, sets)
      const prCount = sets.filter((s) => s.is_pr).length
      sendNotification(
        notifyTopic,
        '✅ Workout logged',
        `Workout finished — ${sets.length} sets${prCount ? `, ${prCount} PR${prCount > 1 ? 's' : ''} 🏆` : ''}.`,
        prCount ? 'trophy' : 'muscle',
      )
      clearDraft()
      onFinish()
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
        <button onClick={onExit} className="text-neutral-400 self-start">
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

            <div className="mt-2">
              <p className="font-semibold mb-2">Feeling like a savage, or short on time?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('straight')}
                  className={`flex-1 py-3 rounded-xl border font-semibold text-sm ${
                    mode === 'straight'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                  }`}
                >
                  Straight Sets
                </button>
                <button
                  onClick={() => setMode('superset')}
                  className={`flex-1 py-3 rounded-xl border font-semibold text-sm ${
                    mode === 'superset'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                  }`}
                >
                  Supersets 🔥
                </button>
              </div>
              <p className="text-sm text-neutral-400 mt-2">
                {mode === 'straight'
                  ? 'One exercise at a time, full rest between sets — the classic way.'
                  : 'Pairs of exercises back-to-back with a short switch, longer rest between rounds. Faster and more intense.'}
              </p>
            </div>

            <button
              onClick={() => setPhase('lifting')}
              className="w-full py-5 rounded-2xl bg-blue-600 text-white text-xl font-bold mt-2"
            >
              Start Lifting
            </button>
          </div>
        )}

        {phase !== 'warmup' && mode === 'straight' && (
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
              <h1 className="text-2xl font-bold mt-1">{straightExercise.name}</h1>
              <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                Target: {straightExercise.setsTarget} sets ×{' '}
                {straightExercise.repsMin === straightExercise.repsMax
                  ? straightExercise.repsMax
                  : `${straightExercise.repsMin}–${straightExercise.repsMax}`}{' '}
                reps
              </p>
              {lastPerformance[straightExercise.id] && (
                <p className="text-sm text-blue-500 mt-1">
                  Last time: {lastPerformance[straightExercise.id].weight} kg × {lastPerformance[straightExercise.id].reps}
                </p>
              )}
            </div>

            {straightSets.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {straightSets.map((s) => (
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
          </>
        )}

        {phase !== 'warmup' && mode === 'superset' && (
          <div className="flex items-center justify-center gap-2">
            {SUPERSET_PAIRS.map((p, i) => (
              <button
                key={i}
                onClick={() => i <= pairIndex && goToPair(i)}
                className={`w-2.5 h-2.5 rounded-full transition ${
                  i === pairIndex
                    ? 'bg-blue-600 scale-125'
                    : p.some((id) => sets.some((s) => s.exercise_id === id))
                      ? 'bg-blue-300'
                      : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
                aria-label={`Superset ${i + 1}`}
              />
            ))}
            <button
              onClick={() => pairIndex >= SUPERSET_PAIRS.length && goToPair(SUPERSET_PAIRS.length)}
              className={`w-2.5 h-2.5 rounded-full transition ${
                inFinisher ? 'bg-blue-600 scale-125' : finisherSets.length > 0 ? 'bg-blue-300' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
              aria-label="Finisher"
            />
          </div>
        )}

        {phase !== 'warmup' && mode === 'superset' && exerciseA && exerciseB && (
          <>
            <div className="text-center">
              <p className="text-sm text-neutral-400">
                Superset {pairIndex + 1} of {SUPERSET_PAIRS.length}
                {!supersetPairComplete && ` · Round ${activeRoundNumber} of ${pairRounds}`}
              </p>
              <h1 className="text-xl font-bold mt-1">
                {exerciseA.name} + {exerciseB.name}
              </h1>
            </div>

            <div className="flex flex-col gap-3">
              {[exerciseA, exerciseB].map((ex) => {
                const exSets = sets.filter((s) => s.exercise_id === ex.id)
                const done = exSets.length >= ex.setsTarget
                const isActive = activeExercise?.id === ex.id
                return (
                  <div
                    key={ex.id}
                    className={`rounded-2xl border p-3 ${
                      isActive
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{ex.name}</p>
                      <p className="text-xs text-neutral-400">
                        {exSets.length}/{ex.setsTarget} sets{done ? ' ✓' : ''}
                      </p>
                    </div>
                    {exSets.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {exSets.map((s) => (
                          <span
                            key={s.set_number}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              s.is_pr
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-neutral-100 dark:bg-neutral-800'
                            }`}
                          >
                            {s.is_pr && '🏆 '}
                            {s.weight_kg}kg×{s.reps}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {phase !== 'warmup' && mode === 'superset' && inFinisher && (
          <>
            <div className="text-center">
              <p className="text-sm text-neutral-400">Finisher 💪</p>
              <h1 className="text-2xl font-bold mt-1">{finisherExercise.name}</h1>
              <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                Target: {finisherExercise.setsTarget} sets × {finisherExercise.repsMax} reps
              </p>
              {lastPerformance[finisherExercise.id] && (
                <p className="text-sm text-blue-500 mt-1">
                  Last time: {lastPerformance[finisherExercise.id].weight} kg × {lastPerformance[finisherExercise.id].reps}
                </p>
              )}
            </div>

            {finisherSets.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {finisherSets.map((s) => (
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
          </>
        )}

        {phase !== 'warmup' && activeExercise && (
          <>
            {mode === 'superset' && !inFinisher && (
              <p className="text-center text-sm text-neutral-400 -mb-2">Now: {activeExercise.name}</p>
            )}
            <div className="flex items-center justify-center gap-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 py-6">
              <Stepper label="Weight" value={weightInput} step={0.5} unit="kg" onChange={setWeightInput} />
              <Stepper label="Reps" value={repsInput} step={1} unit="reps" onChange={setRepsInput} />
            </div>

            <button
              onClick={handleLogSet}
              className="w-full py-5 rounded-2xl bg-blue-600 text-white text-xl font-bold active:scale-[0.98] transition"
            >
              Log Set
            </button>

            {sets.length > 0 && (
              <button onClick={handleRemoveLastSet} className="text-sm text-neutral-400 -mt-3">
                Undo last set
              </button>
            )}
          </>
        )}

        {phase !== 'warmup' && targetReached && (
          <div className="flex flex-col gap-3 mt-2">
            {!isLastStep ? (
              <button
                onClick={() => (mode === 'straight' ? goToExercise(exerciseIndex + 1) : goToPair(pairIndex + 1))}
                className="w-full py-4 rounded-2xl bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white font-semibold"
              >
                {mode === 'straight'
                  ? 'Next Exercise →'
                  : nextStepIsFinisher
                    ? 'Finisher: Bicep Curls →'
                    : 'Next Superset →'}
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

        {phase !== 'warmup' && saveError && <p className="text-sm text-red-500 text-center">{saveError}</p>}
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
