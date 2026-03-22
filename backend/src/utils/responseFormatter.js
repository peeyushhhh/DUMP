const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    })
  }
  
  const sendError = (res, error = 'Something went wrong', statusCode = 500) => {
    return res.status(statusCode).json({
      success: false,
      error
    })
  }
  
  module.exports = { sendSuccess, sendError }