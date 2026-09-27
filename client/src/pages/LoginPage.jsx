import { useState } from 'react'
import { loginUser, normalizeUser } from '../api'
import '../styles/DashboardPage.css'

function LoginPage({ onLogin }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const result = await loginUser(identifier, password)
      onLogin({
        token: result.token,
        user: normalizeUser(result.data),
        mustChangePassword: result.mustChangePassword,
      })
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">TechDesk 360</p>
        <h1 className="page-title">Sign in</h1>
        <p className="page-subtitle">Use your Domain ID or email address.</p>
        <label className="form-field">
          <span>Domain ID or email</span>
          <input
            autoComplete="username"
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
        </label>
        <label className="form-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button className="primary-btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}

export default LoginPage
