import { useState } from "react";
import ContactCard from "./ContactCard";

function Sidebar({ onSelectedContact }) {

  const [search, setSearch] = useState("") 
  const [contacts, setContacts] = useState([])

  const handleSearch = async (e) => {
    setSearch(e.target.value)

    if((e.target.value.length) > 2){
      const res = await fetch(`http://localhost:3000/api/users?query=${e.target.value}`)
      const data = await res.json()
      setContacts(data)
    }else{
      setContacts([])
    }
  }

  return(
    <div className="flex flex-col bg-gray-100 h-screen border-r border-gray-200">
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
        {contacts.map((contact) => {
          return (
            <div key={contact.id} onClick={() => onSelectedContact(contact)}>
              <ContactCard name={contact.username} />
            </div>
          )  
        })}
      </div>
    </div>
  )
}

export default Sidebar;