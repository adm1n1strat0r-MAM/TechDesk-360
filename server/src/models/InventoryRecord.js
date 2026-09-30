import mongoose from 'mongoose'

const inventoryRecordSchema = new mongoose.Schema(
  {
    branchCode: { type: String, default: '' },
    branchName: { type: String, default: '' }, // Maps to "Branch"
    region: { type: String, default: '' },
    area: { type: String, default: '' },
    floor: { type: String, default: '' },
    employeeDomainId: { type: String, default: '' },
    userName: { type: String, default: '' },
    department: { type: String, default: '' },
    pcVdi: { type: String, default: '' }, // Maps to "PC/VDI"
    computerModel: { type: String, default: '' }, // Maps to "Make.Model"
    computerSerial: { type: String, default: '' }, // Maps to "Serial No."
    hostname: { type: String, default: '' }, // Maps to "Host name"
    printerModel: { type: String, default: '' },
    printerSerial: { type: String, default: '' }, // Maps to "Serial No"
    scannerModel: { type: String, default: '' }, // Maps to "SCANNER"
    scannerSerial: { type: String, default: '' }, // Maps to "SERIAL"
    validationPrinterModel: { type: String, default: '' },
    validationPrinterSerial: { type: String, default: '' }, // Maps to "Serial"
    ledMake: { type: String, default: '' }, // Maps to "LED Make"
    ledSerial: { type: String, default: '' }, // Maps to "LED Serial"
    bioMake: { type: String, default: '' },
    bioSerial: { type: String, default: '' }, // Maps to "Bio Serial"
  },
  { timestamps: true },
)

inventoryRecordSchema.index({ branchCode: 1 })

const InventoryRecord = mongoose.model('InventoryRecord', inventoryRecordSchema)

export default InventoryRecord