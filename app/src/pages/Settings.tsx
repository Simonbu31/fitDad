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

  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError(null)
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' })
    if (error) {
      setDeleting(false)
      setDeleteError("Couldn't delete your account — check your internet connection and try again.")
      return
    }
    // Account + all workout data are gone server-side; drop the local
    // session so the app returns to the sign-in screen.
    await supabase.auth.signOut()
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

        <div className="rounded-2xl border border-red-200 dark:border-red-900 p-4 mt-4">
          <p className="font-semibold text-red-600 dark:text-red-400 mb-1">Delete account</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
            Permanently deletes your account and every workout you've logged. This can't be undone.
          </p>

          {!confirmingDelete ? (
            <button onClick={() => setConfirmingDelete(true)} className="text-sm text-red-500 font-medium">
              Delete my account
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Are you sure? This deletes everything.</p>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Yes, delete everything'}
              </button>
              <button onClick={() => setConfirmingDelete(false)} className="text-sm text-neutral-400">
                Cancel
              </button>
              {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
            </div>
          )}
        </div>

        <a
          href="https://simonbu31.github.io/fitDad/privacy.html"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-neutral-400 text-center underline mt-2"
        >
          Privacy Policy
        </a>
      </div>
    </div>
  )
}
