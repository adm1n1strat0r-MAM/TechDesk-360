import '../../styles/Sidebar.css'
import { useAuth } from '../../auth-context'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  {
    id: 'lab',
    label: 'Lab Management',
    icon: LabIcon,
    subItems: [
      { id: 'lab-new-case', label: 'New Case' },
      { id: 'lab-new-cases', label: 'New Cases' },
      { id: 'lab-cases-summary', label: 'Cases Summary' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory Management',
    icon: InventoryIcon,
    subItems: [
      { id: 'inventory-back-office', label: 'Back Office Inventory' },
      { id: 'inventory-branch', label: 'Branch Inventory' },
      { id: 'inventory-employee-detail', label: 'Employee Detail' },
    ],
  },
  {
    id: 'branch-management',
    label: 'Branch Management',
    icon: BranchIcon,
    subItems: [
      { id: 'branch-add', label: 'Add Branch' },
      { id: 'branch-list', label: 'Branch Details' },
    ],
  },
  { id: 'store-management', label: 'Store Management', icon: StoreIcon },
  { id: 'disposal-management', label: 'Disposal Management', icon: DisposalIcon },
  {
    id: 'id',
    label: 'ID Management',
    icon: IdIcon,
    subItems: [
      { id: 'id-new-user', label: 'New User' },
      { id: 'id-users-details', label: 'Users Details' },
      { id: 'id-role-management', label: 'Role Management' },
    ],
  },
]

function Sidebar({ currentPage, onNavigate, allowedPages }) {
  const { onLogout } = useAuth()
  const visibleItems = navItems
    .map((item) => ({
      ...item,
      subItems: item.subItems?.filter((subItem) =>
        allowedPages.includes(subItem.id),
      ),
    }))
    .filter((item) =>
      allowedPages.includes(item.id) || item.subItems?.length > 0,
    )
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <img className="brand-logo" src="/logo.png" alt="TechDesk 360 logo" />
      </div>

      <nav className="nav-menu" aria-label="Sidebar navigation">
        {visibleItems.map(({ id, label, icon: Icon, subItems }) => {
          const isSectionActive = currentPage === id || subItems?.some((item) => item.id === currentPage)

          return (
            <div key={id} className="nav-group">
              <button
                type="button"
                className={`nav-item nav-item--section ${isSectionActive ? 'nav-item--active' : ''}`}
                onClick={() =>
                  onNavigate(
                    allowedPages.includes(id) ? id : subItems[0].id,
                  )
                }
              >
                <span className="nav-icon">
                  <Icon />
                </span>
                <span className="nav-label">{label}</span>
              </button>

              {subItems && isSectionActive && (
                <div className="nav-submenu" aria-label={`${label} submenu`}>
                  {subItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`nav-subitem ${currentPage === item.id ? 'nav-subitem--active' : ''}`}
                      onClick={() => onNavigate(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

            </div>
          )
        })}
      </nav>

      <button type="button" className="logout-button" onClick={onLogout}>
        <span className="logout-icon">
          <LogoutIcon />
        </span>
        Logout
      </button>
    </aside>
  )
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v9a2.5 2.5 0 0 1-2.5 2.5H14l1.5 3h-7L10 18H6.5A2.5 2.5 0 0 1 4 15.5v-9Zm2.5-.5a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-11Zm2 2h7v5h-7V8Zm1 1v3h5V9h-5Z" />
    </svg>
  )
}

function LabIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.5 4a4.5 4.5 0 0 1 4.1 7.1l-1.3 1.3 1.4 1.4-1.4 1.4-1.4-1.4-1.4 1.4-1.4-1.4-2.1 2.1a4 4 0 0 1-5.6-5.6l2.1-2.1 1.4 1.4 1.4-1.4L10 8.3l1.4-1.4 1.4 1.4 1.4-1.4 1.3 1.3A4.5 4.5 0 0 1 14.5 4Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM5.5 16.8l1.4 1.4-2.8 2.8-1.4-1.4 2.8-2.8Z" />
    </svg>
  )
}

function InventoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5 4 6.5v11l8 4 8-4v-11l-8-4Zm0 2.1 5.6 2.8L12 10.2 6.4 7.4 12 4.6Zm-6 4.1 5 2.5v7.6l-5-2.5V8.7Zm12 0v7.6l-5 2.5v-7.6l5-2.5Z" />
    </svg>
  )
}

function BranchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 20h18v-2H3v2Zm2-4h5V4H5v12Zm7 0h7V8h-7v8Zm2-6h3v4h-3v-4ZM7 6h1v2H7V6Zm0 4h1v2H7v-2Z" />
    </svg>
  )
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h16l2 5v2a3 3 0 0 1-2 2.83V20H4v-6.17A3 3 0 0 1 2 11V9l2-5Zm1.4 2L4.2 9h15.6l-1.2-3H5.4ZM6 13v5h4v-4h4v4h4v-5a3 3 0 0 1-2-1 3 3 0 0 1-4 0 3 3 0 0 1-4 0 3 3 0 0 1-2 1Z" />
    </svg>
  )
}

function DisposalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h10l1 2h3v2H3V5h3l1-2Zm-1 6h12l-1 12H7L6 9Zm3 2v8h2v-8H9Zm4 0v8h2v-8h-2Z" />
    </svg>
  )
}

function IdIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm-6 7.3a6.1 6.1 0 0 1 12.2 0H6Zm1.4-1.5h9.4a4.7 4.7 0 0 0-9.4 0Z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5v-2H5V6h5V4Zm7.2 7.3-2.8-2.8L13 9.8l1.5 1.5H8v2h6.5l-1.5 1.5 1.4 1.4 2.8-2.9a1 1 0 0 0 0-1.4Z" />
    </svg>
  )
}

export default Sidebar
