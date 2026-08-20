import { useState } from 'react'
import AuthGate from './components/AuthGate'
import Home from './pages/Home'
import Workout from './pages/Workout'
import Progress from './pages/Progress'
import Settings from './pages/Settings'

type View = 'home' | 'workout' | 'progress' | 'settings'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [justSaved, setJustSaved] = useState(false)

  return (
    <AuthGate>
      {(session) => {
        const userId = session.user.id

        switch (view) {
          case 'workout':
            return (
              <Workout
                userId={userId}
                onExit={() => setView('home')}
                onFinish={() => {
                  setJustSaved(true)
                  setView('progress')
                }}
              />
            )
          case 'progress':
            return (
              <Progress
                justSaved={justSaved}
                onHome={() => {
                  setJustSaved(false)
                  setView('home')
                }}
                onStartWorkout={() => {
                  setJustSaved(false)
                  setView('workout')
                }}
              />
            )
          case 'settings':
            return <Settings userId={userId} userEmail={session.user.email} onBack={() => setView('home')} />
          default:
            return (
              <Home
                onStartWorkout={() => setView('workout')}
                onViewProgress={() => setView('progress')}
                onSettings={() => setView('settings')}
              />
            )
        }
      }}
    </AuthGate>
  )
}
