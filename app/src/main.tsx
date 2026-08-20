import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import Workout from './pages/Workout'
import Progress from './pages/Progress'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* HashRouter so refreshes/deep-links work on GitHub Pages without server-side routing config */}
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workout" element={<Workout />} />
        <Route path="/progress" element={<Progress />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
