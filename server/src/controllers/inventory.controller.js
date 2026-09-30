import {
  getInventoryRecords,
  getInventorySummary,
  importInventoryRows,
} from '../services/inventory.service.js'

export const listInventoryRecords = async (_req, res, next) => {
  try {
    const records = await getInventoryRecords()
    res.status(200).json({ success: true, count: records.length, data: records })
  } catch (error) {
    next(error)
  }
}

export const getInventoryOverview = async (_req, res, next) => {
  try {
    const summary = await getInventorySummary()
    res.status(200).json({ success: true, data: summary })
  } catch (error) {
    next(error)
  }
}

export const importInventory = async (req, res, next) => {
  try {
    const result = await importInventoryRows(req.body?.records)
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error })
    }
    res.status(201).json({
      success: true,
      message: `${result.processedCount} inventory rows imported`,
      ...result,
    })
  } catch (error) {
    next(error)
  }
}
