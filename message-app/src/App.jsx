import { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import socket from "./client"
import {Login} from "./pages/Login.jsx"
import {Home} from "./pages/Home.jsx"

function App() {
  
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server')
    })

    return () => {
      socket.off('connect')
    }
  }, [])

  return (
    <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
        </Routes>
    </Router>
  )
}

export default App
