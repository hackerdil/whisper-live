import { useState } from 'react'
import Navigation from './components/Navigation.jsx'
import Login from './pages/Login.jsx'
import Results from './pages/Results.jsx'
import SharedFiles from './pages/SharedFiles.jsx'
import Transcribe from './pages/Transcribe.jsx'

const pages = {
  login: Login,
  transcribe: Transcribe,
  results: Results,
  shared: SharedFiles,
}

function App() {
  const [activePage, setActivePage] = useState('login')
  const ActivePage = pages[activePage]

  return (
    <div className="app-shell">
      <Navigation activePage={activePage} onNavigate={setActivePage} />
      <main className="page-container">
        <ActivePage />
      </main>
    </div>
  )
}

export default App

