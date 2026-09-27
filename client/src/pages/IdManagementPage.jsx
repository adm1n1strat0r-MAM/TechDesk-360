import PageHeader from '../components/common/PageHeader'
import '../styles/DashboardPage.css'

function IdManagementPage({
  title = 'ID Management',
  subtitle = 'Overview',
  userCount = 0,
  roleCount = 0,
}) {
  return (
    <main className="content-panel">
      <PageHeader title={title} subtitle={subtitle} />

      <section className="stats-grid">
        <article className="stat-card stat-card--teal">
          <div className="stat-header"><span className="stat-label">User records</span><span className="stat-trend">Local</span></div>
          <div className="stat-value">{userCount}</div>
          <div className="stat-detail">Employee ID records</div>
        </article>
        <article className="stat-card stat-card--blue">
          <div className="stat-header"><span className="stat-label">Configured roles</span><span className="stat-trend">Access</span></div>
          <div className="stat-value">{roleCount}</div>
          <div className="stat-detail">Role permission groups</div>
        </article>
        <article className="stat-card stat-card--purple">
          <div className="stat-header"><span className="stat-label">Site options</span><span className="stat-trend">Manage</span></div>
          <div className="stat-value">10</div>
          <div className="stat-detail">Options available in role access</div>
        </article>
      </section>

      <section className="panel-card overview-panel">
        <div className="panel-header"><div><p className="eyebrow">Overview</p><h3>ID management areas</h3></div></div>
        <div className="overview-section-grid">
          <div className="overview-section-card"><div className="overview-section-card__top"><span>New User</span><strong>01</strong></div><small>Create an employee record and assign a role.</small></div>
          <div className="overview-section-card"><div className="overview-section-card__top"><span>Users Details</span><strong>{userCount}</strong></div><small>Search users and enable or disable records.</small></div>
          <div className="overview-section-card"><div className="overview-section-card__top"><span>Role Management</span><strong>{roleCount}</strong></div><small>Set which site options each role can access.</small></div>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel-card panel-card--wide">
          <div className="panel-header"><div><p className="eyebrow">Access setup</p><h3>Role based site access</h3></div></div>
          <div className="timeline">
            <div className="timeline-item"><span className="timeline-dot" /><div><p className="timeline-title">Create an employee ID record</p><p className="timeline-meta">Assign the employee to a configured role.</p></div></div>
            <div className="timeline-item"><span className="timeline-dot timeline-dot--purple" /><div><p className="timeline-title">Set role permissions</p><p className="timeline-meta">Choose which dashboard and management pages are available.</p></div></div>
            <div className="timeline-item"><span className="timeline-dot timeline-dot--amber" /><div><p className="timeline-title">Review employee status</p><p className="timeline-meta">Enable or disable records from Users Details.</p></div></div>
          </div>
        </article>
        <article className="panel-card"><div className="panel-header"><div><p className="eyebrow">Quick guide</p><h3>ID tasks</h3></div></div><ul className="quick-list"><li>Create a user and assign a role</li><li>Review the role permission matrix</li><li>Enable or disable employee records</li></ul></article>
      </section>
    </main>
  )
}

export default IdManagementPage
