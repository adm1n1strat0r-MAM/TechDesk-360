import ProfileButton from './ProfileButton'

function PageHeader({ title, subtitle, eyebrow = 'Operations' }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="page-title">{title}</h2>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      <ProfileButton />
    </header>
  )
}

export default PageHeader
