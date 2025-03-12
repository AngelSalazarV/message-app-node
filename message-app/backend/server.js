import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import { createClient } from '@supabase/supabase-js'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'
import { Readable } from 'stream'

dotenv.config()

const port = process.env.PORT || 3000

const app = express()
const upload = multer({ storage: multer.memoryStorage() })
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
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
// app.post('/api/messages', async (req, res) => {
//   const { sender_id, receiver_id, content } = req.body

//   const { data, error } = await supabase
//     .from('messages')
//     .insert([{sender_id, receiver_id, content}])
//     .select()

//     if(error){
//       return res.status(400).json({message: 'Error saving message', error: error.message})
//     }

//     res.json(data)
// })


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

//add contacts 
app.post('/api/contacts', async (req, res) => {
  const { user_id, contact_id } = req.body

  

  const { data, error } = await supabase
    .from('contacts')
    .insert([{user_id, contact_id}])
    .select()

    if(error) {
      return res.status(400).json({message: 'Error adding contacts', error: error.message})
    }

    res.json(data)
})

//get contacts
app.get('/api/contacts', async (req, res) => {
  const { user_id } = req.query

  const { data, error } = await supabase
    .from('contacts')
    .select(`
      contact_id, 
      users:contact_id (username)
      `)
    .eq('user_id', user_id)

    if(error){
      return res.status(400).json({message: 'Error fetching contacts', error: error.message})
    }

    res.json(data)
})

// Save audio messages
app.post('/api/messages/audio', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file received' });

  const { sender_id, receiver_id } = req.body;
  const audioBuffer = req.file.buffer;
  const audioStream = Readable.from(audioBuffer);
  const fileName = `${Date.now()}-${req.file.originalname}`;

  const { data, error } = await supabase.storage
    .from('audio-messages')
    .upload(fileName, audioStream, {
      contentType: req.file.mimetype,
      duplex: 'half'
    });

  if (error) {
    return res.status(500).json({ error_STORAGE: error.message });
  }

  const audioUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/audio-messages/${fileName}`;

  const audioMessage = {
    sender_id,
    receiver_id,
    content: audioUrl,
    type: 'audio',
  };

  // Save audio message in the database
  const { data: messageData, error: messageError } = await supabase
    .from('messages')
    .insert([audioMessage])
    .select();

  if (messageError) {
    return res.status(500).json({ error_COLUMN: messageError.message });
  }

  // Emit the message to the receiver
  const receiverSocketId = users[receiver_id];
  if (receiverSocketId) {
    io.to(receiverSocketId).emit('receivedMessage', messageData[0]);
  }

  // Emit the message to the sender
  const senderSocketId = users[sender_id];
  if (senderSocketId) {
    io.to(senderSocketId).emit('receivedMessage', messageData[0]);
  }

  res.json(messageData[0]);
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



// Serve static files from the React app
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

//Server listening
server.listen(port, () => {
  console.log(`Server running in http://localhost:${port}`)
})