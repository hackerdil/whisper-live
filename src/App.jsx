import { Navigate, Route, Routes } from 'react-router-dom'
import Navigation from './components/Navigation.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Results from './pages/Results.jsx'
import SharedFiles from './pages/SharedFiles.jsx'
import Transcribe from './pages/Transcribe.jsx'

function App() {
  return (
    <div className="app-shell">
      <Navigation />
      <main className="page-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/transcribe" element={<Transcribe />} />
          <Route path="/results" element={<Results />} />
          <Route path="/shared" element={<SharedFiles />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
