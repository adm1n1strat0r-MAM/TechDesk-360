import { useEffect, useState } from 'react'
import { AuthContext } from './auth-context'
import {
  bulkCreateBranches as bulkCreateBranchesRequest,
  createBranch as createBranchRequest,
  createUser,
  createLabCase as createLabCaseRequest,
  deleteRole as deleteRoleRequest,
  getCurrentUser,
  getBranches,
  getLabCases,
  getRoles,
  getUsers,
  resetUserPassword,
  saveRole as saveRoleRequest,
  updateLabCase as updateLabCaseRequest,
  updateBranch as updateBranchRequest,
  updateUser,
  updateLabCaseStatus,
} from './api'
import Sidebar from './components/layout/Sidebar'
import DashboardPage from './pages/DashboardPage'
import InventoryManagementPage, {
  BackOfficeInventoryPage,
  BranchInventoryPage,
  EmployeeInventoryPage,
  ManagementSectionPage,
} from './pages/InventoryManagementPage'
import IdManagementPage from './pages/IdManagementPage'
import {
  IdRoleManagementPage,
  IdUsersDetailsPage,
  NewIdUserPage,
  siteOptions,
} from './pages/IdWorkflowPages'
import { LabCasesSummaryPage, NewLabCasePage, NewLabCasesPage } from './pages/LabWorkflowPages'
import LabManagementPage from './pages/LabManagementPage'
import { PasswordPage, ProfilePage } from './pages/AccountPages'
import {
  AddBranchPage,
  BranchDetailsPage,
  BranchManagementPage,
} from './pages/BranchManagementPages'
import LoginPage from './pages/LoginPage'
import './styles/App.css'
import './styles/ResponsiveLayout.css'
import './styles/Motion.css'

const TOKEN_KEY = 'techdesk:token'
const MUST_CHANGE_PASSWORD_KEY = 'techdesk:must-change-password'
const LAB_PAGE_PERMISSIONS = [
  'lab',
  'lab-new-case',
  'lab-new-cases',
  'lab-cases-summary',
]
const BRANCH_PAGE_PERMISSIONS = [
  'branch-management',
  'branch-add',
  'branch-list',
]
const INVENTORY_PAGE_PERMISSIONS = [
  'inventory',
  'inventory-back-office',
  'inventory-branch',
  'inventory-employee-detail',
]

