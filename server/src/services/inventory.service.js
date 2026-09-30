import InventoryRecord from '../models/InventoryRecord.js'

const PC_LAPTOP_TYPES = new Set(['pc', 'laptop'])
const OTHER_EQUIPMENT_FIELDS = [
  'printerModel',
  'printerSerial',
  'scannerModel',
  'scannerSerial',
  'validationPrinterModel',
  'validationPrinterSerial',
  'ledMake',
  'ledSerial',
  'bioMake',
  'bioSerial',
]

const inventoryFields = [
  'branchCode',
  'branchName',
  'region',
  'area',
  'floor',
  'employeeDomainId',
  'userName',
  'department',
  'pcVdi',
  'computerModel',
  'computerSerial',
  'hostname',
  'printerModel',
  'printerSerial',
  'scannerModel',
  'scannerSerial',
  'validationPrinterModel',
  'validationPrinterSerial',
  'ledMake',
  'ledSerial',
  'bioMake',
  'bioSerial',
]

const text = (value) => (value === null || value === undefined ? '' : String(value).trim())
const typeKey = (value) => text(value).toLowerCase().replace(/\s+/g, ' ')
const isPcOrLaptop = (record) => PC_LAPTOP_TYPES.has(typeKey(record.pcVdi))

let legacyFieldMigration

async function migrateLegacyInventoryFields() {
  const legacyFields = {
    $or: [
      { employeeName: { $exists: true } },
      { computerType: { $exists: true } },
      { monitorModel: { $exists: true } },
      { sourceData: { $exists: true } },
    ],
  }

  await InventoryRecord.collection.updateMany(legacyFields, [
    {
      $set: {
        userName: { $ifNull: ['$userName', { $ifNull: ['$employeeName', ''] }] },
        pcVdi: { $ifNull: ['$pcVdi', { $ifNull: ['$computerType', ''] }] },
        ledMake: { $ifNull: ['$ledMake', { $ifNull: ['$monitorModel', ''] }] },
        ledSerial: { $ifNull: ['$ledSerial', ''] },
        bioSerial: { $ifNull: ['$bioSerial', ''] },
      },
    },
    {
      $unset: [
        'employeeName',
        'computerType',
        'monitorModel',
        'sourceData',
      ],
    },
  ])
}

async function ensureCurrentInventoryFields() {
  if (!legacyFieldMigration) {
    legacyFieldMigration = migrateLegacyInventoryFields().catch((error) => {
      legacyFieldMigration = undefined
      throw error
    })
  }
  await legacyFieldMigration
}

function normalizeRecord(row) {
  return Object.fromEntries(inventoryFields.map((field) => [field, text(row[field])]))
}

function recordMatch(record) {
  return Object.fromEntries(inventoryFields.map((field) => [field, record[field]]))
}

export async function importInventoryRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: 'Provide at least one inventory row to import' }
  }
  if (rows.length > 5000) {
    return { error: 'Import 5,000 inventory rows or fewer at a time' }
  }
  const invalidIndex = rows.findIndex(
    (row) => !row || typeof row !== 'object' || Array.isArray(row),
  )
  if (invalidIndex !== -1) {
    return { error: `Row ${invalidIndex + 1} must be a JSON object` }
  }

  await ensureCurrentInventoryFields()

  let createdCount = 0
  let updatedCount = 0
  for (let offset = 0; offset < rows.length; offset += 500) {
    const chunk = rows.slice(offset, offset + 500)
    const result = await InventoryRecord.bulkWrite(
      chunk.map((row) => {
        const record = normalizeRecord(row)
        return {
          updateOne: {
            filter: recordMatch(record),
            update: { $set: record },
            upsert: true,
          },
        }
      }),
      { ordered: true },
    )
    createdCount += result.upsertedCount || 0
    updatedCount += result.matchedCount || 0
  }

  return {
    processedCount: rows.length,
    createdCount,
    updatedCount,
  }
}

function isPlaceholder(value) {
  const normalized = text(value).toLowerCase()
  return ['', 'n/a', 'n\\a', 'na', 'nil', '-', '\u2014'].includes(normalized)
}

function addCount(map, value) {
  const label = text(value)
  if (isPlaceholder(label)) return
  const key = label.toLowerCase().replace(/\s+/g, ' ')
  const current = map.get(key)
  map.set(key, { label: current?.label || label, count: (current?.count || 0) + 1 })
}

function sortedCounts(map) {
  return [...map.values()].sort(
    (left, right) => right.count - left.count || left.label.localeCompare(right.label),
  )
}

