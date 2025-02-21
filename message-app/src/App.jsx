import ContainerMessage from "./components/ContainerMessage"
import Sidebar from "./components/Sidebar"
function App() {

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
