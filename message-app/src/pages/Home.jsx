import { useState, useEffect } from 'react';
import socket from '../client';
import {FirstPageToShow} from '../components/FirstPageToShow';
import Sidebar from '../components/Sidebar';
import ContainerMessage from '../components/ContainerMessage';

export function Home() {

  const [selectedContact, setSelectedContact] = useState(null)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if(userId){
      socket.emit('userConnected', userId)
    }
  }, [])

  return (
    <main>
      <section className="flex">
        <Sidebar onSelectedContact={setSelectedContact} />
        {selectedContact ? <ContainerMessage contact={selectedContact} /> : <FirstPageToShow />}
      </section>
    </main>
  )
}
