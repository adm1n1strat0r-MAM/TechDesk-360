import mongoose from 'mongoose'

export const branchRegions = ['Central I', 'Central II', 'South', 'North']

const branchSchema = new mongoose.Schema(
  {
    branchCode: { type: String, required: true, unique: true, trim: true },
    branchName: { type: String, required: true, trim: true },
    branchIp: { type: String, trim: true, default: '' },
    branchArea: { type: String, trim: true, default: '' },
    branchRegion: { type: String, enum: [...branchRegions, ''], default: '' },
    branchAom: { type: String, trim: true, default: '' },
    branchCom: { type: String, trim: true, default: '' },
    branchGmOperations: { type: String, trim: true, default: '' },
    branchRgm: { type: String, trim: true, default: '' },
    branchCmBusiness: { type: String, trim: true, default: '' },
    branchGmBusiness: { type: String, trim: true, default: '' },
    branchAddress: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
)

const Branch = mongoose.model('Branch', branchSchema)

export default Branch
