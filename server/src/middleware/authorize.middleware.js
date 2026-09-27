import Role from '../models/Role.js'
import User from '../models/user.js'

export function requireAnyPermission(requiredPermissions) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.auth.userId).select('role status')
      if (!user || user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Account is not active',
        })
      }

      const normalizedRole = user.role.toLowerCase().replace(/[^a-z]/g, '')
      const isAdministrator = ['administrator', 'admin'].includes(normalizedRole)
      const roles = isAdministrator
        ? []
        : await Role.find().select('name permissions')
      const role = roles.find(
        (item) => item.name.toLowerCase().replace(/[^a-z]/g, '') === normalizedRole,
      )
      const allowed = isAdministrator || role?.permissions.some((permission) =>
        requiredPermissions.includes(permission),
      )

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Your role does not have access to this action',
        })
      }

      req.auth.role = user.role
      req.auth.permissions = isAdministrator
        ? [...requiredPermissions]
        : role?.permissions || []
      next()
    } catch (error) {
      next(error)
    }
  }
}
