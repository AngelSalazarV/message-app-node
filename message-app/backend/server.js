import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'node:http'

const port = process.env.PORT || 3000

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

io.on('connection', (socket) => {
  console.log('User connected')

  //Listen a message from client
  socket.on('sendMessage', (message) => {
    console.log('Message received:', message) 

    io.emit('receivedMessage', message)
  })


  socket.on('disconnect', () => {
    console.log('User disconected')
  })
})



app.get('/', (req, res) => {
  res.send('<h1>MessagApp</h1>')
})

server.listen(port, () => {
  console.log(`Server running in http://localhost:${port}`)
})