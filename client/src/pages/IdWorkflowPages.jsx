import { useEffect, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import '../styles/DashboardPage.css'

export const siteOptions = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'lab', label: 'Lab Management Overview' },
  { id: 'lab-new-case', label: 'Create Lab Case' },
  { id: 'lab-new-cases', label: 'Approve / Close Cases' },
  { id: 'lab-cases-summary', label: 'Lab Cases Summary' },
  { id: 'inventory', label: 'Inventory Management' },
  { id: 'inventory-back-office', label: 'Back Office Inventory' },
  { id: 'inventory-branch', label: 'Branch Inventory' },
  { id: 'inventory-employee-detail', label: 'Employee Detail' },
  { id: 'branch-management', label: 'Branch Management' },
  { id: 'branch-add', label: 'Add Branch' },
  { id: 'branch-list', label: 'Branch Details' },
  { id: 'store-management', label: 'Store Management' },
  { id: 'disposal-management', label: 'Disposal Management' },
  { id: 'id', label: 'ID Management Overview' },
  { id: 'id-new-user', label: 'Create User' },
  { id: 'id-users-details', label: 'User Details' },
  { id: 'id-role-management', label: 'Role Management' },
]

const NEW_ROLE_ID = '__new__'

const initialUserForm = (roles) => ({
  fullName: '',
  domainId: '',
  email: '',
  phone: '',
  role: roles[0]?.name ?? '',
  status: 'Pending',
})

export function NewIdUserPage({ roles, rolesLoading, rolesError, onCreate }) {
  const [form, setForm] = useState(() => initialUserForm(roles))
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (roles.length > 0 && !roles.some((role) => role.name === form.role)) {
      setForm((current) => ({ ...current, role: roles[0].name }))
    }
  }, [roles, form.role])

  const update = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const submit = (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    Promise.resolve(onCreate(form))
      .then((initialPassword) => {
        setMessage(`User created. Share this first-login password securely: ${initialPassword}`)
        setForm(initialUserForm(roles))
      })
      .catch((submitError) => setError(submitError.message))
  }

  return (
    <main className="content-panel">
      <PageHeader
        title="New User"
        subtitle="Create an employee ID record and assign a role"
        eyebrow="ID Management"
      />
      <section className="panel-card">
        <form className="crud-form" onSubmit={submit}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Employee record</p>
              <h3>User details</h3>
            </div>
          </div>
          <div className="form-grid">
            <label className="form-field">
              <span>Full name</span>
              <input
                name="fullName"
                required
                value={form.fullName}
                onChange={update}
                placeholder="Employee full name"
              />
            </label>
            <label className="form-field">
              <span>Domain ID</span>
              <input
                name="domainId"
                required
                value={form.domainId}
                onChange={update}
                placeholder="EMP-001"
              />
            </label>
            <label className="form-field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={update}
                placeholder="name@company.com"
              />
            </label>
            <label className="form-field">
              <span>IP phone (optional)</span>
              <input
                name="phone"
                value={form.phone}
                onChange={update}
                placeholder="Extension or phone number"
              />
            </label>
            <label className="form-field">
              <span>Role</span>
              <select name="role" value={form.role} onChange={update} required>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Status</span>
              <select name="status" value={form.status} onChange={update}>
                <option>Pending</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-btn" type="submit" disabled={rolesLoading || roles.length === 0}>
              Create User
            </button>
          </div>
          {rolesLoading && <p>Loading roles from the database…</p>}
          {rolesError && <p role="alert">{rolesError}</p>}
          {message && <p role="status">{message}</p>}
          {error && <p role="alert">{error}</p>}
        </form>
      </section>
    </main>
  )
}

