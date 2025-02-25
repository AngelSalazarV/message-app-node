import Sidebar from '../components/Sidebar';
import ContainerMessage from '../components/ContainerMessage';

export function Home() {
  return (
    <main>
      <section className="flex">
        <Sidebar />
        <ContainerMessage />
      </section>
    </main>
  )
}
