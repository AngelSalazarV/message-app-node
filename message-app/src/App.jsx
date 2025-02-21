import { useEffect } from "react"
import ContainerMessage from "./components/ContainerMessage"
import Sidebar from "./components/Sidebar"
import socket from "./client"
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
    <>
     <main>
      <section className="flex">
        <Sidebar />
        <ContainerMessage />
        
      </section>
     </main>
    </>
  )
}

export default App
