import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString('hex')
const sessionLifetimeSeconds = 60 * 60 * 8

function sign(payload) {
  return createHmac('sha256', sessionSecret).update(payload).digest('base64url')
}

export function createSessionToken(userId) {
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + sessionLifetimeSeconds,
  })).toString('base64url')

  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token) {
  if (typeof token !== 'string') return null

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expected = Buffer.from(sign(payload))
  const received = Buffer.from(signature)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!session.sub || session.exp <= Math.floor(Date.now() / 1000)) return null
    return session
  } catch {
    return null
  }
}
