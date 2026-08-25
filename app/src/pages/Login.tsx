import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { authRedirectUrl } from '../lib/platform'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Secondary path, off by default: Apple/Google app-store reviewers can't
  // click an emailed link (no inbox access), so they need a fixed
  // email+password account to test the app. Regular users never see a
  // reason to use this — the magic link above stays the primary flow.
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)

    const { error } = usePassword
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: authRedirectUrl() },
        })

    setSending(false)
    if (error) {
      setError(error.message)
    } else if (!usePassword) {
      setSent(true)
    }
  }

  return (
    <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Fit Dad 💪</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8">
          {sent ? 'Check your email' : 'Sign in to track your workouts'}
        </p>

        {sent ? (
          <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6">
            <p>
              We sent a sign-in link to <span className="font-medium">{email}</span>. Open it on this
              device to continue.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-blue-600 dark:text-blue-400 font-medium mt-4"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              autoFocus
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-4 px-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            {usePassword && (
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-4 px-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full py-4 rounded-2xl bg-blue-600 text-white text-lg font-bold disabled:opacity-60"
            >
              {sending ? 'Signing in…' : usePassword ? 'Sign in' : 'Send me a sign-in link'}
            </button>
            {error && <p className="text-sm text-red-500">{error}</p>}

            {usePassword ? (
              <button
                type="button"
                onClick={() => setUsePassword(false)}
                className="text-xs text-neutral-400 mt-1"
              >
                Use a sign-in link instead
              </button>
            ) : (
              <>
                <p className="text-xs text-neutral-400 mt-2">
                  No password needed — we'll email you a link that signs you in.
                </p>
                <button
                  type="button"
                  onClick={() => setUsePassword(true)}
                  className="text-xs text-neutral-400 underline"
                >
                  Have a password? Use it instead
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
