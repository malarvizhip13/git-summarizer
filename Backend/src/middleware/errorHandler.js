const errorHandler = (error, req, res, next) => {
  console.error("Unhandled error:", error);

  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    error: {
      message:
        statusCode === 500
          ? "Internal server error"
          : error.message,
    },
  });
};

module.exports = errorHandler;