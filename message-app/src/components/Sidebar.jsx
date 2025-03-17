import { useEffect, useState } from "react";
import socket from "../client";
import ContactCard from "./ContactCard";

function Sidebar({ onSelectedContact }) {

  const [search, setSearch] = useState("") 
  const [contacts, setContacts] = useState([])
  const [recentContacts, setRecentContacts] = useState([])
  const userId = localStorage.getItem('userId')

  useEffect(() => {
    const fetchContacts = async () => {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/contacts?user_id=${userId}`)
      const data = await res.json()
      setRecentContacts(data)
    }
    fetchContacts()
  }, [userId])

  useEffect(() => {
    socket.on('newContact', ({ contact }) => {
      if (contact.user_id === userId || contact.contact_id === userId) {
        setRecentContacts((prev) => [...prev, contact]);
      }
    });

    return () => {
      socket.off('newContact');
    };
  }, [userId])

  const handleSearch = async (e) => {
    setSearch(e.target.value)

    if((e.target.value.length) > 2){
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/users?query=${e.target.value}&userId=${userId}`)
      const data = await res.json()
      setContacts(data)
    }else{
      setContacts([])
    }
  }

  const combinedContacts = search.length > 2 ? contacts : recentContacts

  return(
    <div className="w-2xl flex flex-col bg-gray-100 h-screen border-r border-gray-200">
      <div className="w-full bg-white px-3 py-2">
        <div className="flex flex-col gap-y-4">
          <h1 className="font-semibold text-2xl">Chats</h1>
          <input 
            type="text" 
            placeholder="Buscar..."
            value={search}
            onChange={handleSearch} 
            className="p-1 bg-gray-100 rounded-md outline-none"/>
        </div>
      </div>
      <div>
        {combinedContacts.map((contact) => {
          return (
            <div key={`${userId}- ${contact.contact_id}`} onClick={() => onSelectedContact(contact)}>
              <ContactCard name={contact.username ? contact.username : contact.users.username} />
            </div>
          )  
        })}
      </div>
    </div>
  )
}

export default Sidebar;