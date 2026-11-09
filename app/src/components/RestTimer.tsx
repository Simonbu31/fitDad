import { useEffect, useRef, useState } from 'react'

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    // Browsers auto-suspend an AudioContext after the page has been
    // backgrounded (e.g. screen lock) — resume() is a no-op when it's
    // already running, but without it the beep can silently not play.
    void ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch {
    // ignore — audio isn't critical
  }
  if (navigator.vibrate) navigator.vibrate([200, 100, 200])
}

// Keeps the screen from auto-dimming/locking while resting, so the in-page
// countdown and beep actually get to run instead of being suspended by the
// OS mid-rest. Best-effort: unsupported browsers just skip it, and the
// scheduled push notification (see Workout.tsx) is the fallback for when the
// dad locks the screen manually, which no web API can prevent.
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    navigator.wakeLock.request('screen').then((l) => {
      if (cancelled) l.release()
      else lock = l
    }).catch(() => {})
    return () => {
      cancelled = true
      lock?.release().catch(() => {})
    }
  }, [active])
}

type RestTimerProps = {
  seconds: number
  onDone: () => void
  onSkip: () => void
  // Cancels the scheduled push notification (see Workout.tsx) — called
  // whenever this timer goes away, for any reason. If the deadline already
  // passed while the app was foregrounded here, the push hasn't fired yet
  // and this cancel prevents the dad from hearing it twice; if it already
  // fired while the app was backgrounded, canceling now is a harmless no-op.
  onCancelPing: () => void
}

export default function RestTimer({ seconds, onDone, onSkip, onCancelPing }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds)
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const cancelPingRef = useRef(onCancelPing)
  cancelPingRef.current = onCancelPing
  // Anchored to a wall-clock end time (not decremented by 1 each tick) so a
  // throttled/delayed setTimeout — which happens whenever the screen dims or
  // the tab backgrounds — self-corrects instead of drifting or stalling.
  const endTimeRef = useRef(0)
  // True once we've noticed (via visibilitychange) that the rest period
  // ended while the screen was off/backgrounded — in that case the
  // scheduled push already covered the ding, so the local beep is skipped
  // to avoid a double ding once the dad unlocks the phone.
  const expiredWhileHiddenRef = useRef(false)

  useEffect(() => {
    endTimeRef.current = Date.now() + seconds * 1000
    expiredWhileHiddenRef.current = false
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) {
      if (!expiredWhileHiddenRef.current) playBeep()
      doneRef.current()
      return
    }
    const t = setTimeout(() => {
      setRemaining(Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000)))
    }, 1000)
    return () => clearTimeout(t)
  }, [remaining])

  useEffect(() => {
    // Catches up immediately on return from background instead of waiting
    // for the next 1s tick, which can itself be delayed after a long sleep.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const left = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
      if (left <= 0) expiredWhileHiddenRef.current = true
      setRemaining(left)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // Runs once, on unmount — covers natural completion, skip, and the
  // component being torn down for any other reason.
  useEffect(() => {
    return () => cancelPingRef.current()
  }, [])

  useWakeLock(remaining > 0)

  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60
  const progress = 1 - remaining / seconds

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 gap-6 px-6">
      <p className="text-white/70 text-lg">Rest</p>
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-bold tabular-nums">
          {mm}:{ss.toString().padStart(2, '0')}
        </div>
      </div>
      <button
        onClick={onSkip}
        className="text-white/70 underline text-lg py-2 px-4"
      >
        Skip rest
      </button>
    </div>
  )
}
