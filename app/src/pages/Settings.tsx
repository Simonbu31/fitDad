import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchNotifyTopic, saveNotifyTopic } from '../lib/queries'
import { generateTopic } from '../lib/notify'

type SettingsProps = {
  userId: string
  userEmail: string | undefined
  onBack: () => void
}

export default function Settings({ userId, userEmail, onBack }: SettingsProps) {
  const [topic, setTopic] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchNotifyTopic(userId)
      .then(setTopic)
      .finally(() => setLoading(false))
  }, [userId])

  async function handleEnable() {
    const newTopic = generateTopic()
    setTopic(newTopic)
    await saveNotifyTopic(userId, newTopic)
    setSaved(true)
  }

  async function handleDisable() {
    setTopic(null)
    await saveNotifyTopic(userId, null)
  }

  return (
    <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
      <div className="max-w-md mx-auto px-6 py-6 flex flex-col gap-5">
        <button onClick={onBack} className="text-neutral-400 self-start">
          ← Home
        </button>
        <h1 className="text-2xl font-bold">Settings</h1>

        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Signed in as</p>
          <p className="font-medium">{userEmail}</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4">
          <p className="font-semibold mb-1">Notifications</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Get a push notification on your own phone whenever you finish a workout or hit a personal
            record.
          </p>

          {loading ? (
            <p className="text-neutral-400 text-sm">Loading…</p>
          ) : topic ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm">
                Notifications are <span className="text-emerald-600 dark:text-emerald-400 font-medium">on</span>.
                Subscribe to this topic in the{' '}
                <a
                  href="https://ntfy.sh/app"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline"
                >
                  ntfy app
                </a>{' '}
                (iOS/Android) or at ntfy.sh/app:
              </p>
              <code className="block text-center py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-mono text-sm break-all">
                {topic}
              </code>
              <button onClick={handleDisable} className="text-sm text-neutral-400">
                Turn off notifications
              </button>
            </div>
          ) : (
            <button
              onClick={handleEnable}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold"
            >
              Enable notifications
            </button>
          )}
          {saved && <p className="text-xs text-neutral-400 mt-2">Saved.</p>}
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          className="text-red-500 font-medium mt-2"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
