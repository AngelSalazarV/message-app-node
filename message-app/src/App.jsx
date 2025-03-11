import { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import socket from "./client"
import {Login} from "./pages/Login.jsx"
import {Home} from "./pages/Home.jsx"
import PrivateRoute from "./components/PrivateRoute/PrivateRoute.jsx"
import injectContext from "./context/AppContext.jsx"

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
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        </Routes>
    </Router>
  )
}

export default injectContext(App)
