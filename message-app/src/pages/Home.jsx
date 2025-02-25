import { useState } from 'react';
import {FirstPageToShow} from '../components/FirstPageToShow';
import Sidebar from '../components/Sidebar';
import ContainerMessage from '../components/ContainerMessage';

export function Home() {

  const [selectedContact, setSelectedContact] = useState(null)

  return (
    <main>
      <section className="flex">
        <Sidebar onSelectedContact={setSelectedContact} />
        {selectedContact ? <ContainerMessage contact={selectedContact} /> : <FirstPageToShow />}
      </section>
    </main>
  )
}
