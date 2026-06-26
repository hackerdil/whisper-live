import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Navigation from './components/Navigation.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Results from './pages/Results.jsx'
import SharedFiles from './pages/SharedFiles.jsx'
import Transcribe from './pages/Transcribe.jsx'

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('whisper-user'))
    } catch {
      return null
    }
  })

  function handleLogin(username) {
    const safeName = username.trim()
    const nextUser = {
      name: safeName || 'User',
      email: `${safeName.toLowerCase().replaceAll(' ', '')}@example.com`,
    }

    localStorage.setItem('whisper-user', JSON.stringify(nextUser))
    setUser(nextUser)
  }

  function handleLogout() {
    localStorage.removeItem('whisper-user')
    setUser(null)
  }

  return (
    <div className="app-shell">
      <Navigation user={user} onLogout={handleLogout} />
      <main className="page-container">
        <Routes>
          <Route
            path="/"
            element={
              user ? <Home user={user} /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/login"
            element={
              user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
            }
          />
          <Route
            path="/transcribe"
            element={user ? <Transcribe /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/results"
            element={user ? <Results /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/shared"
            element={user ? <SharedFiles /> : <Navigate to="/login" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
