import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)

    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setSending(false)
    if (error) setError(error.message)
    // On success, AuthGate's onAuthStateChange listener picks up the new
    // session automatically — nothing else to do here.
  }

  return (
    <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Fit Dad 💪</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8">
          {mode === 'signin' ? 'Sign in to track your workouts' : 'Create your account'}
        </p>

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
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full py-4 px-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          <button
            type="submit"
            disabled={sending}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white text-lg font-bold disabled:opacity-60"
          >
            {sending ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError(null)
            }}
            className="text-sm text-neutral-400 mt-2"
          >
            {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
