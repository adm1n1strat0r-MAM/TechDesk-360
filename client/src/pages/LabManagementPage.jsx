import { useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import '../styles/DashboardPage.css'
import '../styles/LabManagementPage.css'

function LabManagementPage({
  title = 'Lab Management',
  subtitle = 'Overview',
  cases = [],
  loading = false,
  loadError = '',
}) {
  const [selectedFilter, setSelectedFilter] = useState('All')
  const stages = [
    {
      label: 'Open',
      count: cases.filter((item) => item.status === 'Open').length,
      color: 'open',
    },
    {
      label: 'In Progress',
      count: cases.filter((item) => item.status === 'In Progress').length,
      color: 'progress',
    },
    {
      label: 'Warranty',
      count: cases.filter((item) => item.status === 'Warranty').length,
      color: 'warranty',
    },
    {
      label: 'Completed',
      count: cases.filter((item) =>
        ['Completed', 'Closed'].includes(item.status),
      ).length,
      color: 'completed',
    },
  ]
  const maxCount = Math.max(1, ...stages.map(({ count }) => count))
  const filterCards = [
    {
      label: 'Total cases',
      filter: 'All',
      count: cases.length,
      detail: 'All recorded lab work',
      color: 'teal',
    },
    {
      label: 'Open cases',
      filter: 'Open',
      count: stages[0].count,
      detail: 'Waiting for approval',
      color: 'blue',
    },
    {
      label: 'In progress',
      filter: 'In Progress',
      count: stages[1].count,
      detail: 'Approved cases being worked',
      color: 'purple',
    },
    {
      label: 'Warranty',
      filter: 'Warranty',
      count: stages[2].count,
      detail: 'Vendor or warranty claim follow-up',
      color: 'blue',
    },
  ]
  const filteredCases =
    selectedFilter === 'All'
      ? cases
      : cases.filter((item) => item.status === selectedFilter)
  const deviceCounts = Object.entries(
    filteredCases.reduce((counts, item) => {
      const device = item.itemReceived || 'Unspecified'
      counts[device] = (counts[device] || 0) + 1
      return counts
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)

  return (
    <main className="content-panel">
      <PageHeader title={title} subtitle={subtitle} />

      <section className="stats-grid lab-stats-grid" aria-label="Filter lab cases by stage">
        {filterCards.map((card) => (
          <button
            className={`stat-card stat-card--${card.color} lab-stat-filter${
              selectedFilter === card.filter ? ' is-selected' : ''
            }`}
            type="button"
            key={card.filter}
            aria-pressed={selectedFilter === card.filter}
            onClick={() => setSelectedFilter(card.filter)}
          >
            <span className="stat-label">{card.label}</span>
            <span className="stat-value">{card.count}</span>
            <span className="stat-detail">{card.detail}</span>
          </button>
        ))}
      </section>

      {loadError && <p role="alert">{loadError}</p>}
      {loading && <p>Loading lab cases from the server…</p>}

      <section className="panel-card overview-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Graphical summary</p>
            <h3>Cases by stage</h3>
          </div>
        </div>
        <div
          className="lab-stage-chart"
          role="img"
          aria-label="Bar chart of lab cases by stage"
        >
          {stages.map((stage) => (
            <div className="lab-stage-chart__row" key={stage.label}>
              <span>{stage.label}</span>
              <div className="lab-stage-chart__track">
                <div
                  className={`lab-stage-chart__bar lab-stage-chart__bar--${stage.color}`}
                  style={{ width: `${(stage.count / maxCount) * 100}%` }}
                />
              </div>
              <strong>{stage.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="content-grid">
        <article className="panel-card panel-card--wide">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Latest activity</p>
              <h3>
                {selectedFilter === 'All' ? 'Recent lab cases' : `${selectedFilter} cases`}
              </h3>
            </div>
            <span className="lab-filter-count">{filteredCases.length} matching</span>
          </div>
          <div className="timeline">
            {filteredCases.slice(0, 5).map((item, index) => (
              <div className="timeline-item" key={item.id}>
                <span
                  className={`timeline-dot ${index % 2 ? 'timeline-dot--purple' : ''}`}
                />
                <div>
                  <p className="timeline-title">
                    {item.srNumber} - {item.userDomain}
                  </p>
                  <p className="timeline-meta">
                    {item.itemReceived} - {item.branchName} - {item.status}
                  </p>
                </div>
              </div>
            ))}
            {filteredCases.length === 0 && (
              <p className="timeline-meta">
                {cases.length ? 'No cases match this stage.' : 'Newly opened cases will appear here.'}
              </p>
            )}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Device breakdown</p>
              <h3>Cases by device</h3>
            </div>
          </div>
          <ul className="quick-list">
            {deviceCounts.length ? (
              deviceCounts.map(([device, count]) => (
                <li key={device}>
                  {device}: {count} case{count === 1 ? '' : 's'}
                </li>
              ))
            ) : (
              <li>No device activity yet.</li>
            )}
          </ul>
        </article>
      </section>
    </main>
  )
}

export default LabManagementPage
