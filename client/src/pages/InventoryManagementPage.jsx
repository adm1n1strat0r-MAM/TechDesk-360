import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getInventoryOverview,
  getInventoryRecords,
  importInventoryRows,
} from '../api'
import PageHeader from '../components/common/PageHeader'
import '../styles/InventoryManagementPage.css'

const inventoryImportHeaders = {
  'branch code': 'branchCode',
  branch: 'branchName',
  'branch name': 'branchName',
  region: 'region',
  area: 'area',
  floor: 'floor',
  'employee domain id': 'employeeDomainId',
  'user name': 'userName',
  department: 'department',
  'pc/vdi': 'pcVdi',
  pc: 'pcVdi',
  laptop: 'pcVdi',
  'make.model': 'computerModel',
  'computer model': 'computerModel',
  'serial no.': 'computerSerial',
  'computer serial': 'computerSerial',
  'host name': 'hostname',
  'printer model': 'printerModel',
  'serial no': 'printerSerial',
  'printer serial': 'printerSerial',
  scanner: 'scannerModel',
  'scanner model': 'scannerModel',
  serial: 'validationPrinterSerial',
  'validation printer model': 'validationPrinterModel',
  'validation printer serial': 'validationPrinterSerial',
  'led make': 'ledMake',
  'make/model': 'ledMake',
  'led serial': 'ledSerial',
  'bio make': 'bioMake',
  'bio serial': 'bioSerial',
}

const inventoryDefaultHeaders = [
  'Branch Code', 'Branch', 'Region', 'Area', 'Floor', 'Employee Domain ID',
  'User Name', 'Department', 'PC/VDI', 'Make.Model', 'Serial No.', 'Host name',
  'Printer Model', 'Serial No', 'SCANNER', 'SERIAL', 'Validation Printer Model',
  'Serial', 'LED Make', 'LED Serial', 'Bio Make', 'Bio Serial',
]

const inventoryLegacyHeaders = [
  'Branch Code', 'Branch', 'Region', 'Area', 'Floor', 'Employee Domain ID',
  'User Name', 'Department', 'PC/VDI', 'Make.Model', 'Serial No.', 'Host name',
  'Printer Model', 'Serial No', 'SCANNER', 'SERIAL', 'Validation Printer Model',
  'Serial', 'Make/Model', 'Bio Make',
]

const inventoryPreviewColumns = [
  ['Branch Code', 'branchCode'], ['Branch', 'branchName'], ['Region', 'region'],
  ['Area', 'area'], ['Floor', 'floor'], ['Employee Domain ID', 'employeeDomainId'],
  ['User Name', 'userName'], ['Department', 'department'], ['PC/VDI', 'pcVdi'],
  ['Computer Model', 'computerModel'], ['Computer Serial', 'computerSerial'],
  ['Host Name', 'hostname'], ['Printer Model', 'printerModel'],
  ['Printer Serial', 'printerSerial'], ['Scanner Model', 'scannerModel'],
  ['Scanner Serial', 'scannerSerial'], ['Validation Printer Model', 'validationPrinterModel'],
  ['Validation Printer Serial', 'validationPrinterSerial'], ['LED Make', 'ledMake'],
  ['LED Serial', 'ledSerial'], ['BIO Make', 'bioMake'], ['BIO Serial', 'bioSerial'],
]

const employeeDetailFields = [
  ['Branch Code', 'branchCode'], ['Branch', 'branchName'], ['Region', 'region'],
  ['Area', 'area'], ['Floor', 'floor'], ['Employee Domain ID', 'employeeDomainId'],
  ['User Name', 'userName'], ['Department', 'department'], ['PC / Device', 'pcVdi'],
  ['PC Make', 'computerModel'], ['Device Serial', 'computerSerial'],
  ['Hostname', 'hostname'], ['Printer Model', 'printerModel'],
  ['Printer Serial', 'printerSerial'], ['Scanner Model', 'scannerModel'],
  ['Scanner Serial', 'scannerSerial'], ['Validation Printer Model', 'validationPrinterModel'],
  ['Validation Printer Serial', 'validationPrinterSerial'], ['LED Make', 'ledMake'],
  ['LED Serial', 'ledSerial'], ['BIO Make', 'bioMake'], ['BIO Serial', 'bioSerial'],
]

