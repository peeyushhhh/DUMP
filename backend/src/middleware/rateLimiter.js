const rateLimit = require('express-rate-limit')

const postLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many posts. Try again in 10 minutes.' }
})

const commentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many comments. Try again in 10 minutes.' }
})

module.exports = { postLimiter, commentLimiter }