const normalizeRoleName = (name = '') => name.toLowerCase().replace(/[^a-z]/g, '')

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [labCases, setLabCases] = useState([])
  const [labCasesLoading, setLabCasesLoading] = useState(false)
  const [labCasesError, setLabCasesError] = useState('')
  const [branches, setBranches] = useState([])
  const [branchesLoading, setBranchesLoading] = useState(false)
  const [branchesError, setBranchesError] = useState('')
  const [authToken, setAuthToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [authUser, setAuthUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [mustChangePassword, setMustChangePassword] = useState(
    () => localStorage.getItem(MUST_CHANGE_PASSWORD_KEY) === 'true',
  )
  const [idUsers, setIdUsers] = useState([])
  const [idUsersLoading, setIdUsersLoading] = useState(false)
  const [idUsersError, setIdUsersError] = useState('')
  const [roles, setRoles] = useState([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState('')

  useEffect(() => {
    if (!authToken) {
      setAuthUser(null)
      setAuthLoading(false)
      return
    }

    let isCurrent = true
    getCurrentUser()
      .then((user) => {
        if (isCurrent) {
          setAuthUser(user)
          setMustChangePassword(user.mustChangePassword)
          localStorage.setItem(
            MUST_CHANGE_PASSWORD_KEY,
            String(user.mustChangePassword),
          )
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY)
        if (isCurrent) {
          setAuthToken(null)
          setAuthUser(null)
          setMustChangePassword(false)
        }
      })
      .finally(() => {
        if (isCurrent) setAuthLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [authToken])

  const authUserId = authUser?.id
  const authUserRole = authUser?.role
  useEffect(() => {
    if (!authUserId || mustChangePassword) return
    let isCurrent = true
    setRolesLoading(true)

    getRoles()
      .then((items) => {
        if (!isCurrent) return
        setRoles(items)
        setRolesError('')

        const isAdministrator = ['admin', 'administrator'].includes(
          normalizeRoleName(authUserRole),
        )
        const activeRole = items.find(
          (role) =>
            normalizeRoleName(role.name) === normalizeRoleName(authUserRole),
        )
        const permissions = isAdministrator
          ? siteOptions.map(({ id }) => id)
          : activeRole?.permissions || ['dashboard']

        if (isAdministrator || permissions.includes('id-users-details')) {
          setIdUsersLoading(true)
          getUsers()
            .then((users) => {
              if (isCurrent) {
                setIdUsers(users)
                setIdUsersError('')
              }
            })
            .catch((error) => {
              if (isCurrent) setIdUsersError(error.message)
            })
            .finally(() => {
              if (isCurrent) setIdUsersLoading(false)
            })
        } else {
          setIdUsers([])
          setIdUsersError('')
          setIdUsersLoading(false)
        }

        if (isAdministrator || permissions.some((id) => LAB_PAGE_PERMISSIONS.includes(id))) {
          setLabCasesLoading(true)
          getLabCases()
            .then((cases) => {
              if (isCurrent) {
                setLabCases(cases)
                setLabCasesError('')
              }
            })
            .catch((error) => {
              if (isCurrent) setLabCasesError(error.message)
            })
            .finally(() => {
              if (isCurrent) setLabCasesLoading(false)
            })
        } else {
          setLabCases([])
          setLabCasesError('')
          setLabCasesLoading(false)
        }

        if (isAdministrator || permissions.some((id) => BRANCH_PAGE_PERMISSIONS.includes(id))) {
          setBranchesLoading(true)
          getBranches()
            .then((items) => {
              if (isCurrent) {
                setBranches(items)
                setBranchesError('')
              }
            })
            .catch((error) => {
              if (isCurrent) setBranchesError(error.message)
            })
            .finally(() => {
              if (isCurrent) setBranchesLoading(false)
            })
        } else {
          setBranches([])
          setBranchesError('')
          setBranchesLoading(false)
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setRolesError(error.message)
          setIdUsersError(error.message)
          setLabCasesError(error.message)
          setBranchesError(error.message)
          setIdUsersLoading(false)
          setLabCasesLoading(false)
          setBranchesLoading(false)
        }
      })
      .finally(() => {
        if (isCurrent) setRolesLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [authUserId, authUserRole, mustChangePassword])

  const handleLogin = ({ token, user, mustChangePassword: mustChange }) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(MUST_CHANGE_PASSWORD_KEY, String(Boolean(mustChange)))
    setAuthToken(token)
    setAuthUser(user)
    setMustChangePassword(Boolean(mustChange))
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY)
    setAuthToken(null)
    setAuthUser(null)
    setMustChangePassword(false)
    setIdUsers([])
    setRoles([])
    setLabCases([])
    setBranches([])
    setCurrentPage('dashboard')
  }

  const finishPasswordChange = () => {
    localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY)
    setMustChangePassword(false)
    setCurrentPage('dashboard')
  }

  const openLabCase = async (labCase) => {
    const createdCase = await createLabCaseRequest(labCase)
    setLabCases((current) => [createdCase, ...current])
    setLabCasesError('')
    return createdCase
  }

  const changeLabCaseStatus = async (id, status) => {
    const updatedCase = await updateLabCaseStatus(id, status)
    setLabCases((current) =>
      current.map((item) => (item.id === id ? updatedCase : item)),
    )
    setLabCasesError('')
    return updatedCase
  }

  const editLabCase = async (id, updates) => {
    const updatedCase = await updateLabCaseRequest(id, updates)
    setLabCases((current) =>
      current.map((item) => (item.id === id ? updatedCase : item)),
    )
    setLabCasesError('')
    return updatedCase
  }

  const addBranch = async (branch) => {
    const createdBranch = await createBranchRequest(branch)
    setBranches((current) =>
      [...current, createdBranch].sort((left, right) =>
        left.branchCode.localeCompare(right.branchCode),
      ),
    )
    setBranchesError('')
    return createdBranch
  }

  const importBranches = async (items) => {
    const result = await bulkCreateBranchesRequest(items)
    setBranches((current) => {
      const byId = new Map(current.map((branch) => [branch.id, branch]))
      result.branches.forEach((branch) => byId.set(branch.id, branch))
      return [...byId.values()].sort((left, right) =>
        left.branchCode.localeCompare(right.branchCode),
      )
    })
    setBranchesError('')
    return result
  }

  const editBranch = async (id, updates) => {
    const updatedBranch = await updateBranchRequest(id, updates)
    setBranches((current) =>
      current
        .map((branch) => (branch.id === id ? updatedBranch : branch))
        .sort((left, right) => left.branchCode.localeCompare(right.branchCode)),
    )
    setBranchesError('')
    return updatedBranch
  }

  const saveRole = async (role) => {
    const previousRole = roles.find((item) => item.id === role.id)
    const savedRole = await saveRoleRequest(role)
    setRoles((current) => {
      const exists = current.some((item) => item.id === savedRole.id)
      return exists
        ? current.map((item) => (item.id === savedRole.id ? savedRole : item))
        : [...current, savedRole]
    })

    if (previousRole && previousRole.name !== savedRole.name) {
      setIdUsers((current) =>
        current.map((user) =>
          user.role === previousRole.name
            ? { ...user, role: savedRole.name }
            : user,
        ),
      )
    }

    return savedRole
  }

  const removeRole = async (roleId) => {
    await deleteRoleRequest(roleId)
    setRoles((current) => current.filter((role) => role.id !== roleId))
  }

  const pages = {
    dashboard: <DashboardPage cases={labCases} />,
    lab: (
      <LabManagementPage
        title="Lab Management"
        subtitle="Overview"
        cases={labCases}
        loading={labCasesLoading}
        loadError={labCasesError}
      />
    ),
    'lab-new-case': (
      <NewLabCasePage
        cases={labCases}
        loading={labCasesLoading}
        loadError={labCasesError}
        onCreate={openLabCase}
        onUpdate={editLabCase}
      />
    ),
    'lab-new-cases': (
      <NewLabCasesPage
        cases={labCases}
        loading={labCasesLoading}
        loadError={labCasesError}
        onApprove={(id) => changeLabCaseStatus(id, 'In Progress')}
        onWarranty={(id) => changeLabCaseStatus(id, 'Warranty')}
        onClose={(id) => changeLabCaseStatus(id, 'Completed')}
        onUpdate={editLabCase}
      />
    ),
    'lab-cases-summary': (
      <LabCasesSummaryPage
        cases={labCases}
        loading={labCasesLoading}
        loadError={labCasesError}
      />
    ),
    'branch-management': (
      <BranchManagementPage
        branches={branches}
        loading={branchesLoading}
        loadError={branchesError}
      />
    ),
    'branch-add': (
      <AddBranchPage
        onCreate={addBranch}
        onImport={importBranches}
        loading={branchesLoading}
        loadError={branchesError}
      />
    ),
    'branch-list': (
      <BranchDetailsPage
        branches={branches}
        loading={branchesLoading}
        loadError={branchesError}
        onUpdate={editBranch}
      />
    ),
    inventory: <InventoryManagementPage title="Inventory Management" subtitle="Overview" />,
    'inventory-back-office': <BackOfficeInventoryPage />,
    'inventory-branch': <BranchInventoryPage />,
    'inventory-employee-detail': <EmployeeInventoryPage />,
    'store-management': (
      <ManagementSectionPage
        title="Store Management"
        subtitle="Stores and stock locations"
        panelTitle="Stores"
        description="Manage store locations and keep stock activity together."
        emptyMessage="No store records are available in this workspace yet."
      />
    ),
    'disposal-management': (
      <ManagementSectionPage
        title="Disposal Management"
        subtitle="Asset disposal register"
        panelTitle="Disposal records"
        description="Review assets that are recorded for disposal."
        emptyMessage="No disposal records are available in this workspace yet."
      />
    ),
    id: (
      <IdManagementPage
        title="ID Management"
        subtitle="Overview"
        userCount={idUsers.length}
        roleCount={roles.length}
      />
    ),
    'id-new-user': (
      <NewIdUserPage
        roles={roles}
        rolesLoading={rolesLoading}
        rolesError={rolesError}
        onCreate={async (user) => {
          const result = await createUser(user)
          setIdUsers((current) => [result.user, ...current])
          setIdUsersError('')
          return result.initialPassword
        }}
      />
    ),
    'id-users-details': (
      <IdUsersDetailsPage
        users={idUsers}
        roles={roles}
        loading={idUsersLoading}
        loadError={idUsersError}
        onToggleStatus={async (id) => {
          const existingUser = idUsers.find((user) => user.id === id)
          const nextStatus = existingUser.status === 'active' ? 'inactive' : 'active'
          const updatedUser = await updateUser(id, { status: nextStatus })
          setIdUsers((current) =>
            current.map((user) => (user.id === id ? updatedUser : user)),
          )
        }}
        onChangeRole={async (id, role) => {
          const updatedUser = await updateUser(id, { role })
          setIdUsers((current) =>
            current.map((user) => (user.id === id ? updatedUser : user)),
          )
        }}
        onResetPassword={resetUserPassword}
      />
    ),
    'id-role-management': (
      <IdRoleManagementPage
        roles={roles}
        loading={rolesLoading}
        loadError={rolesError}
        onSave={saveRole}
        onDelete={removeRole}
      />
    ),
    profile: (
      <ProfilePage
        user={authUser}
        onUpdated={(user) => {
          setAuthUser(user)
          setIdUsers((current) =>
            current.map((item) => (item.id === user.id ? user : item)),
          )
        }}
      />
    ),
    'change-password': <PasswordPage onComplete={finishPasswordChange} />,
  }

  const activeRole = roles.find(
    (role) => normalizeRoleName(role.name) === normalizeRoleName(authUser?.role),
  )
  const isAdministrator = ['admin', 'administrator'].includes(
    normalizeRoleName(authUser?.role),
  )
  const canImportInventory = isAdministrator || activeRole?.permissions.includes('inventory-import') === true
  const rolePermissions = isAdministrator
    ? siteOptions.map(({ id }) => id)
    : activeRole?.permissions || ['dashboard']
  const allowedPages = rolePermissions.includes('inventory')
    ? [...new Set([...rolePermissions, ...INVENTORY_PAGE_PERMISSIONS])]
    : rolePermissions
  const accountPages = ['profile', 'change-password']
  const visiblePage =
    accountPages.includes(currentPage) || allowedPages.includes(currentPage)
      ? currentPage
      : allowedPages[0] || 'dashboard'

  if (authLoading) {
    return <main className="auth-screen">Loading your account…</main>
  }

  if (!authUser) {
    return <LoginPage onLogin={handleLogin} />
  }

  if (mustChangePassword) {
    return <PasswordPage user={authUser} forced onComplete={finishPasswordChange} />
  }

  return (
    <AuthContext.Provider
      value={{
        user: authUser,
        onNavigate: setCurrentPage,
        onLogout: handleLogout,
      }}
    >
      <div className="app-shell">
        <Sidebar
          currentPage={visiblePage}
          onNavigate={setCurrentPage}
          allowedPages={allowedPages}
        />
        <div className="page-view">
          {visiblePage === 'dashboard' ? (
            <DashboardPage
              cases={labCases}
              casesLoading={labCasesLoading}
              casesError={labCasesError}
              branches={branches}
              branchesLoading={branchesLoading}
              branchesError={branchesError}
              users={idUsers}
              usersLoading={idUsersLoading}
              usersError={idUsersError}
              roles={roles}
              rolesLoading={rolesLoading}
              allowedPages={allowedPages}
            />
          ) : visiblePage === 'inventory' ? (
            <InventoryManagementPage
              title="Inventory Management"
              subtitle="Overview"
              canImport={canImportInventory}
            />
          ) : pages[visiblePage] ?? <DashboardPage allowedPages={allowedPages} />}
        </div>
      </div>
    </AuthContext.Provider>
  )
}

export default App