const deviceSerialFields = [
  ['PC / Laptop', 'computerSerial'],
  ['Printer', 'printerSerial'],
  ['Scanner', 'scannerSerial'],
  ['Validation printer', 'validationPrinterSerial'],
  ['LED', 'ledSerial'],
  ['BIO', 'bioSerial'],
]

function employeeDeviceLabel(record) {
  const devices = []
  if (record.pcVdi) devices.push(record.pcVdi)
  else if (record.computerModel || record.computerSerial || record.hostname) devices.push('PC / Laptop')
  if (record.printerModel) devices.push('Printer')
  if (record.validationPrinterModel) devices.push('Validation printer')
  if (record.scannerModel) devices.push('Scanner')
  if (record.ledMake) devices.push('LED')
  if (record.bioMake) devices.push('BIO')
  return [...new Set(devices)].join(', ') || '—'
}

function employeeDeviceSerial(record) {
  return deviceSerialFields
    .filter(([, field]) => record[field])
    .map(([label, field]) => `${label}: ${record[field]}`)
    .join(' | ') || '—'
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

function inventoryFieldForHeader(header) {
  const exact = header.trim()
  if (exact === 'SERIAL') return 'scannerSerial'
  return inventoryImportHeaders[exact.toLowerCase().replace(/\s+/g, ' ')] || ''
}

function parseInventorySpreadsheet(text) {
  const rows = splitSpreadsheetText(text.replace(/^\uFEFF/, ''))
  if (!rows.length) return { rows: [], error: 'Copy inventory rows from Excel first.' }

  const normalizeHeader = (value) => value.trim().toLowerCase().replace(/\s+/g, ' ')
  const firstRowHeaders = rows[0].map(normalizeHeader)
  const hasHeader = firstRowHeaders.some((header) => inventoryImportHeaders[header])
  const headers = hasHeader
    ? rows[0]
    : rows[0].length <= inventoryLegacyHeaders.length
      ? inventoryLegacyHeaders
      : inventoryDefaultHeaders
  const columnFields = headers.map(inventoryFieldForHeader)
  if (!columnFields.includes('branchCode') || !columnFields.includes('branchName')) {
    return { rows: [], error: 'Include Branch Code and Branch columns in the copied range.' }
  }
  if (!columnFields.some((field) => [
    'pcVdi', 'computerModel', 'printerModel', 'validationPrinterModel',
    'scannerModel', 'ledMake', 'bioMake',
  ].includes(field))) {
    return { rows: [], error: 'Include at least one PC/VDI or equipment model column.' }
  }

  const dataRows = hasHeader ? rows.slice(1) : rows
  if (!dataRows.length) return { rows: [], error: 'The copied range has a header but no data rows.' }
  if (dataRows.length > 5000) return { rows: [], error: 'Import 5,000 inventory rows or fewer at a time.' }

  const fields = [
    'branchCode', 'branchName', 'region', 'area', 'floor', 'employeeDomainId',
    'userName', 'department', 'pcVdi', 'computerModel', 'computerSerial',
    'hostname', 'printerModel', 'printerSerial', 'scannerModel', 'scannerSerial',
    'validationPrinterModel', 'validationPrinterSerial', 'ledMake', 'ledSerial',
    'bioMake', 'bioSerial',
  ]
  const importedRows = dataRows.map((cells) => {
    const record = Object.fromEntries(fields.map((field) => [field, '']))
    headers.forEach((header, index) => {
      const value = cells[index] || ''
      const field = inventoryFieldForHeader(header)
      if (field) record[field] = value
    })
    return record
  })

  return { rows: importedRows, error: '' }
}

function useInventorySummary() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setSummary(await getInventoryOverview())
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { summary, loading, error, refresh }
}

function StatCard({ label, value, note, tone = 'teal' }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-header"><span className="stat-label">{label}</span></div>
      <div className="stat-value">{Number(value || 0).toLocaleString()}</div>
      <div className="stat-detail">{note}</div>
    </article>
  )
}

