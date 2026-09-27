import { useState } from 'react'
import { createPortal } from 'react-dom'
import PageHeader from '../components/common/PageHeader'
import '../styles/DashboardPage.css'
import '../styles/LabManagementPage.css'

const actionOptions = [
  'Repair',
  'Replacement',
  'Warranty Claim',
  'New Equipment',
  'Windows Installation',
]

const receivedItemOptions = [
  'Windows Client',
  'Zero Client',
  'Printer',
  'Scanner',
  'Laptop',
]

const statuses = ['Open', 'In Progress', 'Warranty', 'Completed', 'Closed']

const localDateInput = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const displayDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

const emptyCaseForm = () => ({
  branchCode: '',
  branchName: '',
  department: '',
  dateIn: localDateInput(),
  dateOut: '',
  userDomain: '',
  sdnNumber: '',
  actionIssue: '',
  serialNo: '',
  itemReceived: '',
  remarks: '',
})

const caseToForm = (item) => ({
  branchCode: item.branchCode || '',
  branchName: item.branchName || '',
  department: item.department || '',
  dateIn: item.dateIn || '',
  dateOut: item.dateOut || '',
  userDomain: item.userDomain || '',
  sdnNumber: item.sdnNumber || '',
  actionIssue: item.actionIssue || '',
  serialNo: item.serialNo || '',
  itemReceived: item.itemReceived || '',
  remarks: item.remarks || '',
})

