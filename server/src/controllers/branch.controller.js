import Branch, { branchRegions } from '../models/Branch.js'

const requiredFields = ['branchCode', 'branchName']
const optionalTextFields = [
  'branchIp',
  'branchArea',
  'branchAom',
  'branchCom',
  'branchGmOperations',
  'branchRgm',
  'branchCmBusiness',
  'branchGmBusiness',
  'branchAddress',
]

function validateBranchInput(input = {}) {
  const body = input && typeof input === 'object' ? input : {}
  const missing = requiredFields.filter(
    (field) => typeof body[field] !== 'string' || !body[field].trim(),
  )
  if (missing.length) {
    return { error: `Required fields are missing: ${missing.join(', ')}` }
  }
  const invalidOptionalField = optionalTextFields.find(
    (field) => body[field] !== undefined && typeof body[field] !== 'string',
  )
  if (invalidOptionalField) {
    return { error: `${invalidOptionalField} must be text` }
  }
  const requestedRegion =
    typeof body.branchRegion === 'string' ? body.branchRegion.trim() : ''
  const branchRegion = branchRegions.find(
    (region) => region.toLowerCase() === requestedRegion.toLowerCase(),
  )
  if (requestedRegion && !branchRegion) {
    return { error: 'Choose a valid Branch Region' }
  }
  const branchIp = typeof body.branchIp === 'string' ? body.branchIp.trim() : ''
  if (branchIp && !/^\d{4}$/.test(branchIp)) {
    return { error: 'Branch IP must be a 4-digit Cisco extension' }
  }

  return {
    values: {
      branchCode: body.branchCode.trim(),
      branchName: body.branchName.trim(),
      branchIp,
      branchArea: (body.branchArea || '').trim(),
      branchRegion: branchRegion || '',
      branchAom: (body.branchAom || '').trim(),
      branchCom: (body.branchCom || '').trim(),
      branchGmOperations: (body.branchGmOperations || '').trim(),
      branchRgm: (body.branchRgm || '').trim(),
      branchCmBusiness: (body.branchCmBusiness || '').trim(),
      branchGmBusiness: (body.branchGmBusiness || '').trim(),
      branchAddress: (body.branchAddress || '').trim(),
    },
  }
}

export const getBranches = async (_req, res, next) => {
  try {
    const branches = await Branch.find().sort({ branchCode: 1 })
    res.status(200).json({ success: true, count: branches.length, data: branches })
  } catch (error) {
    next(error)
  }
}

export const createBranch = async (req, res, next) => {
  try {
    const { error, values } = validateBranchInput(req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    const branch = await Branch.create(values)
    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: branch,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A branch with this Branch Code already exists',
      })
    }
    next(error)
  }
}

export const bulkCreateBranches = async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body?.branches) ? req.body.branches : []
    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one branch record to import',
      })
    }
    if (rows.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Import 500 branches or fewer at a time',
      })
    }

    const prepared = []
    const rowErrors = []
    rows.forEach((row, index) => {
      const { error, values } = validateBranchInput(row)
      if (error) rowErrors.push(`Row ${index + 1}: ${error}`)
      else {
        const allowedFields = Object.keys(values)
        const requestedFields = Array.isArray(row?._importFields)
          ? row._importFields.filter((field) => allowedFields.includes(field))
          : allowedFields
        const fields = new Set([
          'branchCode',
          'branchName',
          ...requestedFields,
        ])
        const importedValues = Object.fromEntries(
          [...fields].map((field) => [field, values[field]]),
        )
        prepared.push({ values: importedValues, fields })
      }
    })
    if (rowErrors.length) {
      return res.status(400).json({
        success: false,
        message: rowErrors.slice(0, 10).join('; '),
      })
    }

    const recordsByCode = new Map()
    prepared.forEach(({ values, fields }) => {
      const codeKey = values.branchCode.toLowerCase()
      const previous = recordsByCode.get(codeKey)
      const mergedValues = { ...(previous?.values || {}), ...values }
      const mergedFields = new Set([...(previous?.fields || []), ...fields])
      recordsByCode.set(codeKey, { values: mergedValues, fields: mergedFields })
    })

    const savedBranches = await Branch.find().select('_id branchCode').lean()
    const savedByCode = new Map(
      savedBranches.map((branch) => [branch.branchCode.toLowerCase(), branch._id]),
    )
    const records = [...recordsByCode.values()]
    const operations = records.map(({ values, fields }) => {
      const update = Object.fromEntries(
        [...fields].map((field) => [field, values[field]]),
      )
      const existingId = savedByCode.get(values.branchCode.toLowerCase())
      return {
        updateOne: {
          filter: existingId
            ? { _id: existingId }
            : { branchCode: values.branchCode },
          update: { $set: update },
          upsert: !existingId,
        },
      }
    })

    const result = await Branch.bulkWrite(operations, { ordered: true })
    const importedCodes = new Set(
      records.map(({ values }) => values.branchCode.toLowerCase()),
    )
    const branches = (await Branch.find()).filter((branch) =>
      importedCodes.has(branch.branchCode.toLowerCase()),
    )
    const createdCount = result.upsertedCount || 0
    const updatedCount = records.length - createdCount
    res.status(201).json({
      success: true,
      count: records.length,
      createdCount,
      updatedCount,
      message: `${createdCount} branches added and ${updatedCount} existing branches updated`,
      data: branches,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A Branch Code changed during import. Please retry the import.',
      })
    }
    next(error)
  }
}

export const updateBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id)
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' })
    }

    const { error, values } = validateBranchInput(req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    Object.assign(branch, values)
    await branch.save()
    res.status(200).json({
      success: true,
      message: 'Branch updated successfully',
      data: branch,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A branch with this Branch Code already exists',
      })
    }
    next(error)
  }
}