function summarizeRecords(records, { includeSystems = true, includeOtherEquipment = true } = {}) {
  const systemTypes = new Map()
  const systemModels = new Map()
  const otherTypes = new Map()
  const printers = new Map()
  const validationPrinters = new Map()
  const scanners = new Map()
  const leds = new Map()
  const biometrics = new Map()
  let systemCount = 0

  records.forEach((record) => {
    const pcVdi = typeKey(record.pcVdi)
    if (PC_LAPTOP_TYPES.has(pcVdi)) {
      if (includeSystems) {
        systemCount += 1
        addCount(systemTypes, record.pcVdi)
        addCount(systemModels, record.computerModel)
      }
    } else if (!isPlaceholder(record.pcVdi)) {
      addCount(otherTypes, record.pcVdi)
    }

    if (includeOtherEquipment) {
      addCount(printers, record.printerModel)
      addCount(validationPrinters, record.validationPrinterModel)
      addCount(scanners, record.scannerModel)
      addCount(leds, record.ledMake)
      addCount(biometrics, record.bioMake)
    }
  })

  const printerModels = sortedCounts(printers)
  const validationPrinterModels = sortedCounts(validationPrinters)
  const scannerModels = sortedCounts(scanners)
  const ledMakes = sortedCounts(leds)
  const bioMakes = sortedCounts(biometrics)

  return {
    systemCount,
    systemTypes: sortedCounts(systemTypes),
    systemModels: sortedCounts(systemModels),
    otherTypes: sortedCounts(otherTypes),
    printers: { total: printerModels.reduce((sum, item) => sum + item.count, 0), models: printerModels },
    validationPrinters: {
      total: validationPrinterModels.reduce((sum, item) => sum + item.count, 0),
      models: validationPrinterModels,
    },
    scanners: { total: scannerModels.reduce((sum, item) => sum + item.count, 0), models: scannerModels },
    leds: { total: ledMakes.reduce((sum, item) => sum + item.count, 0), models: ledMakes },
    biometrics: { total: bioMakes.reduce((sum, item) => sum + item.count, 0), models: bioMakes },
  }
}

function hasBranchInventory(record) {
  const otherDeviceData = OTHER_EQUIPMENT_FIELDS.some((field) => !isPlaceholder(record[field]))
  const otherDeviceType = !isPcOrLaptop(record) && !isPlaceholder(record.pcVdi)
  return otherDeviceData || otherDeviceType
}

function locationDetails(branchCode, branchRecords) {
  const firstNamed = branchRecords.find((record) => record.branchName)
  return {
    branchCode,
    branchName: firstNamed?.branchName || `Branch ${branchCode}`,
    region: branchRecords.find((record) => record.region)?.region || '',
    area: branchRecords.find((record) => record.area)?.area || '',
  }
}

function sortLocations(locations) {
  return locations.sort((left, right) => left.branchName.localeCompare(right.branchName))
}

export async function getInventorySummary() {
  await ensureCurrentInventoryFields()

  const records = await InventoryRecord.find().sort({ branchCode: 1 }).lean()
  const byBranch = new Map()
  let uncodedRecordCount = 0

  records.forEach((record) => {
    const branchCode = text(record.branchCode)
    if (!branchCode) {
      uncodedRecordCount += 1
      return
    }
    if (!byBranch.has(branchCode)) byBranch.set(branchCode, [])
    byBranch.get(branchCode).push(record)
  })

  const backOffices = []
  const branches = []

  for (const [branchCode, branchRecords] of byBranch) {
    const systemCount = branchRecords.filter(isPcOrLaptop).length
    const details = locationDetails(branchCode, branchRecords)

    if (systemCount > 10) {
      const computerRecords = branchRecords.filter(isPcOrLaptop)
      backOffices.push({
        ...details,
        recordCount: computerRecords.length,
        locationType: 'back-office',
        ...summarizeRecords(computerRecords, { includeOtherEquipment: false }),
      })

      const branchRecordsWithOtherDevices = branchRecords.filter(hasBranchInventory)
      if (branchRecordsWithOtherDevices.length) {
        branches.push({
          ...details,
          recordCount: branchRecordsWithOtherDevices.length,
          locationType: 'branch',
          ...summarizeRecords(branchRecordsWithOtherDevices, { includeSystems: false }),
        })
      }
    } else {
      branches.push({
        ...details,
        recordCount: branchRecords.length,
        locationType: 'branch',
        ...summarizeRecords(branchRecords),
      })
    }
  }

  sortLocations(backOffices)
  sortLocations(branches)

  return {
    recordCount: records.length,
    branchCount: byBranch.size,
    backOfficeCount: backOffices.length,
    branchLocationCount: branches.length,
    uncodedRecordCount,
    classificationThreshold: 10,
    overall: summarizeRecords(records),
    backOffices,
    branches,
  }
}

export async function getInventoryRecords() {
  await ensureCurrentInventoryFields()
  return InventoryRecord.find()
    .select(inventoryFields.join(' '))
    .sort({ branchCode: 1, userName: 1, employeeDomainId: 1 })
    .lean()
}
