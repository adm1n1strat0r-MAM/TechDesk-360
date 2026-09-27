import express from 'express'
import {
  createLabCase,
  getLabCases,
  updateLabCase,
  updateLabCaseStatus,
} from '../controllers/labCase.controller.js'
import { authenticate } from '../middleware/authenticate.middleware.js'
import { requireAnyPermission } from '../middleware/authorize.middleware.js'

const router = express.Router()
const labPermissions = [
  'lab',
  'lab-new-case',
  'lab-new-cases',
  'lab-cases-summary',
]

router.use(authenticate)
router.get('/', requireAnyPermission(labPermissions), getLabCases)
router.post('/', requireAnyPermission(['lab-new-case']), createLabCase)
router.patch(
  '/:id',
  requireAnyPermission(['lab-new-case', 'lab-new-cases']),
  updateLabCase,
)
router.patch(
  '/:id/status',
  requireAnyPermission(['lab-new-cases']),
  updateLabCaseStatus,
)

export default router
