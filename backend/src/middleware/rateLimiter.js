const rateLimit = require('express-rate-limit')

const postLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many posts. Try again in 10 minutes.' }
})

const replyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many replies. Try again in 10 minutes.' }
})

module.exports = { postLimiter, replyLimiter }