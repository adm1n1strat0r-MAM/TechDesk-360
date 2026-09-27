import mongoose from 'mongoose'

export const labCaseActions = [
  'Repair',
  'Replacement',
  'Warranty Claim',
  'New Equipment',
  'Windows Installation',
]

export const receivedItemTypes = [
  'Windows Client',
  'Zero Client',
  'Printer',
  'Scanner',
  'Laptop',
]

const labCaseSchema = new mongoose.Schema(
  {
    srNumber: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
    },
    openedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },
    branchCode: { type: String, required: true, trim: true },
    branchName: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    dateIn: { type: Date, required: true },
    dateOut: { type: Date, default: null },
    userDomain: { type: String, required: true, trim: true },
    sdnNumber: { type: String, required: true, trim: true },
    actionIssue: { type: String, required: true, enum: labCaseActions },
    serialNo: { type: String, required: true, trim: true },
    itemReceived: { type: String, required: true, enum: receivedItemTypes },
    remarks: { type: String, trim: true, maxlength: 1000, default: '' },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Warranty', 'Completed', 'Closed'],
      default: 'Open',
    },
    approvedAt: { type: Date, default: null },
    warrantyAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

const LabCase = mongoose.model('LabCase', labCaseSchema)

export default LabCase
