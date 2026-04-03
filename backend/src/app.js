const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const requestId = require('./middleware/requestId')
const errorHandler = require('./middleware/errorHandler')
const postRoutes = require('./routes/postRoutes')
const replyRoutes = require('./routes/replyRoutes')
const reportRoutes = require('./routes/reportRoutes')
const chatRoutes = require('./routes/chatRoutes')
const therapistRoutes = require('./routes/therapistRoutes')
const notificationRoutes = require('./routes/notificationRoutes')
const pushRoutes = require('./routes/pushRoutes')


const app = express()
app.set('trust proxy', 1)

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean)

app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS policy: origin ${origin} not allowed`))
    }
  },
  credentials: true,
}))

// ── Body parsing + sanitization ───────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))

// Manual mongo sanitize (replaces express-mongo-sanitize, incompatible with Express v5)
const sanitize = (obj) => {
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key]
      } else {
        sanitize(obj[key])
      }
    })
  }
}
app.use((req, res, next) => {
  sanitize(req.body)
  sanitize(req.params)
  next()
})

app.use(requestId)

// ── Rate limiters ─────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 999999 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
})

const therapistChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI chat limit reached, please wait before sending more messages.' },
})

const createPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Post limit reached, please slow down.' },
})

app.use(globalLimiter)

// ── Health ────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'DUMP API is running' })
})

// ── Routes ────────────────────────────────────────────────────
app.use('/api/v1/posts', createPostLimiter, postRoutes)
app.use('/api/v1/replies', replyRoutes)
app.use('/api/v1/reports', reportRoutes)
app.use('/api/v1/chat', chatRoutes)
app.use('/api/v1/therapist', therapistChatLimiter, therapistRoutes)
app.use('/api/v1/notifications', notificationRoutes)
app.use('/api/v1/push', pushRoutes)

app.use(errorHandler)

module.exports = app