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
      const res = await fetch(`http://localhost:3000/api/contacts?user_id=${userId}`)
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

  useEffect(() => {
    socket.on('newLastMessage', ({ message }) => {
      setRecentContacts((prev) => {
        return prev.map((contact) => {
          if (contact.contact_id === message.sender_id || contact.contact_id === message.receiver_id) {
            return { ...contact, last_message: message };
          }
          return contact;
        });
      });
    });
    return () => {
      socket.off('newLastMessage');
    };
  }, [userId])

  useEffect(() => {
    socket.on('updateUnreadCount', ({ receiver_id, sender_id }) => {
      if (receiver_id === userId) {
        setRecentContacts((prevContacts) =>
          prevContacts.map((contact) => {
            if (contact.contact_id === sender_id) {
              return {
                ...contact,
                unreadCount: (contact.unreadCount || 0) + 1, 
                last_message: {
                  ...contact.last_message,
                  created_at: new Date().toISOString(), 
                },
              }
            }
            return contact;
          })
        )
      }
    })
  
    return () => {
      socket.off('updateUnreadCount');
    };
  }, [userId])

  useEffect(() => {
    socket.on('messagesSeen', ({ sender_id, receiver_id }) => {
      // Actualizar el estado de los contactos para borrar las notificaciones
      if (receiver_id === userId) {
        setRecentContacts((prevContacts) =>
          prevContacts.map((contact) => {
            if (contact.contact_id === sender_id) {
              return { ...contact, unreadCount: 0 }; // Borrar las notificaciones
            }
            return contact;
          })
        );
      }
    });
  
    return () => {
      socket.off('messagesSeen');
    };
  }, [userId])

  const handleSearch = async (e) => {
    setSearch(e.target.value)

    if((e.target.value.length) > 2){
      const res = await fetch(`http://localhost:3000/api/users?query=${e.target.value}&userId=${userId}`)
      const data = await res.json()
      setContacts(data)
    }else{
      setContacts([])
    }
  }

  const combinedContacts = search.length > 2 ? contacts : recentContacts

  //TODO: ARREGLAR ULTIMO MENSAJE DE CONTACTOS
  return(
    <div className="w-100 flex flex-col bg-gray-100 h-screen border-r border-gray-200">
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
          const lastMessageTime = contact?.last_message?.created_at;
          const lastMessage = contact?.last_message?.content;
          return (
            <div 
              key={`${userId}- ${contact.contact_id}`} 
              onClick={() => onSelectedContact(contact)}
             >
              <ContactCard 
                name={contact.username ? contact.username : contact.users.username} 
                lastMessageTime={lastMessageTime}
                lastMessage={lastMessage}
                unreadCount={contact.unreadCount}
              />
            </div>
          )  
        })}
      </div>
    </div>
  )
}

export default Sidebar;