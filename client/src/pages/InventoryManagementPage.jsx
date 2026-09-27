import '../styles/DashboardPage.css'
import PageHeader from '../components/common/PageHeader'

const inventoryCategories = [
  { name: 'Central / Branches Inventory', count: '828', note: 'Across all branches' },
  { name: 'Store Inventory', count: '196', note: 'Current stock items' },
  { name: 'Printer', count: '86', note: 'Ready and in repair' },
  { name: 'Scanner', count: '42', note: 'Operational and repair' },
  { name: 'Bio matric', count: '28', note: 'Access control devices' },
  { name: 'Windows Clients', count: '630', note: 'Workstations assigned' },
  { name: 'Zero Client', count: '110', note: 'Thin client devices' },
]

function InventoryManagementPage({ title = 'Inventory Management', subtitle = 'Central / Branches Inventory' }) {
  return (
    <main className="content-panel">
      <PageHeader title={title} subtitle={subtitle} />

      <section className="stats-grid">
        <article className="stat-card stat-card--teal">
          <div className="stat-header">
            <span className="stat-label">Stock Items</span>
            <span className="stat-trend">Live</span>
          </div>
          <div className="stat-value">1,248</div>
          <div className="stat-detail">120 new items added this month</div>
        </article>

        <article className="stat-card stat-card--blue">
          <div className="stat-header">
            <span className="stat-label">Low Quantity</span>
            <span className="stat-trend">Alert</span>
          </div>
          <div className="stat-value">34</div>
          <div className="stat-detail">8 need urgent reorder</div>
        </article>

        <article className="stat-card stat-card--purple">
          <div className="stat-header">
            <span className="stat-label">Warehouse Health</span>
            <span className="stat-trend">98%</span>
          </div>
          <div className="stat-value">98%</div>
          <div className="stat-detail">Ready for dispatch and audit</div>
        </article>
      </section>

      <section className="panel-card overview-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Overview</p>
            <h3>Inventory categories</h3>
          </div>
        </div>

        <div className="overview-section-grid overview-section-grid--wide">
          {inventoryCategories.map((item) => (
            <div key={item.name} className="overview-section-card">
              <div className="overview-section-card__top">
                <span>{item.name}</span>
                <strong>{item.count}</strong>
              </div>
              <small>{item.note}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="content-grid">
        <article className="panel-card panel-card--wide">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Current focus</p>
              <h3>Stock movement</h3>
            </div>
          </div>

          <div className="timeline">
            <div className="timeline-item">
              <span className="timeline-dot" />
              <div>
                <p className="timeline-title">Monitor shipment received</p>
                <p className="timeline-meta">Dock 3 • 08:45 AM</p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="timeline-dot timeline-dot--purple" />
              <div>
                <p className="timeline-title">Restock request approved</p>
                <p className="timeline-meta">Support Hub • 09:20 AM</p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="timeline-dot timeline-dot--amber" />
              <div>
                <p className="timeline-title">Cycle count scheduled</p>
                <p className="timeline-meta">Warehouse • 01:10 PM</p>
              </div>
            </div>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Quick notes</p>
              <h3>Inventory tasks</h3>
            </div>
          </div>

          <ul className="quick-list">
            <li>Check pending stock requests</li>
            <li>Review supplier delivery logs</li>
            <li>Update in-transit quantities</li>
          </ul>
        </article>
      </section>
    </main>
  )
}

export function ManagementSectionPage({
  title,
  subtitle,
  panelTitle,
  description,
  emptyMessage,
}) {
  return (
    <main className="content-panel">
      <PageHeader title={title} subtitle={subtitle} />
      <section className="panel-card management-section-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Management workspace</p>
            <h3>{panelTitle}</h3>
          </div>
        </div>
        <p className="timeline-meta management-section-description">{description}</p>
        <div className="management-empty-state">{emptyMessage}</div>
      </section>
    </main>
  )
}

export default InventoryManagementPage