function CategoryPanel({ title, detail, category }) {
  const modelCount = category?.models?.reduce((sum, model) => sum + model.count, 0) || 0
  const unmodeledCount = Math.max(0, (category?.total || 0) - modelCount)
  return (
    <section className="panel-card inventory-category-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{detail}</p>
          <h3>{title}</h3>
        </div>
        <strong className="inventory-category-total">{category?.total || 0}</strong>
      </div>
      {category?.models?.length ? (
        <ul className="inventory-model-list">
          {category.models.map(({ label, count }) => (
            <li key={label}><span>{label}</span><strong>{count}</strong></li>
          ))}
        </ul>
      ) : <p className="inventory-muted">No matching items in this location.</p>}
      {unmodeledCount > 0 && <p className="inventory-muted">{unmodeledCount} items have no usable model value.</p>}
    </section>
  )
}

function LocationDetails({ location }) {
  if (!location) return null
  const isBackOffice = location.locationType === 'back-office'
  return (
    <section className="inventory-location-details">
      <div className="inventory-location-heading">
        <div>
          <p className="eyebrow">{location.region || location.area || 'Location'} · {location.branchCode}</p>
          <h3>{location.branchName}</h3>
        </div>
        <span className="inventory-system-count">{location.systemCount} PC / Laptop systems</span>
      </div>

      <div className="inventory-category-grid">
        {isBackOffice && <CategoryPanel title="PC / Laptop systems" detail="By model" category={{ total: location.systemCount, models: location.systemModels }} />}
        {!isBackOffice && location.systemCount > 0 && <CategoryPanel title="PC / Laptop systems" detail="By model" category={{ total: location.systemCount, models: location.systemModels }} />}
        {!isBackOffice && <>
          <CategoryPanel title="Printers" detail="Standard printers" category={location.printers} />
          <CategoryPanel title="Validation printers" detail="Validation" category={location.validationPrinters} />
          <CategoryPanel title="Scanners" detail="By model" category={location.scanners} />
          <CategoryPanel title="BIO devices" detail="Grouped by make" category={location.biometrics} />
          <CategoryPanel title="LED displays" detail="Grouped by make" category={location.leds} />
        </>}
      </div>

      {location.systemTypes?.length > 0 && (
        <p className="inventory-type-note">
          System types: {location.systemTypes.map(({ label, count }) => `${label} ${count}`).join(' · ')}
        </p>
      )}
      {location.otherTypes?.length > 0 && (
        <p className="inventory-type-note">
          Other device types in Branch Inventory: {location.otherTypes.map(({ label, count }) => `${label} ${count}`).join(' · ')}
        </p>
      )}
    </section>
  )
}

