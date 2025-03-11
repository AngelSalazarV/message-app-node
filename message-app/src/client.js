import { io } from 'socket.io-client'

//import.meta.env.VITE_SERVER_URL
const socket = io('http://localhost:3000') 

socket.on('connect', () => {
  console.log('Connected to server')
})

export default socket