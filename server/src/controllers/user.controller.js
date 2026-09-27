import User from '../models/user.js'
import { DEFAULT_USER_PASSWORD } from '../config/password.js'

const editableFields = ['DomainID', 'name', 'email', 'IPphone', 'role', 'status']

export const createUser = async (req, res, next) => {
  try {
    const userData = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => editableFields.includes(key)),
    )
    const user = await User.create(userData)

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
      initialPassword: DEFAULT_USER_PASSWORD,
      mustChangePassword: true,
    })
  } catch (error) {
    next(error)
  }
}

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 })
    res.status(200).json({ success: true, count: users.length, data: users })
  } catch (error) {
    next(error)
  }
}

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.status(200).json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => editableFields.includes(key)),
    )
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: 'after',
      runValidators: true,
    })

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export const resetUserPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('+passwordHash')
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    user.passwordHash = DEFAULT_USER_PASSWORD
    user.markModified('passwordHash')
    user.mustChangePassword = true
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      initialPassword: DEFAULT_USER_PASSWORD,
      mustChangePassword: true,
    })
  } catch (error) {
    next(error)
  }
}
