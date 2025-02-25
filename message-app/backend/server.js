import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import { createClient } from '@supabase/supabase-js'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const port = process.env.PORT || 3000

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

app.use(express.json())
app.use(cors())

//Supabase config
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)


//login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body

  //supabase autentication
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if(error){
    return res.status(401).json({message: 'Invalid credentials', error: error.message})
  }

  return res.status(200).json({user: data.user, token: data.session.access_token})
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