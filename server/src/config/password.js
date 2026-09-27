import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

export const DEFAULT_USER_PASSWORD =
  process.env.DEFAULT_USER_PASSWORD || 'Welcome@12345'

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof password !== 'string') return false

  const [salt, key] = storedHash.split(':')
  if (!salt || !key) return false

  const expectedKey = Buffer.from(key, 'hex')
  const actualKey = await scrypt(password, salt, expectedKey.length)

  return (
    actualKey.length === expectedKey.length &&
    timingSafeEqual(actualKey, expectedKey)
  )
}