function LocationTable({ locations, selectedCode, onSelect, emptyMessage }) {
  const [query, setQuery] = useState('')
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return locations
    return locations.filter((location) => [
      location.branchCode,
      location.branchName,
      location.region,
      location.area,
    ].some((value) => String(value || '').toLowerCase().includes(normalized)))
  }, [locations, query])

  return (
    <section className="panel-card inventory-locations-panel">
      <div className="panel-header inventory-list-header">
        <div>
          <p className="eyebrow">Locations</p>
          <h3>{locations.length.toLocaleString()} locations</h3>
        </div>
        <label className="inventory-search">
          <span className="visually-hidden">Search locations</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search code, name, region" />
        </label>
      </div>
      {matches.length ? (
        <div className="inventory-table-wrap">
          <table className="data-table inventory-table">
            <thead><tr><th>Branch</th><th>Region / Area</th><th>PC / Laptop systems</th><th>Printers</th><th>Validation</th><th>Scanners</th><th>BIO</th><th>LEDs</th><th /></tr></thead>
            <tbody>
              {matches.map((location) => (
                <tr key={location.branchCode} className={selectedCode === location.branchCode ? 'inventory-row--selected' : ''}>
                  <td><strong>{location.branchName}</strong><small>Code {location.branchCode}</small></td>
                  <td>{[location.region, location.area].filter(Boolean).join(' · ') || '—'}</td>
                  <td>{location.systemCount}</td>
                  <td>{location.printers.total}</td>
                  <td>{location.validationPrinters.total}</td>
                  <td>{location.scanners.total}</td>
                  <td>{location.biometrics.total}</td>
                  <td>{location.leds.total}</td>
                  <td><button type="button" className="inventory-view-btn" onClick={() => onSelect(location.branchCode)}>{selectedCode === location.branchCode ? 'Selected' : 'View'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="inventory-muted">{emptyMessage || 'No locations match this search.'}</p>}
    </section>
  )
}

function InventoryManagementPage({ title = 'Inventory Management', subtitle = 'Overview', canImport = false }) {
  const { summary, loading, error, refresh } = useInventorySummary()
  const [showImport, setShowImport] = useState(false)
  const [spreadsheetText, setSpreadsheetText] = useState('')
  const [previewRows, setPreviewRows] = useState([])
  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  const [importError, setImportError] = useState('')

  const previewSpreadsheet = () => {
    setImportMessage('')
    setImportError('')
    const parsed = parseInventorySpreadsheet(spreadsheetText)
    setPreviewRows(parsed.rows)
    setImportError(parsed.error)
  }

  const importSpreadsheet = async () => {
    setImportMessage('')
    setImportError('')
    const parsed = parseInventorySpreadsheet(spreadsheetText)
    setPreviewRows(parsed.rows)
    if (parsed.error) {
      setImportError(parsed.error)
      return
    }

    setImporting(true)
    try {
      const result = await importInventoryRows(parsed.rows)
      setImportMessage(`${result.createdCount} inventory rows added and ${result.updatedCount} matching rows refreshed.`)
      setSpreadsheetText('')
      setPreviewRows([])
      await refresh()
    } catch (importFailure) {
      setImportError(importFailure.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <main className="content-panel">
      <PageHeader title={title} subtitle={subtitle} />
      {canImport && <section className="panel-card inventory-import-panel">
        <div className="panel-header inventory-import-heading">
          <div>
            <p className="eyebrow">Spreadsheet import</p>
            <h3>Paste inventory rows from Excel</h3>
          </div>
          <button className="secondary-btn" type="button" aria-expanded={showImport} onClick={() => setShowImport((visible) => !visible)}>
            {showImport ? 'Hide import' : 'Import from Excel'}
          </button>
        </div>
        {showImport && (
          <div className="inventory-import-content">
            <p className="inventory-muted">
              Copy the inventory cells in Excel, including the header row, then paste them below. Preview the mapped rows before importing. The original column order also works without headers.
            </p>
            <label className="form-field">
              <span>Copied Excel rows</span>
              <textarea
                rows={8}
                value={spreadsheetText}
                onChange={(event) => {
                  setSpreadsheetText(event.target.value)
                  setPreviewRows([])
                  setImportError('')
                  setImportMessage('')
                }}
                placeholder={'Branch Code\tBranch\tRegion\tArea\tFloor\tEmployee Domain ID\tUser Name\tDepartment\tPC/VDI\tMake.Model\tSerial No.\tHost name\tPrinter Model\tSerial No\tSCANNER\tSERIAL\tValidation Printer Model\tSerial\tLED Make\tLED Serial\tBio Make\tBio Serial'}
              />
            </label>
            <div className="form-actions">
              <button className="secondary-btn" type="button" onClick={previewSpreadsheet} disabled={!spreadsheetText.trim() || importing || loading}>
                Preview rows
              </button>
              <button className="primary-btn" type="button" onClick={importSpreadsheet} disabled={!previewRows.length || importing || loading}>
                {importing ? 'Importing...' : `Import ${previewRows.length} rows`}
              </button>
            </div>
            {previewRows.length > 0 && (
              <>
                <p className="inventory-muted">Previewing all {previewRows.length.toLocaleString()} rows, including user and equipment details.</p>
                <div className="inventory-table-wrap inventory-preview-wrap">
                  <table className="data-table inventory-import-preview">
                    <thead><tr>{inventoryPreviewColumns.map(([label]) => <th key={label}>{label}</th>)}</tr></thead>
                    <tbody>
                      {previewRows.map((row, index) => (
                        <tr key={`${row.branchCode}-${row.employeeDomainId}-${index}`}>
                          {inventoryPreviewColumns.map(([, field]) => <td key={field}>{row[field] || '—'}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {importError && <p className="inventory-error" role="alert">{importError}</p>}
            {importMessage && <p className="inventory-message" role="status">{importMessage}</p>}
          </div>
        )}
      </section>}
      {error && <p className="inventory-error">{error}</p>}
      {loading ? <p className="inventory-muted">Loading inventory summary...</p> : summary && (
        <>
          <section className="stats-grid inventory-stats-grid">
            <StatCard label="Inventory rows" value={summary.recordCount} note="Rows stored from Excel imports" tone="teal" />
            <StatCard label="Back offices" value={summary.backOfficeCount} note="More than 10 PCs / laptops" tone="blue" />
            <StatCard label="Branch inventory locations" value={summary.branchLocationCount} note="Other equipment and smaller locations" tone="purple" />
            <StatCard label="Branch codes" value={summary.branchCount} note={`${summary.uncodedRecordCount} rows without a branch code`} tone="teal" />
          </section>

          <section className="panel-card inventory-overview-panel">
            <div className="panel-header">
              <div><p className="eyebrow">All locations</p><h3>Equipment summary</h3></div>
              <span className="inventory-rule">Back office: more than 10 PCs / laptops</span>
            </div>
            <div className="inventory-category-grid">
              <CategoryPanel title="PC / Laptop systems" detail="By model" category={{ total: summary.overall.systemCount, models: summary.overall.systemModels }} />
              <CategoryPanel title="Printers" detail="Standard printers" category={summary.overall.printers} />
              <CategoryPanel title="Validation printers" detail="Validation" category={summary.overall.validationPrinters} />
              <CategoryPanel title="Scanners" detail="By model" category={summary.overall.scanners} />
              <CategoryPanel title="BIO devices" detail="Grouped by make" category={summary.overall.biometrics} />
              <CategoryPanel title="LED displays" detail="Grouped by make" category={summary.overall.leds} />
            </div>
            <p className="inventory-type-note">Only PC and Laptop devices count toward the back-office threshold. Other device types are summarized in Branch Inventory. BIO and LED totals are grouped by make.</p>
          </section>
        </>
      )}
    </main>
  )
}

function InventoryLocationPage({ mode }) {
  const { summary, loading, error } = useInventorySummary()
  const isBackOffice = mode === 'back-office'
  const locations = isBackOffice ? summary?.backOffices || [] : summary?.branches || []
  const [selectedCode, setSelectedCode] = useState('')

  useEffect(() => {
    if (locations.length && !locations.some((item) => item.branchCode === selectedCode)) {
      setSelectedCode(locations[0].branchCode)
    }
  }, [locations, selectedCode])

  const selected = locations.find((item) => item.branchCode === selectedCode)
  const title = isBackOffice ? 'Back Office Inventory' : 'Branch Inventory'
  const subtitle = isBackOffice
    ? 'PC and Laptop systems at locations with more than 10 systems'
    : 'Other devices from larger locations, plus all inventory at smaller locations'

  return (
    <main className="content-panel">
      <PageHeader title={title} subtitle={subtitle} eyebrow="Inventory Management" />
      {error && <p className="inventory-error">{error}</p>}
      {loading ? <p className="inventory-muted">Loading location summaries…</p> : (
        <>
          <section className="stats-grid inventory-stats-grid inventory-location-stats">
            <StatCard label="Locations" value={locations.length} note={isBackOffice ? 'Classified as back offices' : 'Classified as branches'} tone={isBackOffice ? 'blue' : 'purple'} />
            <StatCard label="PC / Laptop systems" value={locations.reduce((sum, item) => sum + item.systemCount, 0)} note={isBackOffice ? 'PC and Laptop devices' : 'At locations classified as branches'} tone="teal" />
            <StatCard label="Printers" value={locations.reduce((sum, item) => sum + item.printers.total, 0)} note="Standard printer models" tone="blue" />
            <StatCard label="Scanners" value={locations.reduce((sum, item) => sum + item.scanners.total, 0)} note="Scanner models" tone="purple" />
          </section>
          <LocationTable locations={locations} selectedCode={selectedCode} onSelect={setSelectedCode} />
          <LocationDetails location={selected} />
          {summary?.uncodedRecordCount > 0 && <p className="inventory-type-note">{summary.uncodedRecordCount} source row without a branch code is preserved but omitted from location summaries.</p>}
        </>
      )}
    </main>
  )
}

export function BackOfficeInventoryPage() {
  return <InventoryLocationPage mode="back-office" />
}

export function BranchInventoryPage() {
  return <InventoryLocationPage mode="branch" />
}

export function EmployeeInventoryPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    let active = true
    getInventoryRecords()
      .then((inventoryRecords) => {
        if (!active) return
        setRecords(inventoryRecords)
        setError('')
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filteredRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return records
    return records.filter((record) => employeeDetailFields.some(([, field]) =>
      String(record[field] || '').toLowerCase().includes(normalized),
    ))
  }, [records, query])

  useEffect(() => {
    if (!filteredRecords.length) {
      setSelectedId('')
      return
    }
    if (!filteredRecords.some((record) => String(record._id) === selectedId)) {
      setSelectedId(String(filteredRecords[0]._id))
    }
  }, [filteredRecords, selectedId])

  const selectedRecord = records.find((record) => String(record._id) === selectedId)

  return (
    <main className="content-panel">
      <PageHeader
        title="Employee Detail"
        subtitle="Inventory and assigned device details by employee"
        eyebrow="Inventory Management"
      />
      {error && <p className="inventory-error" role="alert">{error}</p>}
      <section className="panel-card inventory-locations-panel">
        <div className="panel-header inventory-list-header">
          <div>
            <p className="eyebrow">Inventory records</p>
            <h3>{filteredRecords.length.toLocaleString()} of {records.length.toLocaleString()} records</h3>
          </div>
          <label className="inventory-search">
            <span className="visually-hidden">Search employee inventory</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search branch, domain ID, user, serial"
            />
          </label>
        </div>
        {loading ? <p className="inventory-muted">Loading employee inventory...</p> : filteredRecords.length ? (
          <div className="inventory-table-wrap">
            <table className="data-table inventory-employee-table">
              <thead>
                <tr>
                  <th>Branch Code</th>
                  <th>User Domain ID</th>
                  <th>User Name</th>
                  <th>PC / Device</th>
                  <th>Department</th>
                  <th>Device Serial</th>
                  <th>PC Make</th>
                  <th>Hostname</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record._id} className={String(record._id) === selectedId ? 'inventory-row--selected' : ''}>
                    <td>{record.branchCode || '—'}</td>
                    <td>{record.employeeDomainId || '—'}</td>
                    <td>{record.userName || '—'}</td>
                    <td>{employeeDeviceLabel(record)}</td>
                    <td>{record.department || '—'}</td>
                    <td>{employeeDeviceSerial(record)}</td>
                    <td>{record.computerModel || '—'}</td>
                    <td>{record.hostname || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="inventory-view-btn"
                        aria-pressed={String(record._id) === selectedId}
                        onClick={() => setSelectedId(String(record._id))}
                      >
                        {String(record._id) === selectedId ? 'Selected' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="inventory-muted">No employee inventory records match this search.</p>}
      </section>

      {selectedRecord && (
        <section className="panel-card inventory-employee-detail-panel" aria-live="polite">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Selected inventory row</p>
              <h3>{selectedRecord.userName || selectedRecord.employeeDomainId || 'Employee record'}</h3>
            </div>
            <span className="inventory-system-count">Branch {selectedRecord.branchCode || '—'}</span>
          </div>
          <dl className="inventory-employee-detail-grid">
            {employeeDetailFields.map(([label, field]) => (
              <div key={field}>
                <dt>{label}</dt>
                <dd>{selectedRecord[field] || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
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
