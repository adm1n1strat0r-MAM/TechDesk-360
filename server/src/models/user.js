import mongoose from 'mongoose'
import { DEFAULT_USER_PASSWORD, hashPassword } from '../config/password.js'

const userSchema = new mongoose.Schema(
  {
    DomainID: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    IPphone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      default: 'InventoryOfficer',
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'inactive'],
      default: 'active',
    },
    passwordHash: {
      type: String,
      required: true,
      default: DEFAULT_USER_PASSWORD,
      select: false,
    },
    mustChangePassword: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

userSchema.pre('save', async function hashModifiedPassword() {
  if (!this.isModified('passwordHash')) return
  this.passwordHash = await hashPassword(this.passwordHash)
})

userSchema.set('toJSON', {
  transform(_document, returnedObject) {
    delete returnedObject.passwordHash
    delete returnedObject.__v
    return returnedObject
  },
})

const User = mongoose.model('User', userSchema)

export default User
