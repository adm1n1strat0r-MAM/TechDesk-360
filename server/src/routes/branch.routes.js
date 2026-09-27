import express from 'express'
import {
  bulkCreateBranches,
  createBranch,
  getBranches,
  updateBranch,
} from '../controllers/branch.controller.js'
import { authenticate } from '../middleware/authenticate.middleware.js'
import { requireAnyPermission } from '../middleware/authorize.middleware.js'

const router = express.Router()
const branchReadPermissions = ['branch-management', 'branch-add', 'branch-list']

router.use(authenticate)
router.get('/', requireAnyPermission(branchReadPermissions), getBranches)
router.post('/bulk', requireAnyPermission(['branch-add']), bulkCreateBranches)
router.post('/', requireAnyPermission(['branch-add']), createBranch)
router.put('/:id', requireAnyPermission(['branch-list']), updateBranch)

export default router
