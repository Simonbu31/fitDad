import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import Login from '../pages/Login'

type AuthGateProps = {
  children: (session: Session) => ReactNode
}

// undefined = still checking, null = signed out, Session = signed in
export default function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-neutral-400">
        Loading…
      </div>
    )
  }

  if (session === null) {
    return <Login />
  }

  return <>{children(session)}</>
}
