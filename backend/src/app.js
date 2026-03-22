const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const requestId = require('./middleware/requestId')
const errorHandler = require('./middleware/errorHandler')

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '10kb' }))
app.use(requestId)

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'DUMP API is running' })
})

app.use(errorHandler)

module.exports = app