import { useEffect, useState } from 'react'
import ProfileButton from '../components/common/ProfileButton'
import '../styles/DashboardPage.css'

const readRows = (key, fallback = []) => {
  try { return JSON.parse(localStorage.getItem(`techdesk:${key}`)) ?? fallback } catch { return fallback }
}

function DashboardPage({ cases = [] }) {
  const [assets, setAssets] = useState(() => readRows('inventory-hardware', [
    { itemName: 'Laptop', branch: 'HQ', quantity: 24, status: 'Available' },
    { itemName: 'Monitor', branch: 'Branch A', quantity: 7, status: 'Low' },
  ]))

  useEffect(() => {
    const refresh = () => setAssets(readRows('inventory-hardware'))
    window.addEventListener('storage', refresh)
    window.addEventListener('techdesk-data', refresh)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('techdesk-data', refresh) }
  }, [])

  const countStatus = (status) => cases.filter((item) => item.status === status).length
  const stats = [
    { label: 'Open Cases', value: countStatus('Open'), detail: 'Awaiting work', tone: 'teal' },
    { label: 'In Progress Cases', value: countStatus('In Progress'), detail: 'Currently being handled', tone: 'blue' },
    { label: 'Warranty Cases', value: countStatus('Warranty'), detail: 'Vendor follow-up', tone: 'purple' },
    { label: 'Available Assets', value: assets.filter((item) => item.status === 'Available').reduce((sum, item) => sum + (Number(item.quantity) || 1), 0), detail: 'Ready for assignment', tone: 'teal' },
  ]

  return (
    <main className="content-panel">
      <header className="topbar"><div><p className="eyebrow">Operations overview</p><h2 className="page-title">Branch Command Center</h2></div><ProfileButton /></header>
      <section className="stats-grid">
        {stats.map(({ label, value, detail, tone }) => <article key={label} className={`stat-card stat-card--${tone}`}><div className="stat-header"><span className="stat-label">{label}</span><span className="stat-trend">Local</span></div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></article>)}
      </section>
      <section className="content-grid">
        <article className="panel-card panel-card--wide"><div className="panel-header"><div><p className="eyebrow">Recent cases</p><h3>Service pipeline</h3></div></div>
          <div className="timeline">{cases.slice(0, 5).map((item, index) => <div className="timeline-item" key={item.id ?? item.srNumber ?? index}><span className={`timeline-dot ${index % 2 ? 'timeline-dot--purple' : ''}`} /><div><p className="timeline-title">{item.srNumber || 'Lab case'} · {item.userDomain}</p><p className="timeline-meta">{item.itemReceived} · {item.branchName} · {item.status}</p></div></div>)}{cases.length === 0 && <p className="timeline-meta">No cases recorded yet.</p>}</div>
        </article>
        <article className="panel-card"><div className="panel-header"><div><p className="eyebrow">Inventory summary</p><h3>Assets on hand</h3></div></div>
          <ul className="quick-list">{assets.slice(0, 6).map((item, index) => <li key={item.id ?? index}>{item.itemName || item.product} — {item.quantity ?? item.stock ?? 1} · {item.branch || item.status}</li>)}{assets.length === 0 && <li>No inventory recorded yet.</li>}</ul>
        </article>
      </section>
    </main>
  )
}

export default DashboardPage
