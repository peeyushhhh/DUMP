const errorHandler = (err, req, res, next) => {
    console.error(`[${req.requestId}] ${err.stack}`)
  
    const statusCode = err.statusCode || 500
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  
    return res.status(statusCode).json({
      success: false,
      error: message
    })
  }
  
  module.exports = errorHandler