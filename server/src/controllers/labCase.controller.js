import Counter from '../models/Counter.js'
import LabCase, {
  labCaseActions,
  receivedItemTypes,
} from '../models/LabCase.js'

const requiredTextFields = [
  'branchCode',
  'branchName',
  'department',
  'userDomain',
  'sdnNumber',
  'serialNo',
]

function validateCaseInput(input = {}) {
  input = input && typeof input === 'object' ? input : {}
  const missingFields = requiredTextFields.filter(
    (field) => typeof input[field] !== 'string' || !input[field].trim(),
  )
  if (missingFields.length > 0) {
    return { error: `Required fields are missing: ${missingFields.join(', ')}` }
  }

  const dateIn = parseDateOnly(input.dateIn)
  if (!dateIn) return { error: 'Date IN must be a valid date' }

  const dateOut = input.dateOut ? parseDateOnly(input.dateOut) : null
  if (input.dateOut && !dateOut) return { error: 'Date OUT must be a valid date' }
  if (dateOut && dateOut < dateIn) {
    return { error: 'Date OUT cannot be earlier than Date IN' }
  }
  if (!labCaseActions.includes(input.actionIssue)) {
    return { error: 'Choose a valid Action / Issue' }
  }
  if (!receivedItemTypes.includes(input.itemReceived)) {
    return { error: 'Choose a valid Item Received type' }
  }
  if (typeof input.remarks === 'string' && input.remarks.length > 1000) {
    return { error: 'Remarks must be 1000 characters or fewer' }
  }

  return {
    values: {
      branchCode: input.branchCode.trim(),
      branchName: input.branchName.trim(),
      department: input.department.trim(),
      dateIn,
      dateOut,
      userDomain: input.userDomain.trim(),
      sdnNumber: input.sdnNumber.trim(),
      actionIssue: input.actionIssue,
      serialNo: input.serialNo.trim(),
      itemReceived: input.itemReceived,
      remarks: typeof input.remarks === 'string' ? input.remarks.trim() : '',
    },
  }
}

function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date
}

async function nextSrNumber(date) {
  const year = date.getUTCFullYear()
  const counter = await Counter.findByIdAndUpdate(
    `lab-case-sr-${year}`,
    { $inc: { sequence: 1 } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  )

  return `SR-${year}-${String(counter.sequence).padStart(6, '0')}`
}

export const getLabCases = async (_req, res, next) => {
  try {
    const cases = await LabCase.find().sort({ openedAt: -1 })
    res.status(200).json({ success: true, count: cases.length, data: cases })
  } catch (error) {
    next(error)
  }
}

export const createLabCase = async (req, res, next) => {
  try {
    const { error, values } = validateCaseInput(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      })
    }

    const openedAt = new Date()
    const srNumber = await nextSrNumber(openedAt)
    const labCase = await LabCase.create({
      srNumber,
      openedAt,
      ...values,
    })

    res.status(201).json({
      success: true,
      message: 'Lab case opened successfully',
      data: labCase,
    })
  } catch (error) {
    next(error)
  }
}

export const updateLabCase = async (req, res, next) => {
  try {
    const labCase = await LabCase.findById(req.params.id)
    if (!labCase) {
      return res.status(404).json({ success: false, message: 'Lab case not found' })
    }

    if (['Completed', 'Closed'].includes(labCase.status)) {
      return res.status(409).json({
        success: false,
        message: 'Completed or closed cases cannot be edited',
      })
    }

    const role = (req.auth.role || '').toLowerCase().replace(/[^a-z]/g, '')
    const isAdministrator = ['admin', 'administrator'].includes(role)
    const requiredPermission =
      labCase.status === 'Open' ? 'lab-new-case' : 'lab-new-cases'
    if (
      !isAdministrator &&
      !req.auth.permissions?.includes(requiredPermission)
    ) {
      return res.status(403).json({
        success: false,
        message:
          labCase.status === 'Open'
            ? 'Only lab intake users can edit a case before approval'
            : 'Only lab approvers can edit an approved case',
      })
    }

    const { error, values } = validateCaseInput(req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    Object.assign(labCase, values)
    await labCase.save()
    res.status(200).json({
      success: true,
      message: 'Lab case updated successfully',
      data: labCase,
    })
  } catch (error) {
    next(error)
  }
}

export const updateLabCaseStatus = async (req, res, next) => {
  try {
    const labCase = await LabCase.findById(req.params.id)
    if (!labCase) {
      return res.status(404).json({ success: false, message: 'Lab case not found' })
    }

    const transitions = {
      Open: ['In Progress'],
      'In Progress': ['Warranty', 'Completed', 'Closed'],
      Warranty: ['Completed', 'Closed'],
    }
    if (!transitions[labCase.status]?.includes(req.body.status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot change a ${labCase.status} case to ${req.body.status}`,
      })
    }

    const changedAt = new Date()
    labCase.status = req.body.status
    if (req.body.status === 'In Progress') labCase.approvedAt = changedAt
    if (req.body.status === 'Warranty') labCase.warrantyAt = changedAt
    if (['Completed', 'Closed'].includes(req.body.status)) {
      labCase.closedAt = changedAt
    }
    await labCase.save()

    res.status(200).json({
      success: true,
      message: 'Lab case status updated',
      data: labCase,
    })
  } catch (error) {
    next(error)
  }
}
