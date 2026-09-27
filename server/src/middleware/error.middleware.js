export const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Duplicate field
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];

    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // Invalid MongoDB ID
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(
      (error) => error.message
    );

    return res.status(400).json({
      success: false,
      message: messages.join(", "),
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};