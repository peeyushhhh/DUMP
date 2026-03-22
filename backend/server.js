require('dotenv').config()
const http = require('http')
const { Server } = require('socket.io')
const app = require('./src/app')
const connectDB = require('./src/config/db')
const { initializeSockets } = require('./src/sockets/chatSocket')

const PORT = process.env.PORT || 5000

const start = async () => {
  await connectDB()

  const server = http.createServer(app)

  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  })

  initializeSockets(io)

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

start()