import express from 'express'
import {
  changePassword,
  getCurrentUser,
  login,
  updateProfile,
} from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/authenticate.middleware.js'

const router = express.Router()

router.post('/login', login)
router.get('/me', authenticate, getCurrentUser)
router.put('/profile', authenticate, updateProfile)
router.put('/change-password', authenticate, changePassword)

export default router
