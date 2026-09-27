import { Fragment, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import '../styles/DashboardPage.css'
import '../styles/BranchManagementPage.css'

const branchRegions = ['Central I', 'Central II', 'South', 'North']
const aomChartColors = [
  '#22d3ee',
  '#818cf8',
  '#f59e0b',
  '#34d399',
  '#f472b6',
  '#60a5fa',
  '#c084fc',
  '#fb7185',
]

function pieSlicePath(start, end, radius, centerX, centerY) {
  const toPoint = (angle) => {
    const radians = ((angle - 90) * Math.PI) / 180
    return {
      x: centerX + radius * Math.cos(radians),
      y: centerY + radius * Math.sin(radians),
    }
  }
  const startPoint = toPoint(start)
  const endPoint = toPoint(end)
  const largeArc = end - start > 180 ? 1 : 0
  return `M ${centerX} ${centerY} L ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y} Z`
}

const emptyBranch = () => ({
  branchCode: '',
  branchName: '',
  branchIp: '',
  branchArea: '',
  branchRegion: '',
  branchAom: '',
  branchCom: '',
  branchGmOperations: '',
  branchRgm: '',
  branchCmBusiness: '',
  branchGmBusiness: '',
  branchAddress: '',
})

const toBranchForm = (branch) => ({ ...emptyBranch(), ...branch })

const importHeaderFields = {
  branchcode: 'branchCode',
  code: 'branchCode',
  branchname: 'branchName',
  name: 'branchName',
  branchip: 'branchIp',
  ciscoextension: 'branchIp',
  ciscoext: 'branchIp',
  extension: 'branchIp',
  ip: 'branchIp',
  area: 'branchArea',
  brancharea: 'branchArea',
  region: 'branchRegion',
  rigion: 'branchRegion',
  branchregion: 'branchRegion',
  branchrigion: 'branchRegion',
  aom: 'branchAom',
  branchaom: 'branchAom',
  branchaomdata: 'branchAom',
  aomdata: 'branchAom',
  branchaomname: 'branchAom',
  com: 'branchCom',
  branchcom: 'branchCom',
  gmoperations: 'branchGmOperations',
  branchgmoperations: 'branchGmOperations',
  rgm: 'branchRgm',
  branchrgm: 'branchRgm',
  cmbusiness: 'branchCmBusiness',
  branchcmbusiness: 'branchCmBusiness',
  gmbusiness: 'branchGmBusiness',
  branchgmbusiness: 'branchGmBusiness',
  address: 'branchAddress',
  branchaddress: 'branchAddress',
}

function splitSpreadsheetText(text) {
  const delimiter = text.includes('\t') ? '\t' : ','
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (!quoted && character === delimiter) {
      row.push(cell.trim())
      cell = ''
    } else if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(cell.trim())
      if (row.some((value) => value !== '')) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }

  row.push(cell.trim())
  if (row.some((value) => value !== '')) rows.push(row)
  return rows
}

function parseSpreadsheetBranches(text) {
  const rows = splitSpreadsheetText(text.replace(/^\uFEFF/, ''))
  if (!rows.length) return { rows: [], error: 'Paste branch rows from Excel first.' }

  const normalizeHeader = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
  const firstRowHeaders = rows[0].map(normalizeHeader)
  const hasHeader = firstRowHeaders.some((header) =>
    ['branchcode', 'code', 'branchname', 'name'].includes(header),
  )
  let columnFields
  let dataRows = rows

  if (hasHeader) {
    columnFields = firstRowHeaders.map((header) => importHeaderFields[header] || '')
    if (!columnFields.includes('branchCode') || !columnFields.includes('branchName')) {
      return {
        rows: [],
        error: 'The header row must include Branch Code and Branch Name.',
      }
    }
    dataRows = rows.slice(1)
  } else {
    columnFields = [
      'branchCode',
      'branchName',
      'branchArea',
      'branchRegion',
      'branchAom',
    ]
  }

  const importedRows = dataRows.map((row) => {
    const branch = emptyBranch()
    columnFields.forEach((field, index) => {
      if (field) branch[field] = row[index] || ''
    })
    branch._importFields = [...new Set(columnFields.filter(Boolean))]
    return branch
  })
  const missingRequired = importedRows
    .map((branch, index) =>
      branch.branchCode && branch.branchName ? null : index + 1,
    )
    .filter(Boolean)
  if (missingRequired.length) {
    return {
      rows: [],
      error: `Branch Code and Branch Name are missing in data row${
        missingRequired.length === 1 ? '' : 's'
      }: ${missingRequired.slice(0, 10).join(', ')}.`,
    }
  }

  return { rows: importedRows, error: '' }
}