export function IdUsersDetailsPage({
  users,
  roles,
  onToggleStatus,
  onChangeRole,
  onResetPassword,
  loading,
  loadError,
}) {
  const [search, setSearch] = useState('')
  const [statusError, setStatusError] = useState('')
  const [roleError, setRoleError] = useState('')
  const [updatingRoleId, setUpdatingRoleId] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [resetError, setResetError] = useState('')
  const query = search.trim().toLowerCase()
  const visibleUsers = users.filter((user) =>
    [user.fullName, user.domainId, user.email, user.phone, user.role, user.status].some(
      (value) => String(value ?? '').toLowerCase().includes(query),
    ),
  )

  const toggleStatus = async (id) => {
    setStatusError('')
    try {
      await onToggleStatus(id)
    } catch (error) {
      setStatusError(error.message)
    }
  }

  const changeRole = async (user, nextRole) => {
    if (nextRole === user.role) return
    setRoleError('')
    setUpdatingRoleId(user.id)
    try {
      await onChangeRole(user.id, nextRole)
    } catch (error) {
      setRoleError(error.message)
    } finally {
      setUpdatingRoleId('')
    }
  }

  const resetPassword = async (user) => {
    setResetError('')
    setResetMessage('')
    try {
      const result = await onResetPassword(user.id)
      setResetMessage(`Temporary password for ${user.fullName}: ${result.initialPassword}`)
    } catch (error) {
      setResetError(error.message)
    }
  }

  return (
    <main className="content-panel">
      <PageHeader
        title="Users Details"
        subtitle="Employee ID records and assigned roles"
        eyebrow="ID Management"
      />
      <section className="panel-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Directory</p>
            <h3>
              {users.length} employee record{users.length === 1 ? '' : 's'}
            </h3>
          </div>
        </div>
        <label className="inventory-search">
          <span>Search users</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, domain ID, email, IP phone, or role"
          />
        </label>
        {loading && <p>Loading users from the server…</p>}
        {loadError && <p role="alert">{loadError}</p>}
        {statusError && <p role="alert">{statusError}</p>}
        {roleError && <p role="alert">{roleError}</p>}
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Domain ID</th>
                <th>Email</th>
                <th>IP phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.length ? (
                visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.fullName}</td>
                    <td>{user.domainId}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || '—'}</td>
                    <td>
                      <select
                        className="role-select"
                        value={user.role}
                        disabled={updatingRoleId === user.id || roles.length === 0}
                        onChange={(event) => changeRole(user, event.target.value)}
                        aria-label={`Change role for ${user.fullName}`}
                      >
                        {!roles.some((role) => role.name === user.role) && (
                          <option value={user.role}>{user.role}</option>
                        )}
                        {roles.map((role) => (
                          <option key={role.id} value={role.name}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{user.status}</td>
                    <td>
                      <div className="row-actions">
                        <button className="action-btn" type="button" onClick={() => toggleStatus(user.id)}>
                          {user.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                        <button className="action-btn action-btn--edit" type="button" onClick={() => resetPassword(user)}>
                          Reset password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-state" colSpan="7">
                    No user records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {(resetMessage || resetError) && <p className="panel-card" role={resetError ? 'alert' : 'status'}>{resetMessage || resetError}</p>}
    </main>
  )
}

export function IdRoleManagementPage({ roles, onSave, onDelete, loading, loadError }) {
  const [selectedId, setSelectedId] = useState(
    roles[0]?.id ?? NEW_ROLE_ID,
  )
  const selectedRole = roles.find((role) => role.id === selectedId)
  const [roleName, setRoleName] = useState(selectedRole?.name ?? '')
  const [permissions, setPermissions] = useState(
    selectedRole?.permissions ?? [],
  )
  const [saveError, setSaveError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteMessage, setDeleteMessage] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const isExistingRole = Boolean(selectedId) && selectedId !== NEW_ROLE_ID

  const chooseRole = (event) => {
    setDeleteMessage('')
    setDeleteError('')
    if (event.target.value === NEW_ROLE_ID) {
      setSelectedId(NEW_ROLE_ID)
      setRoleName('')
      setPermissions([])
      setSaveMessage('')
      setSaveError('')
      return
    }

    const role = roles.find((item) => item.id === event.target.value)
    setSelectedId(role?.id ?? '')
    setRoleName(role?.name ?? '')
    setPermissions(role?.permissions ?? [])
    setSaveMessage('')
    setSaveError('')
  }

  const togglePermission = (permissionId) => {
    setPermissions((current) =>
      current.includes(permissionId)
        ? current.filter((item) => item !== permissionId)
        : [...current, permissionId],
    )
  }

  const saveRole = async (event) => {
    event.preventDefault()
    if (!roleName.trim()) return

    setSaveError('')
    setSaveMessage('')
    try {
      const savedRole = await onSave({
        id:
          selectedId && selectedId !== NEW_ROLE_ID
            ? selectedId
            : `role-${Date.now()}`,
        name: roleName.trim(),
        permissions,
      })
      setSelectedId(savedRole.id)
      setSaveMessage('Role access saved to the database.')
    } catch (error) {
      setSaveError(error.message)
    }
  }

  const deleteSelectedRole = async () => {
    if (!isExistingRole) return
    const confirmed = window.confirm(
      `Delete the "${roleName}" role? This cannot be undone.`,
    )
    if (!confirmed) return

    setDeleteError('')
    setDeleteMessage('')
    setIsDeleting(true)
    try {
      await onDelete(selectedId)
      setSelectedId(NEW_ROLE_ID)
      setRoleName('')
      setPermissions([])
      setSaveMessage('')
      setSaveError('')
      setDeleteMessage(`Role "${roleName}" was deleted from the database.`)
    } catch (error) {
      setDeleteError(error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="content-panel">
      <PageHeader
        title="Role Management"
        subtitle="Choose which site options each role can access"
        eyebrow="ID Management"
      />
      <section className="panel-card">
        {loading && <p>Loading roles from the server…</p>}
        {loadError && <p role="alert">{loadError}</p>}
        <form className="crud-form" onSubmit={saveRole}>
          <div className="form-grid">
            <label className="form-field">
              <span>Select role to edit</span>
              <select value={selectedId} onChange={chooseRole}>
                <option value={NEW_ROLE_ID}>Create a new role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Role name</span>
              <input
                value={roleName}
                onChange={(event) => setRoleName(event.target.value)}
                placeholder="e.g. Branch Manager"
                required
              />
            </label>
          </div>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Access permissions</p>
              <h3>Site options</h3>
            </div>
          </div>
          <div className="role-permission-grid">
            {siteOptions.map((option) => (
              <label className="role-permission" key={option.id}>
                <input
                  type="checkbox"
                  checked={permissions.includes(option.id)}
                  onChange={() => togglePermission(option.id)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <div className="form-actions">
            <button className="primary-btn" type="submit">
              Save Role Access
            </button>
            {isExistingRole && (
              <button
                className="action-btn action-btn--delete"
                type="button"
                onClick={deleteSelectedRole}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Delete Role'}
              </button>
            )}
          </div>
          {saveMessage && <p role="status">{saveMessage}</p>}
          {saveError && <p role="alert">{saveError}</p>}
          {deleteMessage && <p role="status">{deleteMessage}</p>}
          {deleteError && <p role="alert">{deleteError}</p>}
        </form>
      </section>
      <section className="panel-card overview-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Configured roles</p>
            <h3>Role access overview</h3>
          </div>
        </div>
        <div className="role-list">
          {roles.map((role) => (
            <article className="overview-section-card" key={role.id}>
              <div className="overview-section-card__top">
                <span>{role.name}</span>
                <strong>{role.permissions.length}</strong>
              </div>
              <small>
                {role.permissions
                  .map(
                    (id) => siteOptions.find((option) => option.id === id)?.label,
                  )
                  .filter(Boolean)
                  .join(', ') || 'No site access assigned'}
              </small>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
