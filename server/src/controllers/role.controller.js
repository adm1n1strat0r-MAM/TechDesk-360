import Role from '../models/Role.js'
import User from '../models/user.js'

const defaultRoles = [
  {
    name: 'Administrator',
    permissions: [
      'dashboard',
      'lab',
      'lab-new-case',
      'lab-new-cases',
      'lab-cases-summary',
      'inventory',
      'inventory-back-office',
      'inventory-branch',
      'branch-management',
      'branch-add',
      'branch-list',
      'store-management',
      'disposal-management',
      'id',
      'id-new-user',
      'id-users-details',
      'id-role-management',
    ],
  },
  {
    name: 'Lab Officer',
    permissions: [
      'dashboard',
      'lab',
      'lab-new-case',
      'lab-new-cases',
      'lab-cases-summary',
    ],
  },
  {
    name: 'Inventory Officer',
    permissions: [
      'dashboard',
      'inventory',
      'inventory-back-office',
      'inventory-branch',
      'branch-management',
      'branch-add',
      'branch-list',
      'store-management',
      'disposal-management',
    ],
  },
  {
    name: 'ID Officer',
    permissions: [
      'dashboard',
      'id',
      'id-new-user',
      'id-users-details',
      'id-role-management',
    ],
  },
]

export const getRoles = async (req, res, next) => {
  try {
    if ((await Role.countDocuments()) === 0) {
      try {
        await Role.insertMany(defaultRoles, { ordered: false })
      } catch (error) {
        if (error.code !== 11000 && !error.writeErrors) throw error
      }
    }

    const roles = await Role.find().sort({ name: 1 })
    res.status(200).json({ success: true, count: roles.length, data: roles })
  } catch (error) {
    next(error)
  }
}

export const createRole = async (req, res, next) => {
  try {
    const { name, permissions } = req.body
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required',
      })
    }
    if (permissions !== undefined && !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be a list of site option IDs',
      })
    }

    const role = await Role.create({ name: name.trim(), permissions })
    res.status(201).json({ success: true, data: role })
  } catch (error) {
    next(error)
  }
}

export const updateRole = async (req, res, next) => {
  try {
    const updates = {}
    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Role name cannot be empty',
        })
      }
      updates.name = req.body.name.trim()
    }
    if (req.body.permissions !== undefined) {
      if (!Array.isArray(req.body.permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Permissions must be a list of site option IDs',
        })
      }
      updates.permissions = req.body.permissions
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide a role name or permissions to update',
      })
    }

    const role = await Role.findById(req.params.id)
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' })
    }

    const previousName = role.name
    Object.assign(role, updates)
    await role.save()

    if (previousName !== role.name) {
      await User.updateMany({ role: previousName }, { role: role.name })
    }

    res.status(200).json({ success: true, data: role })
  } catch (error) {
    next(error)
  }
}
export const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id)
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' })
    }

    const assignedUserCount = await User.countDocuments({ role: role.name })
    if (assignedUserCount > 0) {
      return res.status(409).json({
        success: false,
        message: `This role is assigned to ${assignedUserCount} user${
          assignedUserCount === 1 ? '' : 's'
        }. Reassign them before deleting the role.`,
      })
    }

    await role.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully',
      data: role,
    })
  } catch (error) {
    next(error)
  }
}