function BranchFields({ form, onChange }) {
  return (
    <div className="form-grid branch-form-grid">
      <label className="form-field">
        <span>Branch Code</span>
        <input
          name="branchCode"
          value={form.branchCode}
          onChange={onChange}
          placeholder="e.g. 0101"
          required
        />
      </label>
      <label className="form-field">
        <span>Branch Name</span>
        <input
          name="branchName"
          value={form.branchName}
          onChange={onChange}
          placeholder="Enter branch name"
          required
        />
      </label>
      <label className="form-field">
        <span>Branch IP / Cisco Extension</span>
        <input
          name="branchIp"
          value={form.branchIp}
          onChange={onChange}
          placeholder="4-digit Cisco extension"
          inputMode="numeric"
          maxLength={4}
          pattern="[0-9]{4}"
          title="Enter a 4-digit Cisco extension"
        />
      </label>
      <label className="form-field">
        <span>Branch Area</span>
        <input
          name="branchArea"
          value={form.branchArea}
          onChange={onChange}
          placeholder="Enter area or city"
        />
      </label>
      <label className="form-field">
        <span>Branch Region</span>
        <select
          name="branchRegion"
          value={form.branchRegion}
          onChange={onChange}
        >
          <option value="">Select a region</option>
          {branchRegions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Branch AOM</span>
        <input name="branchAom" value={form.branchAom} onChange={onChange} />
      </label>
      <label className="form-field">
        <span>Branch COM</span>
        <input name="branchCom" value={form.branchCom} onChange={onChange} />
      </label>
      <label className="form-field">
        <span>Branch GM Operations</span>
        <input
          name="branchGmOperations"
          value={form.branchGmOperations}
          onChange={onChange}
        />
      </label>
      <label className="form-field">
        <span>Branch RGM</span>
        <input name="branchRgm" value={form.branchRgm} onChange={onChange} />
      </label>
      <label className="form-field">
        <span>Branch CM Business</span>
        <input
          name="branchCmBusiness"
          value={form.branchCmBusiness}
          onChange={onChange}
        />
      </label>
      <label className="form-field">
        <span>Branch GM Business</span>
        <input
          name="branchGmBusiness"
          value={form.branchGmBusiness}
          onChange={onChange}
        />
      </label>
      <label className="form-field branch-address-field">
        <span>Branch Address</span>
        <textarea
          name="branchAddress"
          value={form.branchAddress}
          onChange={onChange}
          rows={3}
        />
      </label>
    </div>
  )
}

export function BranchManagementPage({ branches, loading, loadError }) {
  const countsByRegion = branchRegions.map((region) => ({
    region,
    count: branches.filter((branch) => branch.branchRegion === region).length,
  }))
  const aomCounts = [...branches.reduce((counts, branch) => {
    const name = branch.branchAom?.trim() || 'Unassigned'
    const key = name.toLowerCase()
    const current = counts.get(key)
    counts.set(key, {
      name: current?.name || name,
      count: (current?.count || 0) + 1,
    })
    return counts
  }, new Map()).values()]
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .map((item, index) => ({ ...item, color: aomChartColors[index % aomChartColors.length] }))
  const totalAomBranches = aomCounts.reduce((total, item) => total + item.count, 0)
  const pieSlices = aomCounts.reduce((slices, item) => {
    const start = slices.at(-1)?.end || 0
    const end = start + (item.count / totalAomBranches) * 360
    return [...slices, { ...item, start, end }]
  }, [])
  const chartRadius = 108
  const longestAomName = Math.max(0, ...aomCounts.map((item) => item.name.length))
  const labelWidth = Math.min(260, Math.max(140, longestAomName * 8))
  const chartCenterX = labelWidth + chartRadius + 62
  const chartWidth = labelWidth * 2 + chartRadius * 2 + 124
  const leftAomCount = pieSlices.filter((slice) => {
    const middleAngle = ((slice.start + slice.end) / 2) % 360
    return Math.cos(((middleAngle - 90) * Math.PI) / 180) < 0
  }).length
  const rightAomCount = pieSlices.length - leftAomCount
  const maxSideAomCount = Math.max(leftAomCount, rightAomCount, 1)
  const chartHeight = Math.max(300, maxSideAomCount * 36 + 48)
  const chartCenterY = chartHeight / 2
  const chartLabels = pieSlices.map((slice, index) => {
    const middleAngle = ((slice.start + slice.end) / 2) % 360
    const radians = ((middleAngle - 90) * Math.PI) / 180
    return {
      ...slice,
      index,
      side: Math.cos(radians) < 0 ? 'left' : 'right',
      targetX: chartCenterX + chartRadius * Math.cos(radians),
      targetY: chartCenterY + chartRadius * Math.sin(radians),
    }
  })
  const positionedChartLabels = ['left', 'right'].flatMap((side) => {
    const sideLabels = chartLabels
      .filter((label) => label.side === side)
      .sort((left, right) => left.targetY - right.targetY)
    const labelSpan = Math.min(
      chartHeight - 48,
      Math.max(160, sideLabels.length * 34),
    )
    return sideLabels.map((label, index) => ({
      ...label,
      labelY:
        chartCenterY +
        (sideLabels.length === 1
          ? 0
          : (index / (sideLabels.length - 1) - 0.5) * labelSpan),
    }))
  })
  const leftLabelX = chartCenterX - chartRadius - 30
  const rightLabelX = chartCenterX + chartRadius + 30

  return (
    <main className="content-panel">
      <PageHeader title="Branch Management" subtitle="Branch directory overview" />
      <section className="panel-card branch-overview-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Branch network</p>
            <h3>{branches.length} registered branches</h3>
          </div>
        </div>
        {loading && <p className="timeline-meta">Loading branch records…</p>}
        {loadError && <p role="alert">{loadError}</p>}
        <div className="overview-grid branch-region-grid">
          {countsByRegion.map(({ region, count }) => (
            <article className="overview-card" key={region}>
              <span className="overview-label">{region}</span>
              <strong className="overview-value">{count}</strong>
              <span className="overview-meta">branches</span>
            </article>
          ))}
        </div>
      </section>
      <section className="panel-card branch-aom-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Branch assignment</p>
            <h3>Branches by AOM</h3>
          </div>
          <span className="lab-filter-count">{totalAomBranches} branches</span>
        </div>
        {aomCounts.length ? (
          <div className="branch-aom-analytics">
            <div className="branch-aom-chart-wrap">
              <svg
                className="branch-aom-chart"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                role="img"
                aria-label={`Pie chart showing ${aomCounts.length} AOM groups across ${totalAomBranches} branches`}
              >
                <defs>
                  {pieSlices.map((slice, index) => (
                    <marker
                      key={slice.name}
                      id={`aom-arrow-${index}`}
                      markerWidth="8"
                      markerHeight="8"
                      refX="6"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0,0 L0,6 L7,3 z" fill={slice.color} />
                    </marker>
                  ))}
                </defs>
                {pieSlices.length === 1 ? (
                  <circle
                    cx={chartCenterX}
                    cy={chartCenterY}
                    r={chartRadius}
                    fill={pieSlices[0].color}
                  />
                ) : (
                  pieSlices.map((slice) => (
                    <path
                      key={slice.name}
                      d={pieSlicePath(
                        slice.start,
                        slice.end,
                        chartRadius,
                        chartCenterX,
                        chartCenterY,
                      )}
                      fill={slice.color}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                  ))
                )}
                {positionedChartLabels.map((label) => {
                  const isLeft = label.side === 'left'
                  const textX = isLeft ? leftLabelX : rightLabelX
                  const lineStartX = isLeft ? textX + 10 : textX - 10
                  const elbowX = isLeft
                    ? chartCenterX - chartRadius - 14
                    : chartCenterX + chartRadius + 14
                  const percentage = Math.round(
                    (label.count / totalAomBranches) * 100,
                  )
                  return (
                    <g key={label.name} aria-label={`${label.name}: ${label.count} branches`}>
                      <path
                        d={`M ${lineStartX} ${label.labelY} H ${elbowX} L ${label.targetX} ${label.targetY}`}
                        fill="none"
                        stroke={label.color}
                        strokeWidth="1.7"
                        markerEnd={`url(#aom-arrow-${label.index})`}
                        opacity="0.9"
                      />
                      <text
                        x={textX}
                        y={label.labelY - 4}
                        textAnchor={isLeft ? 'end' : 'start'}
                        dominantBaseline="middle"
                        className="branch-aom-chart-label"
                      >
                        {label.name}
                      </text>
                      <text
                        x={textX}
                        y={label.labelY + 13}
                        textAnchor={isLeft ? 'end' : 'start'}
                        dominantBaseline="middle"
                        className="branch-aom-chart-meta"
                      >
                        {label.count} {label.count === 1 ? 'branch' : 'branches'} · {percentage}%
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
            <ol className="branch-aom-list">
              {aomCounts.map((item, index) => (
                <li key={item.name}>
                  <span className="branch-aom-rank">{index + 1}</span>
                  <span className="branch-aom-color" style={{ backgroundColor: item.color }} />
                  <span className="branch-aom-name">{item.name}</span>
                  <strong>{item.count}</strong>
                  <small>{Math.round((item.count / totalAomBranches) * 100)}%</small>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="management-empty-state">Branch AOM counts and the pie chart will appear after branches are added.</div>
        )}
      </section>
    </main>
  )
}

export function AddBranchPage({ onCreate, onImport, loading, loadError }) {
  const [form, setForm] = useState(emptyBranch)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [spreadsheetText, setSpreadsheetText] = useState('')
  const [previewRows, setPreviewRows] = useState([])
  const [bulkError, setBulkError] = useState('')
  const [bulkMessage, setBulkMessage] = useState('')
  const [importing, setImporting] = useState(false)

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      const branch = await onCreate(form)
      setForm(emptyBranch())
      setMessage(`${branch.branchCode} — ${branch.branchName} was added.`)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const previewSpreadsheet = () => {
    setBulkError('')
    setBulkMessage('')
    const result = parseSpreadsheetBranches(spreadsheetText)
    setPreviewRows(result.rows)
    setBulkError(result.error)
  }

  const importSpreadsheet = async () => {
    setBulkError('')
    setBulkMessage('')
    const result = parseSpreadsheetBranches(spreadsheetText)
    setPreviewRows(result.rows)
    if (result.error) {
      setBulkError(result.error)
      return
    }

    setImporting(true)
    try {
      const imported = await onImport(result.rows)
      setBulkMessage(
        `${imported.createdCount} branches added and ${imported.updatedCount} existing branches updated.`,
      )
      setSpreadsheetText('')
      setPreviewRows([])
    } catch (importError) {
      setBulkError(importError.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <main className="content-panel">
      <PageHeader
        title="Add Branch"
        subtitle="Register a branch and its area, region, and management contacts"
        eyebrow="Branch Management"
      />
      <section className="panel-card branch-bulk-panel">
        <div className="branch-bulk-heading">
          <div>
            <p className="eyebrow">Spreadsheet import</p>
            <h3>Import several branches at once</h3>
          </div>
          <button
            className="secondary-btn"
            type="button"
            aria-expanded={showBulkImport}
            onClick={() => setShowBulkImport((visible) => !visible)}
          >
            {showBulkImport ? 'Hide import' : 'Import from Excel'}
          </button>
        </div>
        {showBulkImport && (
          <div className="branch-bulk-content">
            <p className="timeline-meta">
              In Excel, copy the branch cells including the header row, then paste them here.
              Headers can be Branch Code, Branch Name, Area, Region, and Branch AOM.
              Without a header row, use that same column order. Branch IP values must be
              4-digit Cisco extensions.
            </p>
            <label className="form-field">
              <span>Copied Excel rows</span>
              <textarea
                rows={8}
                value={spreadsheetText}
                onChange={(event) => {
                  setSpreadsheetText(event.target.value)
                  setPreviewRows([])
                  setBulkError('')
                  setBulkMessage('')
                }}
                placeholder={'Branch Code\tBranch Name\tArea\tRegion\tBranch AOM'}
              />
            </label>
            <div className="form-actions">
              <button
                className="secondary-btn"
                type="button"
                onClick={previewSpreadsheet}
                disabled={!spreadsheetText.trim() || importing || loading}
              >
                Preview rows
              </button>
              <button
                className="primary-btn"
                type="button"
                onClick={importSpreadsheet}
                disabled={!previewRows.length || importing || loading}
              >
                {importing ? 'Importing…' : `Import ${previewRows.length} branches`}
              </button>
            </div>
            {previewRows.length > 0 && (
              <>
                <p className="timeline-meta">
                  Previewing {Math.min(previewRows.length, 5)} of {previewRows.length} rows.
                  Optional fields can remain blank.
                </p>
                <div className="table-wrap">
                  <table className="data-table branch-import-preview">
                    <thead>
                      <tr>
                        <th>Branch Code</th>
                        <th>Branch Name</th>
                        <th>Area</th>
                        <th>Region</th>
                        <th>Branch AOM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.slice(0, 5).map((branch, index) => (
                        <tr key={`${branch.branchCode}-${index}`}>
                          <td>{branch.branchCode}</td>
                          <td>{branch.branchName}</td>
                          <td>{branch.branchArea}</td>
                          <td>{branch.branchRegion}</td>
                          <td>{branch.branchAom}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {bulkError && <p role="alert">{bulkError}</p>}
            {bulkMessage && <p role="status">{bulkMessage}</p>}
          </div>
        )}
      </section>
      <section className="panel-card branch-form-panel">
        <div className="section-heading">
          <p className="eyebrow">Branch record</p>
          <h3>Branch details</h3>
        </div>
        <form onSubmit={submit}>
          <BranchFields form={form} onChange={update} />
          <div className="form-actions">
            <button className="primary-btn" type="submit" disabled={saving || loading}>
              {saving ? 'Saving branch…' : 'Save Branch'}
            </button>
          </div>
          {loadError && <p role="alert">{loadError}</p>}
          {error && <p role="alert">{error}</p>}
          {message && <p role="status">{message}</p>}
        </form>
      </section>
    </main>
  )
}

export function BranchDetailsPage({
  branches,
  loading,
  loadError,
  onUpdate,
}) {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingBranch, setEditingBranch] = useState(null)
  const [viewingBranchId, setViewingBranchId] = useState('')
  const [form, setForm] = useState(emptyBranch)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const filteredBranches = branches.filter((branch) =>
    Object.values(branch)
      .join(' ')
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  )
  const pageSize = 25
  const pageCount = Math.max(1, Math.ceil(filteredBranches.length / pageSize))
  const visibleBranches = filteredBranches.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const startEdit = (branch) => {
    setViewingBranchId('')
    setEditingBranch(branch)
    setForm(toBranchForm(branch))
    setError('')
    setMessage('')
  }

  const updateForm = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submitEdit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const branch = await onUpdate(editingBranch.id, form)
      setEditingBranch(branch)
      setForm(toBranchForm(branch))
      setMessage('Branch details updated.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="content-panel">
      <PageHeader
        title="Branch Details"
        subtitle="Search the branch register and update branch records"
        eyebrow="Branch Management"
      />
      {editingBranch && (
        <section className="panel-card branch-form-panel">
          <div className="section-heading branch-edit-heading">
            <div>
              <p className="eyebrow">Edit branch</p>
              <h3>{editingBranch.branchCode} — {editingBranch.branchName}</h3>
            </div>
            <button
              className="secondary-btn"
              type="button"
              onClick={() => {
                setEditingBranch(null)
                setError('')
                setMessage('')
              }}
            >
              Cancel edit
            </button>
          </div>
          <form onSubmit={submitEdit}>
            <BranchFields form={form} onChange={updateForm} />
            <div className="form-actions">
              <button className="primary-btn" type="submit" disabled={saving}>
                {saving ? 'Saving changes…' : 'Save Changes'}
              </button>
            </div>
            {error && <p role="alert">{error}</p>}
            {message && <p role="status">{message}</p>}
          </form>
        </section>
      )}
      <section className="panel-card branch-list-panel">
        <div className="panel-header branch-list-header">
          <div>
            <p className="eyebrow">Branch register</p>
            <h3>{filteredBranches.length} branches</h3>
          </div>
          <label className="branch-search">
            <span>Search branches</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setCurrentPage(1)
              }}
              placeholder="Code, name, area, region, contact…"
            />
          </label>
        </div>
        {loading && <p className="timeline-meta">Loading branch records…</p>}
        {loadError && <p role="alert">{loadError}</p>}
        <div className="table-wrap">
          <table className="data-table branch-table">
            <thead>
              <tr>
                <th>Branch Code</th>
                <th>Branch Name</th>
                <th>Cisco Extension</th>
                <th>Area</th>
                <th>Region</th>
                <th>AOM</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.length ? (
                visibleBranches.map((branch) => (
                  <Fragment key={branch.id}>
                    <tr>
                      <td>{branch.branchCode}</td>
                      <td>{branch.branchName}</td>
                      <td>{branch.branchIp}</td>
                      <td>{branch.branchArea}</td>
                      <td>{branch.branchRegion}</td>
                      <td>{branch.branchAom}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="action-btn action-btn--details"
                            type="button"
                            aria-expanded={viewingBranchId === branch.id}
                            onClick={() =>
                              setViewingBranchId((current) =>
                                current === branch.id ? '' : branch.id,
                              )
                            }
                          >
                            Detail
                          </button>
                          <button
                            className="action-btn action-btn--edit"
                            type="button"
                            onClick={() => startEdit(branch)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                    {viewingBranchId === branch.id && (
                      <tr className="branch-detail-row">
                        <td colSpan={7}>
                          <div className="branch-detail-grid">
                            <div><span>Branch COM</span><strong>{branch.branchCom || '—'}</strong></div>
                            <div><span>Branch GM Operations</span><strong>{branch.branchGmOperations || '—'}</strong></div>
                            <div><span>Branch RGM</span><strong>{branch.branchRgm || '—'}</strong></div>
                            <div><span>Branch CM Business</span><strong>{branch.branchCmBusiness || '—'}</strong></div>
                            <div><span>Branch GM Business</span><strong>{branch.branchGmBusiness || '—'}</strong></div>
                            <div className="branch-detail-address"><span>Branch Address</span><strong>{branch.branchAddress || '—'}</strong></div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td className="empty-state" colSpan={7}>
                    {search ? 'No branches match this search.' : 'No branches have been added yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredBranches.length > 0 && (
          <nav className="branch-pagination" aria-label="Branch list pages">
            <span>
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredBranches.length)} of{' '}
              {filteredBranches.length} branches
            </span>
            <div className="branch-pagination-actions">
              <button
                className="secondary-btn"
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {pageCount}</span>
              <button
                className="secondary-btn"
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                disabled={currentPage === pageCount}
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </section>
    </main>
  )
}
