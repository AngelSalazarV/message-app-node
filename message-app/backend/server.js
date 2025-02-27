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

//search users by username
app.get('/api/users', async (req, res) => {
  const { query, userId } = req.query

  const { data, error } = await supabase
    .from('users')
    .select('id, username, email')
    .ilike('username', `%${query}%`)
    .neq('id', userId)

    if(error){
      return res.status(400).json({message: 'Error searching users', error: error.message})
    }
    res.json(data)
})


//save messages in DB
app.post('/api/messages', async (req, res) => {
  const { sender_id, receiver_id, content } = req.body

  const { data, error } = await supabase
    .from('messages')
    .insert([{sender_id, receiver_id, content}])
    .select()

    if(error){
      return res.status(400).json({message: 'Error saving message', error: error.message})
    }

    res.json(data)
})


//get messages from 2 users
app.get('/api/messages', async (req, res) => {
  const { sender_id, receiver_id } = req.query;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${sender_id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${sender_id})`)
    .order('created_at', { ascending: true });

  if (error) {
    return res.status(400).json({ message: 'Error fetching messages', error: error.message });
  }

  res.json(data);
})

//conection to socket
const users = {}

io.on('connection', (socket) => {
  console.log('User connected', socket.id)

  //user conected, save ID and socket ID
  socket.on('userConnected', (userId) => {
    users[userId] = socket.id
    console.log(`User ${userId} registered with socket ID: ${socket.id}`) 
  })

  //Send message to receptor user
  socket.on('sendMessage', async (message) => {

    //save message in supabase
    const { data, error } = await supabase
      .from('messages')
      .insert([message])
      .select()

      if(error){
        console.log('Error saving message:', error.message)
        return
      }

      const savedMessage = data[0]
      const receiverSocketId = users[savedMessage.receiver_id]

      //send message to receptor user
      if(receiverSocketId){
        io.to(receiverSocketId).emit('receivedMessage', savedMessage)
      }

      //send message to sender user
      io.to(socket.id).emit('receivedMessage', savedMessage)
  })

  socket.on('disconnect', () => {
    const disconnectedUser = Object.keys(users).find(key => users[key] === socket.id)
    if(disconnectedUser){
      delete users[disconnectedUser]
    }
    console.log(`User ${disconnectedUser} disconnected`)
  })
})


//Server listening
server.listen(port, () => {
  console.log(`Server running in http://localhost:${port}`)
})