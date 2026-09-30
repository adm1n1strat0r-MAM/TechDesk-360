import express from 'express'
import {
  getInventoryOverview,
  importInventory,
  listInventoryRecords,
} from '../controllers/inventory.controller.js'
import { authenticate } from '../middleware/authenticate.middleware.js'
import { requireAnyPermission } from '../middleware/authorize.middleware.js'

const router = express.Router()
const inventoryPermission = requireAnyPermission(['inventory'])
const employeeDetailPermission = requireAnyPermission(['inventory', 'inventory-employee-detail'])

router.use(authenticate)
router.get('/records', employeeDetailPermission, listInventoryRecords)
router.get('/summary', inventoryPermission, getInventoryOverview)
router.post('/import', inventoryPermission, importInventory)

export default router
