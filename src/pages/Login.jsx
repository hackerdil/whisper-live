import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login({ onLogin }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    if (!username.trim() || !password) {
      setError('Please enter username and password.')
      return
    }

    onLogin(username)
    navigate('/', { replace: true })
  }

  return (
    <section id="main-content" className="placeholder-page login-page">
      <p className="eyebrow">Authentication</p>
      <h1>Login</h1>
      <p>Use your username and password to continue to the dashboard.</p>

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="login-field" htmlFor="username">
          Username
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
        </label>

        <label className="login-field" htmlFor="password">
          Password
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="playback-button">
          Sign in
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => setError('THWS login is not yet active.')}
        >
          THWS Login
        </button>
      </form>
    </section>
  )
}

export default Login
