import { useState } from 'react'
import { changePassword, updateProfile } from '../api'
import PageHeader from '../components/common/PageHeader'
import '../styles/DashboardPage.css'

export function ProfilePage({ user, onUpdated }) {
  const [form, setForm] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      const updatedUser = await updateProfile(form)
      onUpdated(updatedUser)
      setMessage('Profile updated.')
    } catch (updateError) {
      setError(updateError.message)
    }
  }

  return (
    <main className="content-panel">
      <PageHeader title="My Profile" subtitle="Update your account details" />
      <section className="panel-card">
        <form className="crud-form" onSubmit={submit}>
          <div className="form-grid">
            <label className="form-field">
              <span>Full name</span>
              <input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
            </label>
            <label className="form-field">
              <span>Email</span>
              <input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label className="form-field">
              <span>IP phone</span>
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            <label className="form-field">
              <span>Role</span>
              <input value={user.role} readOnly />
            </label>
          </div>
          <div className="form-actions"><button type="submit" className="primary-btn">Save Profile</button></div>
          {message && <p role="status">{message}</p>}
          {error && <p role="alert">{error}</p>}
        </form>
      </section>
    </main>
  )
}

export function PasswordPage({ onComplete, forced = false }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    try {
      await changePassword(form.currentPassword, form.newPassword)
      setMessage('Password changed successfully.')
      onComplete()
    } catch (changeError) {
      setError(changeError.message)
    }
  }

  return (
    <main className="content-panel">
      {!forced && <PageHeader title="Change Password" subtitle="Choose a new password for your account" />}
      <section className="panel-card">
        <form className="crud-form" onSubmit={submit}>
          {forced && <><p className="eyebrow">First sign in</p><h2 className="page-title">Change your temporary password</h2><p className="page-subtitle">You must set a new password before continuing.</p></>}
          <div className="form-grid">
            <label className="form-field"><span>Current password</span><input type="password" autoComplete="current-password" required value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} /></label>
            <label className="form-field"><span>New password (10 characters minimum)</span><input type="password" autoComplete="new-password" minLength="10" required value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} /></label>
            <label className="form-field"><span>Confirm new password</span><input type="password" autoComplete="new-password" minLength="10" required value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></label>
          </div>
          <div className="form-actions"><button className="primary-btn" type="submit">Update Password</button></div>
          {message && <p role="status">{message}</p>}
          {error && <p role="alert">{error}</p>}
        </form>
      </section>
    </main>
  )
}
