import { io } from 'socket.io-client'

//import.meta.env.VITE_SERVER_URL
const socket = io(import.meta.env.VITE_SERVER_URL) 

export default socket