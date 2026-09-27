import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth-context'
import '../../styles/ProfileButton.css'

function ProfileButton() {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const { user, onNavigate, onLogout } = useAuth()
  const initials = (user?.fullName || 'User')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div className="profile-menu-wrapper" ref={containerRef}>
      <button
        type="button"
        className="profile-badge"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="profile-avatar">{initials}</div>

        <div className="profile-copy">
          <p className="profile-name">{user?.fullName}</p>
          <p className="profile-role">{user?.role}</p>
        </div>

        <span className="profile-chevron" aria-hidden="true">
          <ChevronIcon />
        </span>
      </button>

      {isOpen && (
        <div className="profile-dropdown" role="menu" aria-label="Profile menu">
          {[
            { label: 'My Profile', action: () => onNavigate('profile') },
            { label: 'Change Password', action: () => onNavigate('change-password') },
            { label: 'Sign out', action: onLogout },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className="profile-dropdown-item"
              onClick={() => {
                setIsOpen(false)
                item.action()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 10.5 12 15l5-4.5-1.4-1.4L12 12.2l-3.6-3.1L7 10.5Z" />
    </svg>
  )
}

export default ProfileButton
