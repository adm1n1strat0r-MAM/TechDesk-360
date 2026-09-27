import express from 'express'
import {
  createRole,
  deleteRole,
  getRoles,
  updateRole,
} from '../controllers/role.controller.js'
import { authenticate } from '../middleware/authenticate.middleware.js'
import { requireAnyPermission } from '../middleware/authorize.middleware.js'

const router = express.Router()

router.use(authenticate)
router.get('/', getRoles)
router.post('/', requireAnyPermission(['id-role-management']), createRole)
router.put('/:id', requireAnyPermission(['id-role-management']), updateRole)
router.delete('/:id', requireAnyPermission(['id-role-management']), deleteRole)

export default router
