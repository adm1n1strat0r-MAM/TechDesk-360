export const validateUser = (req, res, next) => {
  const { DomainID, name, email } = req.body

  if (req.method === 'POST' && (!DomainID || !name || !email)) {
    return res.status(400).json({
      success: false,
      message: "Domain ID, name and email are required",
    })
  }

  if (req.method === 'PUT' && Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Provide at least one user field to update',
    })
  }

  next()
}
