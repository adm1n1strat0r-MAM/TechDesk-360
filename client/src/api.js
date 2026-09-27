const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('techdesk:token')
        ? { Authorization: `Bearer ${localStorage.getItem('techdesk:token')}` }
        : {}),
      ...options.headers,
    },
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'The server request failed')
  }

  return result
}

export function normalizeUser(user) {
  return {
    id: user._id || user.id,
    fullName: user.name,
    domainId: user.DomainID,
    email: user.email,
    phone: user.IPphone || '',
    role: user.role,
    status: user.status?.toLowerCase() || 'active',
    mustChangePassword: Boolean(user.mustChangePassword),
  }
}

export async function getUsers() {
  const result = await request('/users')
  return result.data.map(normalizeUser)
}

export async function createUser(user) {
  const result = await request('/users', {
    method: 'POST',
    body: JSON.stringify({
      name: user.fullName,
      DomainID: user.domainId,
      email: user.email,
      IPphone: user.phone,
      role: user.role,
      status: user.status.toLowerCase(),
    }),
  })

  return {
    user: normalizeUser(result.data),
    initialPassword: result.initialPassword,
  }
}

export async function updateUser(id, updates) {
  const result = await request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })

  return normalizeUser(result.data)
}

export function normalizeRole(role) {
  return {
    id: role._id || role.id,
    name: role.name,
    permissions: role.permissions || [],
  }
}

export async function getRoles() {
  const result = await request('/roles')
  return result.data.map(normalizeRole)
}

export async function saveRole(role) {
  const isUpdate = Boolean(role.id && !String(role.id).startsWith('role-'))
  const result = await request(isUpdate ? `/roles/${role.id}` : '/roles', {
    method: isUpdate ? 'PUT' : 'POST',
    body: JSON.stringify({ name: role.name, permissions: role.permissions }),
  })

  return normalizeRole(result.data)
}

export async function deleteRole(id) {
  await request(`/roles/${id}`, { method: 'DELETE' })
}

export function loginUser(identifier, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  })
}

export async function getCurrentUser() {
  const result = await request('/auth/me')
  return normalizeUser(result.data)
}

export function updateProfile(profile) {
  return request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({
      name: profile.fullName,
      email: profile.email,
      IPphone: profile.phone,
    }),
  }).then((result) => normalizeUser(result.data))
}

export function changePassword(currentPassword, newPassword) {
  return request('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export function resetUserPassword(id) {
  return request(`/users/${id}/reset-password`, { method: 'POST' })
}

const dateOnly = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '')

export function normalizeLabCase(labCase) {
  return {
    id: labCase._id || labCase.id,
    srNumber: labCase.srNumber,
    openedAt: labCase.openedAt || labCase.createdAt,
    branchCode: labCase.branchCode,
    branchName: labCase.branchName,
    department: labCase.department,
    dateIn: dateOnly(labCase.dateIn),
    dateOut: dateOnly(labCase.dateOut),
    userDomain: labCase.userDomain,
    sdnNumber: labCase.sdnNumber,
    actionIssue: labCase.actionIssue,
    serialNo: labCase.serialNo,
    itemReceived: labCase.itemReceived,
    remarks: labCase.remarks || '',
    status: labCase.status,
  }
}

export async function getLabCases() {
  const result = await request('/lab-cases')
  return result.data.map(normalizeLabCase)
}

export async function createLabCase(labCase) {
  const result = await request('/lab-cases', {
    method: 'POST',
    body: JSON.stringify(labCase),
  })

  return normalizeLabCase(result.data)
}

export async function updateLabCase(id, labCase) {
  const result = await request(`/lab-cases/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(labCase),
  })

  return normalizeLabCase(result.data)
}

export async function updateLabCaseStatus(id, status) {
  const result = await request(`/lab-cases/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

  return normalizeLabCase(result.data)
}

export function normalizeBranch(branch) {
  return {
    id: branch._id || branch.id,
    branchCode: branch.branchCode,
    branchName: branch.branchName,
    branchIp: branch.branchIp || '',
    branchArea: branch.branchArea || '',
    branchRegion: branch.branchRegion || '',
    branchAom: branch.branchAom || '',
    branchCom: branch.branchCom || '',
    branchGmOperations: branch.branchGmOperations || '',
    branchRgm: branch.branchRgm || '',
    branchCmBusiness: branch.branchCmBusiness || '',
    branchGmBusiness: branch.branchGmBusiness || '',
    branchAddress: branch.branchAddress || '',
  }
}

export async function getBranches() {
  const result = await request('/branches')
  return result.data.map(normalizeBranch)
}

export async function createBranch(branch) {
  const result = await request('/branches', {
    method: 'POST',
    body: JSON.stringify(branch),
  })
  return normalizeBranch(result.data)
}

export async function bulkCreateBranches(branches) {
  const result = await request('/branches/bulk', {
    method: 'POST',
    body: JSON.stringify({ branches }),
  })
  return {
    branches: result.data.map(normalizeBranch),
    createdCount: result.createdCount || 0,
    updatedCount: result.updatedCount || 0,
  }
}

export async function updateBranch(id, branch) {
  const result = await request(`/branches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(branch),
  })
  return normalizeBranch(result.data)
}
