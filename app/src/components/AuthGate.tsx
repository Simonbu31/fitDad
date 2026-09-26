import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import Login from '../pages/Login'
import ResetPassword from '../pages/ResetPassword'

type AuthGateProps = {
  children: (session: Session) => ReactNode
}

// undefined = still checking, null = signed out, Session = signed in
export default function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  // Clicking a password-reset email link lands back here with a valid
  // session (Supabase signs the user in as part of the recovery flow), but
  // they still need to pick a new password before going any further — so
  // this is tracked separately from `session` and takes priority below.
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-neutral-400">
        Loading…
      </div>
    )
  }

  if (recovery) {
    return <ResetPassword onDone={() => setRecovery(false)} />
  }

  if (session === null) {
    return <Login />
  }

  return <>{children(session)}</>
}