function CaseFields({ form, update, srNumber, currentDate }) {
  return (
    <div className="form-grid lab-case-fields">
      <label className="form-field">
        <span>SR</span>
        <input value={srNumber} readOnly />
      </label>
      <label className="form-field">
        <span>Current Date</span>
        <input type="date" value={currentDate} readOnly />
      </label>
      <label className="form-field">
        <span>Branch Code</span>
        <input name="branchCode" value={form.branchCode} onChange={update} required />
      </label>
      <label className="form-field">
        <span>Branch Name</span>
        <input name="branchName" value={form.branchName} onChange={update} required />
      </label>
      <label className="form-field">
        <span>Department</span>
        <input name="department" value={form.department} onChange={update} required />
      </label>
      <label className="form-field">
        <span>Date IN</span>
        <input name="dateIn" type="date" value={form.dateIn} onChange={update} required />
      </label>
      <label className="form-field">
        <span>Date OUT (optional)</span>
        <input
          name="dateOut"
          type="date"
          min={form.dateIn}
          value={form.dateOut}
          onChange={update}
        />
      </label>
      <label className="form-field">
        <span>User / Domain</span>
        <input
          name="userDomain"
          value={form.userDomain}
          onChange={update}
          placeholder="User name or domain ID"
          required
        />
      </label>
      <label className="form-field">
        <span>SDN#</span>
        <input name="sdnNumber" value={form.sdnNumber} onChange={update} required />
      </label>
      <label className="form-field">
        <span>Action / Issue</span>
        <select name="actionIssue" value={form.actionIssue} onChange={update} required>
          <option value="">Select an action</option>
          {actionOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Serial No</span>
        <input name="serialNo" value={form.serialNo} onChange={update} required />
      </label>
      <label className="form-field">
        <span>Item Received</span>
        <select name="itemReceived" value={form.itemReceived} onChange={update} required>
          <option value="">Select an item</option>
          {receivedItemOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field lab-case-remarks">
        <span>Remarks</span>
        <textarea
          name="remarks"
          value={form.remarks}
          onChange={update}
          placeholder="Add a short description"
          maxLength={1000}
          rows={3}
        />
      </label>
    </div>
  )
}

function CaseEditDialog({ item, onSave, onCancel }) {
  const [form, setForm] = useState(() => caseToForm(item))
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await onSave(item.id, form)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return createPortal(
    <div className="lab-dialog-backdrop">
      <section className="lab-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-case-title">
        <div className="section-heading">
          <p className="eyebrow">{item.status === 'Open' ? 'Before approval' : 'Approver edit'}</p>
          <h3 id="edit-case-title">Edit {item.srNumber}</h3>
        </div>
        <form onSubmit={submit}>
          <CaseFields
            form={form}
            update={update}
            srNumber={item.srNumber}
            currentDate={localDateInput(new Date(item.openedAt))}
          />
          {error && <p role="alert">{error}</p>}
          <div className="form-actions">
            <button className="primary-btn" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
            <button className="secondary-btn" type="button" onClick={onCancel} disabled={isSaving}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  )
}

function CaseTable({
  cases,
  showApprove = false,
  onApprove,
  onWarranty,
  onClose,
  onEdit,
  editableStatuses,
  loading = false,
  loadError = '',
}) {
  const hasActions = showApprove || onWarranty || onClose || onEdit
  const [actionError, setActionError] = useState('')
  const [pendingId, setPendingId] = useState('')
  const [editingCase, setEditingCase] = useState(null)

  const runAction = async (id, action) => {
    setActionError('')
    setPendingId(id)
    try {
      await action(id)
    } catch (error) {
      setActionError(error.message)
    } finally {
      setPendingId('')
    }
  }

  const saveEdit = async (id, form) => {
    await onEdit(id, form)
    setEditingCase(null)
  }

  return (
    <>
      {loading && <p>Loading lab cases from the server…</p>}
      {loadError && <p role="alert">{loadError}</p>}
      {actionError && <p role="alert">{actionError}</p>}
      <div className="table-wrap">
        <table className="data-table lab-case-table">
          <thead>
            <tr>
              <th>SR</th>
              <th>Current Date</th>
              <th>Branch Code</th>
              <th>Branch Name</th>
              <th>Department</th>
              <th>Date IN</th>
              <th>Date OUT</th>
              <th>User / Domain</th>
              <th>SDN#</th>
              <th>Action / Issue</th>
              <th>Serial No</th>
              <th>Item Received</th>
              <th>Remarks</th>
              <th>Status</th>
              {hasActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {cases.length ? (
              cases.map((item) => (
                <tr key={item.id}>
                  <td>{item.srNumber}</td>
                  <td>{displayDate(item.openedAt)}</td>
                  <td>{item.branchCode}</td>
                  <td>{item.branchName}</td>
                  <td>{item.department}</td>
                  <td>{displayDate(item.dateIn)}</td>
                  <td>{displayDate(item.dateOut)}</td>
                  <td>{item.userDomain}</td>
                  <td>{item.sdnNumber}</td>
                  <td>{item.actionIssue}</td>
                  <td>{item.serialNo}</td>
                  <td>{item.itemReceived}</td>
                  <td title={item.remarks}>{item.remarks || '—'}</td>
                  <td>{item.status}</td>
                  {hasActions && (
                    <td>
                      <div className="row-actions">
                        {onEdit &&
                          (!editableStatuses || editableStatuses.includes(item.status)) && (
                          <button
                            className="action-btn action-btn--edit"
                            type="button"
                            disabled={pendingId === item.id}
                            onClick={() => setEditingCase(item)}
                          >
                            Edit case
                          </button>
                        )}
                        {item.status === 'Open' && showApprove && (
                          <button
                            className="action-btn primary-btn"
                            type="button"
                            disabled={pendingId === item.id}
                            onClick={() => runAction(item.id, onApprove)}
                          >
                            {pendingId === item.id ? 'Approving…' : 'Approve case'}
                          </button>
                        )}
                        {item.status === 'In Progress' && onWarranty && (
                          <button
                            className="action-btn"
                            type="button"
                            disabled={pendingId === item.id}
                            onClick={() => runAction(item.id, onWarranty)}
                          >
                            Send to warranty
                          </button>
                        )}
                        {['In Progress', 'Warranty'].includes(item.status) && onClose && (
                          <button
                            className="action-btn action-btn--delete"
                            type="button"
                            disabled={pendingId === item.id}
                            onClick={() => runAction(item.id, onClose)}
                          >
                            Close case
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td className="empty-state" colSpan={hasActions ? 15 : 14}>
                  No cases to show.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editingCase && (
        <CaseEditDialog
          key={editingCase.id}
          item={editingCase}
          onSave={saveEdit}
          onCancel={() => setEditingCase(null)}
        />
      )}
    </>
  )
}

export function NewLabCasePage({
  cases,
  onCreate,
  onUpdate,
  loading = false,
  loadError = '',
}) {
  const [form, setForm] = useState(emptyCaseForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const currentDate = localDateInput()

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)
    try {
      const createdCase = await onCreate(form)
      setMessage(`${createdCase.srNumber} opened successfully.`)
      setForm(emptyCaseForm())
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="content-panel">
      <PageHeader
        title="New Case"
        subtitle="Open a lab service request"
        eyebrow="Lab Management"
      />
      <section className="crud-shell lab-case-shell">
        <form className="crud-form lab-case-form" onSubmit={submit}>
          <div className="section-heading">
            <p className="eyebrow">Case intake</p>
            <h3>Service request details</h3>
          </div>
          <CaseFields
            form={form}
            update={update}
            srNumber="Generated when case opens"
            currentDate={currentDate}
          />
          <div className="form-actions">
            <button className="primary-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Opening case…' : 'Open Case'}
            </button>
          </div>
          {loadError && <p role="alert">{loadError}</p>}
          {error && <p role="alert">{error}</p>}
          {message && <p role="status">{message}</p>}
        </form>

        <div className="table-panel">
          <div className="section-heading">
            <p className="eyebrow">Awaiting approval</p>
            <h3>Open cases — edit until approved</h3>
          </div>
          <CaseTable
            cases={cases.filter((item) => item.status === 'Open')}
            onEdit={onUpdate}
            editableStatuses={['Open']}
            loading={loading}
          />
        </div>
      </section>
    </main>
  )
}

export function NewLabCasesPage({
  cases,
  onApprove,
  onWarranty,
  onClose,
  onUpdate,
  loading,
  loadError,
}) {
  const openCases = cases.filter((item) => item.status === 'Open')
  const activeCases = cases.filter((item) =>
    ['Open', 'In Progress', 'Warranty'].includes(item.status),
  )

  return (
    <main className="content-panel">
      <PageHeader
        title="New Cases"
        subtitle="Approve requests, edit approved work, and close completed cases"
        eyebrow="Lab Management"
      />
      <section className="panel-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Approval and active queue</p>
            <h3>
              {openCases.length} case{openCases.length === 1 ? '' : 's'} awaiting approval
            </h3>
            <p className="timeline-meta">Approvers can edit a case after approving it.</p>
          </div>
        </div>
        <CaseTable
          cases={activeCases}
          showApprove
          onApprove={onApprove}
          onWarranty={onWarranty}
          onClose={onClose}
          onEdit={onUpdate}
          editableStatuses={['In Progress', 'Warranty']}
          loading={loading}
          loadError={loadError}
        />
      </section>
    </main>
  )
}

const initialFilters = {
  search: '',
  status: '',
  actionIssue: '',
  itemReceived: '',
  branch: '',
  department: '',
  openedFrom: '',
  openedTo: '',
  dateFrom: '',
  dateTo: '',
}

export function LabCasesSummaryPage({ cases, loading, loadError }) {
  const [filters, setFilters] = useState(initialFilters)
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const openCount = cases.filter((item) => item.status === 'Open').length
  const inProgressCount = cases.filter((item) => item.status === 'In Progress').length
  const warrantyCount = cases.filter((item) => item.status === 'Warranty').length
  const completedCount = cases.filter((item) =>
    ['Completed', 'Closed'].includes(item.status),
  ).length

  const updateFilter = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }
  const searchText = filters.search.trim().toLowerCase()
  const filteredCases = cases.filter((item) => {
    const openedDate = item.openedAt ? item.openedAt.slice(0, 10) : ''
    const searchable = [
      item.srNumber,
      item.branchCode,
      item.branchName,
      item.department,
      item.userDomain,
      item.sdnNumber,
      item.actionIssue,
      item.serialNo,
      item.itemReceived,
      item.remarks,
      item.status,
      item.openedAt,
      item.dateIn,
      item.dateOut,
    ]
      .join(' ')
      .toLowerCase()
    return (
      (!searchText || searchable.includes(searchText)) &&
      (!filters.status || item.status === filters.status) &&
      (!filters.actionIssue || item.actionIssue === filters.actionIssue) &&
      (!filters.itemReceived || item.itemReceived === filters.itemReceived) &&
      (!filters.branch ||
        `${item.branchCode} ${item.branchName}`
          .toLowerCase()
          .includes(filters.branch.trim().toLowerCase())) &&
      (!filters.department ||
        item.department.toLowerCase().includes(filters.department.trim().toLowerCase())) &&
      (!filters.openedFrom || openedDate >= filters.openedFrom) &&
      (!filters.openedTo || openedDate <= filters.openedTo) &&
      (!filters.dateFrom || item.dateIn >= filters.dateFrom) &&
      (!filters.dateTo || item.dateIn <= filters.dateTo)
    )
  })

  return (
    <main className="content-panel">
      <PageHeader
        title="Cases Summary"
        subtitle="Filter and review the full lab service request register"
        eyebrow="Lab Management"
      />
      <div className="lab-summary-stats-wrap">
        <section className="overview-grid lab-summary-stats">
          <article className="overview-card">
            <span className="overview-label">Total cases</span>
            <strong className="overview-value">{cases.length}</strong>
          </article>
          <article className="overview-card">
            <span className="overview-label">Open</span>
            <strong className="overview-value">{openCount}</strong>
          </article>
          <article className="overview-card">
            <span className="overview-label">In progress</span>
            <strong className="overview-value">{inProgressCount}</strong>
          </article>
          <article className="overview-card">
            <span className="overview-label">Warranty</span>
            <strong className="overview-value">{warrantyCount}</strong>
          </article>
          <article className="overview-card">
            <span className="overview-label">Completed / closed</span>
            <strong className="overview-value">{completedCount}</strong>
          </article>
        </section>
      </div>
      <section className="panel-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Case register</p>
            <h3>All cases</h3>
          </div>
          <span className="lab-filter-count">
            Showing {filteredCases.length} of {cases.length}
          </span>
        </div>
        <div className="lab-filter-toolbar" aria-label="Filter cases">
          <label className="lab-filter-field lab-filter-field--search">
            <span>Search all case details</span>
            <input
              name="search"
              value={filters.search}
              onChange={updateFilter}
              placeholder="Search any case fieldâ€¦"
            />
          </label>
          <button
            className="secondary-btn"
            type="button"
            onClick={() => {
              setFilters({ ...initialFilters })
              setShowMoreFilters(false)
            }}
          >
            Clear filters
          </button>
          <button
            className="secondary-btn lab-more-filters-button"
            type="button"
            aria-expanded={showMoreFilters}
            aria-controls="lab-advanced-filters"
            onClick={() => setShowMoreFilters((visible) => !visible)}
          >
            {showMoreFilters ? 'Hide filters' : 'More filters'}
          </button>
        </div>
        {showMoreFilters && (
          <div className="lab-filter-grid" id="lab-advanced-filters">
            <label className="lab-filter-field">
              <span>Status</span>
              <select name="status" value={filters.status} onChange={updateFilter}>
                <option value="">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="lab-filter-field">
              <span>Action / Issue</span>
              <select name="actionIssue" value={filters.actionIssue} onChange={updateFilter}>
                <option value="">All actions</option>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </label>
            <label className="lab-filter-field">
              <span>Item received</span>
              <select name="itemReceived" value={filters.itemReceived} onChange={updateFilter}>
                <option value="">All items</option>
                {receivedItemOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="lab-filter-field">
              <span>Branch code or name</span>
              <input
                name="branch"
                value={filters.branch}
                onChange={updateFilter}
                placeholder="Filter by branch"
              />
            </label>
            <label className="lab-filter-field">
              <span>Department</span>
              <input
                name="department"
                value={filters.department}
                onChange={updateFilter}
                placeholder="Filter by department"
              />
            </label>
            <label className="lab-filter-field">
              <span>Current date from</span>
              <input
                type="date"
                name="openedFrom"
                value={filters.openedFrom}
                onChange={updateFilter}
              />
            </label>
            <label className="lab-filter-field">
              <span>Current date to</span>
              <input
                type="date"
                name="openedTo"
                value={filters.openedTo}
                onChange={updateFilter}
              />
            </label>
            <label className="lab-filter-field">
              <span>Date IN from</span>
              <input type="date" name="dateFrom" value={filters.dateFrom} onChange={updateFilter} />
            </label>
            <label className="lab-filter-field">
              <span>Date IN to</span>
              <input type="date" name="dateTo" value={filters.dateTo} onChange={updateFilter} />
            </label>
          </div>
        )}
        <CaseTable cases={filteredCases} loading={loading} loadError={loadError} />
      </section>
    </main>
  )
}
