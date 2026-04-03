const rateLimit = require('express-rate-limit')

const skipInDev = (req) => process.env.NODE_ENV === 'development'

const postLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many posts. Try again in 10 minutes.' },
  skip: skipInDev,
})

const commentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many comments. Try again in 10 minutes.' },
  skip: skipInDev,
})

module.exports = { postLimiter, commentLimiter }