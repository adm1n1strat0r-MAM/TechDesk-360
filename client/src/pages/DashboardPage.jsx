import { useEffect, useState } from 'react'
import { getInventoryOverview } from '../api'
import ProfileButton from '../components/common/ProfileButton'
import '../styles/DashboardPage.css'

const chartColors = ['#0f766e', '#2563eb', '#d97706', '#db2777', '#64748b', '#7c3aed']
const caseStatusLabels = ['Open', 'In Progress', 'Warranty', 'Completed']

function countStatus(items, statuses) {
  return items.filter((item) => statuses.includes(String(item.status || '').toLowerCase())).length
}

function DonutChart({ title, items, centerLabel }) {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const segments = items.filter((item) => item.value > 0).map((item, index, visibleItems) => ({
    ...item,
    length: (item.value / total) * circumference,
    offset: (visibleItems.slice(0, index).reduce((sum, previous) => sum + previous.value, 0) / total) * circumference,
  }))

  return (
    <article className="panel-card dashboard-chart-card">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Module breakdown</p>
          <h3>{title}</h3>
        </div>
        <span className="dashboard-chart-total">{total.toLocaleString()}</span>
      </div>
      <div className="dashboard-donut-layout">
        <svg className="dashboard-donut" viewBox="0 0 160 160" role="img" aria-label={`${title}: ${total} total`}>
          <circle className="dashboard-donut-track" cx="80" cy="80" r={radius} />
          {segments.map((item) => (
            <circle
              key={item.label}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="18"
              strokeDasharray={`${item.length} ${circumference - item.length}`}
              strokeDashoffset={-item.offset}
              transform="rotate(-90 80 80)"
            />
          ))}
          <text className="dashboard-donut-value" x="80" y="78" textAnchor="middle">{total.toLocaleString()}</text>
          <text className="dashboard-donut-label" x="80" y="98" textAnchor="middle">{centerLabel}</text>
        </svg>
        <ul className="dashboard-legend">
          {items.map((item) => (
            <li key={item.label}>
              <span className="dashboard-legend-name">
                <i className="dashboard-swatch" style={{ '--swatch-color': item.color }} />
                {item.label}
              </span>
              <span className="dashboard-legend-value">
                {item.value.toLocaleString()}
                <small>{total ? `${Math.round((item.value / total) * 100)}%` : '0%'}</small>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

function BarChart({ title, eyebrow, items, emptyMessage }) {
  const maximum = Math.max(...items.map((item) => item.value), 0)

  return (
    <article className="panel-card dashboard-chart-card">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
        <span className="dashboard-chart-total">
          {items.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
        </span>
      </div>
      {items.length ? (
        <div className="dashboard-bars" role="list" aria-label={title}>
          {items.map((item, index) => (
            <div className="dashboard-bar-row" key={item.label} role="listitem">
              <span className="dashboard-bar-label" title={item.label}>{item.label}</span>
              <span className="dashboard-bar-track">
                <span
                  className="dashboard-bar-fill"
                  style={{
                    '--bar-width': `${maximum ? Math.max((item.value / maximum) * 100, 2) : 0}%`,
                    '--bar-color': chartColors[index % chartColors.length],
                  }}
                />
              </span>
              <strong className="dashboard-bar-value">{item.value.toLocaleString()}</strong>
            </div>
          ))}
        </div>
      ) : <p className="dashboard-empty-chart">{emptyMessage}</p>}
    </article>
  )
}

function RestrictedChart({ title, message }) {
  return (
    <article className="panel-card dashboard-chart-card">
      <div className="panel-header">
        <div><p className="eyebrow">Module breakdown</p><h3>{title}</h3></div>
      </div>
      <p className="dashboard-empty-chart">{message}</p>
    </article>
  )
}

function moduleStatus({ permitted, loading, error, connected = true }) {
  if (!permitted) return { label: 'Restricted', className: 'restricted' }
  if (loading) return { label: 'Loading', className: 'loading' }
  if (error) return { label: 'Unavailable', className: 'unavailable' }
  return connected
    ? { label: 'Connected', className: 'connected' }
    : { label: 'Not connected', className: 'unavailable' }
}

function DashboardPage({
  cases = [],
  casesLoading = false,
  casesError = '',
  branches = [],
  branchesLoading = false,
  branchesError = '',
  users = [],
  usersLoading = false,
  usersError = '',
  roles = [],
  rolesLoading = false,
  allowedPages = [],
}) {
  const [inventoryResult, setInventoryResult] = useState({ status: 'loading', summary: null, error: '' })

  const canView = (ids) => ids.some((id) => allowedPages.includes(id))
  const canViewLab = canView(['lab', 'lab-new-case', 'lab-new-cases', 'lab-cases-summary'])
  const canViewInventory = canView(['inventory', 'inventory-back-office', 'inventory-branch', 'inventory-employee-detail'])
  const canViewBranches = canView(['branch-management', 'branch-add', 'branch-list'])
  const canViewIds = canView(['id', 'id-new-user', 'id-users-details', 'id-role-management'])
  const inventory = inventoryResult.summary
  const inventoryLoading = inventoryResult.status === 'loading'
  const inventoryError = inventoryResult.error

  useEffect(() => {
    if (!canViewInventory) return undefined

    let active = true
    getInventoryOverview()
      .then((summary) => {
        if (active) {
          setInventoryResult({ status: 'ready', summary, error: '' })
        }
      })
      .catch((error) => {
        if (active) setInventoryResult({ status: 'error', summary: null, error: error.message })
      })

    return () => { active = false }
  }, [canViewInventory])

  const caseStatuses = caseStatusLabels.map((label, index) => ({
    label,
    value: countStatus(cases, [label.toLowerCase()]),
    color: chartColors[index],
  }))
  const otherCaseCount = cases.filter((item) =>
    !caseStatusLabels.some((status) => status.toLowerCase() === String(item.status || '').toLowerCase()),
  ).length
  if (otherCaseCount) caseStatuses.push({ label: 'Other', value: otherCaseCount, color: chartColors[4] })

  const overall = inventory?.overall
  const equipmentItems = [
    { label: 'PC / laptops', value: Number(overall?.systemCount) || 0 },
    { label: 'Printers', value: Number(overall?.printers?.total) || 0 },
    { label: 'Validation printers', value: Number(overall?.validationPrinters?.total) || 0 },
    { label: 'Scanners', value: Number(overall?.scanners?.total) || 0 },
    { label: 'Biometric devices', value: Number(overall?.biometrics?.total) || 0 },
    { label: 'LED displays', value: Number(overall?.leds?.total) || 0 },
  ].map((item, index) => ({ ...item, color: chartColors[index] }))
  const equipmentTotal = equipmentItems.reduce((sum, item) => sum + item.value, 0)

  const branchRegions = Object.entries(branches.reduce((counts, branch) => {
    const region = branch.branchRegion || branch.branchArea || 'Unassigned'
    counts[region] = (counts[region] || 0) + 1
    return counts
  }, {}))
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 6)

  const userStatusItems = [
    { label: 'Active', value: countStatus(users, ['active']), color: chartColors[0] },
    { label: 'Inactive', value: countStatus(users, ['inactive']), color: chartColors[2] },
  ]
  const otherUserCount = users.length - userStatusItems.reduce((sum, item) => sum + item.value, 0)
  if (otherUserCount > 0) userStatusItems.push({ label: 'Other', value: otherUserCount, color: chartColors[4] })

  const activeUsers = userStatusItems.find((item) => item.label === 'Active')?.value || 0
  const completedCases = countStatus(cases, ['completed'])
  const openCases = countStatus(cases, ['open', 'in progress', 'warranty'])
  const resolutionRate = cases.length ? Math.round((completedCases / cases.length) * 100) : 0
  const moduleCards = [
    {
      label: 'Lab Management',
      value: canViewLab ? (casesLoading ? '…' : casesError ? '—' : cases.length.toLocaleString()) : '—',
      detail: !canViewLab ? 'Access is restricted for this role' : casesLoading ? 'Loading lab cases' : casesError ? 'Lab data is unavailable' : `${openCases.toLocaleString()} active · ${resolutionRate}% completed`,
      status: moduleStatus({ permitted: canViewLab, loading: casesLoading, error: casesError }),
    },
    {
      label: 'Inventory Management',
      value: canViewInventory ? (inventoryLoading ? '…' : inventoryError ? '—' : (inventory?.recordCount || 0).toLocaleString()) : '—',
      detail: !canViewInventory ? 'Access is restricted for this role' : inventoryLoading ? 'Loading inventory summary' : inventoryError ? 'Inventory data is unavailable' : `${equipmentTotal.toLocaleString()} devices across ${inventory?.branchCount || 0} branch codes`,
      status: moduleStatus({ permitted: canViewInventory, loading: inventoryLoading, error: inventoryError }),
    },
    {
      label: 'Branch Management',
      value: canViewBranches ? (branchesLoading ? '…' : branchesError ? '—' : branches.length.toLocaleString()) : '—',
      detail: canViewBranches ? 'Registered branch locations' : 'Access is restricted for this role',
      status: moduleStatus({ permitted: canViewBranches, loading: branchesLoading, error: branchesError }),
    },
    {
      label: 'ID Management',
      value: canViewIds ? (usersLoading || rolesLoading ? '…' : usersError ? '—' : users.length.toLocaleString()) : '—',
      detail: !canViewIds ? 'Access is restricted for this role' : usersLoading || rolesLoading ? 'Loading users and roles' : usersError ? 'ID data is unavailable' : `${activeUsers.toLocaleString()} active users · ${roles.length.toLocaleString()} roles`,
      status: moduleStatus({ permitted: canViewIds, loading: usersLoading || rolesLoading, error: usersError }),
    },
    {
      label: 'Store Management',
      value: '—',
      detail: 'Store records are not connected to a data source yet',
      status: moduleStatus({ permitted: allowedPages.includes('store-management'), connected: false }),
    },
    {
      label: 'Disposal Management',
      value: '—',
      detail: 'Disposal records are not connected to a data source yet',
      status: moduleStatus({ permitted: allowedPages.includes('disposal-management'), connected: false }),
    },
  ]

  return (
    <main className="content-panel dashboard-page">
      <header className="topbar dashboard-topbar">
        <div>
          <p className="eyebrow">Operations overview</p>
          <h2 className="page-title">Branch Command Center</h2>
          <p className="page-subtitle">Live module totals and workload distribution</p>
        </div>
        <ProfileButton />
      </header>

      <section className="stats-grid dashboard-metrics-grid" aria-label="Key operational metrics">
        <article className="stat-card stat-card--teal">
          <div className="stat-header"><span className="stat-label">Lab cases</span><span className="stat-trend">Live</span></div>
          <div className="stat-value">{canViewLab && !casesLoading && !casesError ? cases.length.toLocaleString() : '—'}</div>
          <div className="stat-detail">{canViewLab ? `${openCases.toLocaleString()} open or being handled` : 'Access restricted'}</div>
        </article>
        <article className="stat-card stat-card--blue">
          <div className="stat-header"><span className="stat-label">Inventory devices</span><span className="stat-trend">Live</span></div>
          <div className="stat-value">{canViewInventory && !inventoryLoading && !inventoryError ? equipmentTotal.toLocaleString() : '—'}</div>
          <div className="stat-detail">Across PC, printers, scanners, BIO and LED</div>
        </article>
        <article className="stat-card stat-card--purple">
          <div className="stat-header"><span className="stat-label">Branches</span><span className="stat-trend">Live</span></div>
          <div className="stat-value">{canViewBranches && !branchesLoading && !branchesError ? branches.length.toLocaleString() : '—'}</div>
          <div className="stat-detail">Registered locations</div>
        </article>
        <article className="stat-card stat-card--teal">
          <div className="stat-header"><span className="stat-label">Active users</span><span className="stat-trend">Live</span></div>
          <div className="stat-value">{canViewIds && !usersLoading && !usersError ? activeUsers.toLocaleString() : '—'}</div>
          <div className="stat-detail">{canViewIds ? `${roles.length.toLocaleString()} configured access roles` : 'Access restricted'}</div>
        </article>
      </section>

      <section className="dashboard-chart-grid" aria-label="Operational charts">
        {canViewLab ? (
          <DonutChart title="Lab case status" centerLabel="cases" items={caseStatuses} />
        ) : (
          <RestrictedChart title="Lab case status" message="Lab access is restricted for this role." />
        )}
        {canViewInventory && !inventoryLoading && !inventoryError ? (
          <DonutChart title="Inventory composition" centerLabel="devices" items={equipmentItems} />
        ) : (
          <article className="panel-card dashboard-chart-card">
            <div className="panel-header"><div><p className="eyebrow">Module breakdown</p><h3>Inventory composition</h3></div></div>
            <p className="dashboard-empty-chart">
              {!canViewInventory ? 'Inventory access is restricted for this role.' : inventoryLoading ? 'Loading inventory totals…' : inventoryError || 'Inventory data is unavailable.'}
            </p>
          </article>
        )}
        <BarChart
          title="Branches by region"
          eyebrow="Branch Management"
          items={canViewBranches && !branchesLoading && !branchesError ? branchRegions : []}
          emptyMessage={!canViewBranches ? 'Branch access is restricted for this role.' : branchesLoading ? 'Loading branches…' : branchesError || 'No branch records are available.'}
        />
        {canViewIds && !usersLoading && !usersError ? (
          <DonutChart title="User account status" centerLabel="users" items={userStatusItems} />
        ) : (
          <article className="panel-card dashboard-chart-card">
            <div className="panel-header"><div><p className="eyebrow">ID Management</p><h3>User account status</h3></div></div>
            <p className="dashboard-empty-chart">
              {!canViewIds ? 'ID access is restricted for this role.' : usersLoading ? 'Loading user accounts…' : usersError || 'User data is unavailable.'}
            </p>
          </article>
        )}
        <BarChart
          title="Users by access role"
          eyebrow="ID Management"
          items={canViewIds && !usersLoading && !rolesLoading && !usersError
            ? roles.map((role) => ({ label: role.name, value: users.filter((user) => user.role === role.name).length })).filter((role) => role.value > 0).sort((left, right) => right.value - left.value).slice(0, 6)
            : []}
          emptyMessage={!canViewIds ? 'ID access is restricted for this role.' : usersLoading || rolesLoading ? 'Loading roles and users…' : usersError || 'No assigned users by role.'}
        />
        <article className="panel-card dashboard-chart-card dashboard-calculation-card">
          <div className="panel-header"><div><p className="eyebrow">Calculated indicators</p><h3>Service health</h3></div></div>
          <div className="dashboard-calculations">
            <div><span>Case completion</span><strong>{canViewLab && cases.length && !casesLoading && !casesError ? `${resolutionRate}%` : '—'}</strong><small>{canViewLab ? `${completedCases} completed of ${cases.length} total` : 'Lab access restricted'}</small></div>
            <div><span>Active user rate</span><strong>{canViewIds && users.length && !usersLoading && !usersError ? `${Math.round((activeUsers / users.length) * 100)}%` : '—'}</strong><small>{canViewIds ? `${activeUsers} active of ${users.length} total` : 'ID access restricted'}</small></div>
            <div><span>Average devices per location</span><strong>{canViewInventory && !inventoryLoading && !inventoryError && inventory?.branchCount ? (equipmentTotal / inventory.branchCount).toFixed(1) : '—'}</strong><small>{canViewInventory ? `${equipmentTotal.toLocaleString()} devices ÷ ${inventory?.branchCount || 0} branch codes` : 'Inventory access restricted'}</small></div>
          </div>
        </article>
      </section>

      <section className="dashboard-modules-panel">
        <div className="panel-header">
          <div><p className="eyebrow">Module health</p><h3>Workspace status</h3></div>
          <span className="dashboard-module-count">{moduleCards.length} modules</span>
        </div>
        <div className="dashboard-module-grid">
          {moduleCards.map((module) => (
            <article className="dashboard-module" key={module.label}>
              <div className="dashboard-module-heading">
                <h4>{module.label}</h4>
                <span className={`dashboard-module-status dashboard-module-status--${module.status.className}`}>
                  {module.status.label}
                </span>
              </div>
              <strong className="dashboard-module-value">{module.value}</strong>
              <p>{module.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default DashboardPage
