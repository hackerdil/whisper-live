import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login({ onLogin }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    if (!username.trim()) {
      setError('Please enter your name or username.')
      return
    }

    onLogin(username)
    navigate('/', { replace: true })
  }

  return (
    <section id="main-content" className="placeholder-page login-page">
      <div className="login-brand-mark" aria-hidden="true">
        W
      </div>
      <div className="login-heading">
        <p className="eyebrow">Welcome to Whisper Notes</p>
        <h1>Welcome back</h1>
        <p>Enter your name or username to open your personal workspace.</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="login-field" htmlFor="username">
          Name or username
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value)
              setError('')
            }}
            autoComplete="username"
            autoFocus
            placeholder="e.g. Taylan"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="playback-button">
          Open my workspace
        </button>
      </form>

      <p className="login-note">
        No password needed. Your saved transcriptions stay connected to this username
        on this device.
      </p>
    </section>
  )
}

export default Login
