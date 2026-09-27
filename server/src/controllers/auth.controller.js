import User from '../models/user.js'
import { DEFAULT_USER_PASSWORD, verifyPassword } from '../config/password.js'
import { createSessionToken } from '../config/session.js'

const findUserByIdentifier = (identifier) => {
  const normalizedIdentifier = identifier.trim()
  return User.findOne({
    $or: [
      { DomainID: normalizedIdentifier },
      { email: normalizedIdentifier.toLowerCase() },
    ],
  }).select('+passwordHash')
}

export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body
    if (typeof identifier !== 'string' || !identifier.trim() || typeof password !== 'string' || !password) {
      return res.status(400).json({
        success: false,
        message: 'Domain ID or email and password are required',
      })
    }

    const user = await findUserByIdentifier(identifier)
    const hasLegacyPassword = user && !user.passwordHash?.includes(':')
    if (
      hasLegacyPassword &&
      (password === user.passwordHash || password === DEFAULT_USER_PASSWORD)
    ) {
      user.passwordHash = password
      user.markModified('passwordHash')
      user.mustChangePassword = true
      await user.save()
    }
    const passwordMatches = user && await verifyPassword(password, user.passwordHash)

    if (!passwordMatches || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account is not active',
      })
    }

    res.status(200).json({
      success: true,
      token: createSessionToken(user.id),
      mustChangePassword: user.mustChangePassword,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (
      typeof currentPassword !== 'string' || !currentPassword ||
      typeof newPassword !== 'string' || !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      })
    }

    if (newPassword.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 10 characters long',
      })
    }

    const user = await User.findById(req.auth.userId).select('+passwordHash')
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      })
    }

    user.passwordHash = newPassword
    user.mustChangePassword = false
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      mustChangePassword: false,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.userId)
    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Account is not active' })
    }

    res.status(200).json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const updates = {}
    if (req.body.name !== undefined) updates.name = req.body.name
    if (req.body.email !== undefined) updates.email = req.body.email
    if (req.body.IPphone !== undefined) updates.IPphone = req.body.IPphone

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide a name, email, or IP phone to update',
      })
    }

    const user = await User.findByIdAndUpdate(req.auth.userId, updates, {
      returnDocument: 'after',
      runValidators: true,
    })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.status(200).json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
}
