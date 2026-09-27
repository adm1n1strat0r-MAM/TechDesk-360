import { verifySessionToken } from '../config/session.js'
import User from '../models/user.js'

export const authenticate = async (req, res, next) => {
  try {
    const authorization = req.get('authorization') || ''
    const [scheme, token] = authorization.split(' ')
    const session = scheme === 'Bearer' ? verifySessionToken(token) : null

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Sign in to continue',
      })
    }

    const user = await User.findById(session.sub).select('status mustChangePassword')
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active',
      })
    }

    const allowedDuringPasswordChange =
      req.baseUrl === '/api/auth' &&
      ['/me', '/change-password'].includes(req.path)
    if (user.mustChangePassword && !allowedDuringPasswordChange) {
      return res.status(403).json({
        success: false,
        message: 'Change your temporary password before continuing',
        mustChangePassword: true,
      })
    }

    req.auth = { userId: session.sub }
    next()
  } catch (error) {
    next(error)
  }
}
