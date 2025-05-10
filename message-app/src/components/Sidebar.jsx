import { useContext, useState, useEffect } from "react";
import { GlobalContext } from "../context/GlobalContext";
import socket from "../client";
import ContactCard from "./ContactCard";

function Sidebar({ onSelectedContact }) {
  const { contacts, messages } = useContext(GlobalContext);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const userId = localStorage.getItem("userId");


  useEffect(() => {
    socket.on("newLastMessage", ({ message }) => {
      // Actualizar el último mensaje en los contactos
      setSearchResults((prev) => {
        const updatedContacts = prev.map((contact) => {
          if (contact.contact_id === message.sender_id || contact.contact_id === message.receiver_id) {
            return { ...contact, last_message: message, username: contact.username };
          }
          return contact;
        });

        // Ordenar los contactos por la fecha del último mensaje
        return updatedContacts.sort((a, b) => {
          const dateA = new Date(a.last_message?.created_at || 0);
          const dateB = new Date(b.last_message?.created_at || 0);
          return dateB - dateA; // Orden descendente
        });
      });
    });

    return () => {
      socket.off("newLastMessage");
    };
  }, []);

  const handleSearch = async (e) => {
    setSearch(e.target.value);

    if (e.target.value.length > 2) {
      // Realizar búsqueda de usuarios
      const res = await fetch(`http://localhost:3000/api/users?query=${e.target.value}&userId=${userId}`);
      const data = await res.json();
      setSearchResults(data);
    } else {
      setSearchResults([]);
    }
  };

  const combinedContacts = search.length > 2 ? searchResults : contacts;

  return (
    <div className="w-100 flex flex-col bg-gray-100 h-screen border-r border-gray-200">
      <div className="w-full bg-white px-3 py-2">
        <div className="flex flex-col gap-y-4">
          <h1 className="font-semibold text-2xl">Chats</h1>
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={handleSearch}
            className="p-1 bg-gray-100 rounded-md outline-none"
          />
        </div>
      </div>
      <div>
        {combinedContacts.map((contact) => {
          const chatId = `${contact.user_id}-${contact.contact_id}`;
          const lastMessage = messages[chatId]?.[messages[chatId].length - 1];
          const lastMessageTime = lastMessage?.created_at;
          const lastMessageContent = lastMessage?.type === "audio" ? "Audio" : lastMessage?.content;
          const unreadCount = messages[chatId]?.filter((msg) => !msg.seen).length || 0;
  
          return (
            <div key={chatId} onClick={() => onSelectedContact(contact)}>
              <ContactCard
                name={contact.username || contact.users?.username} // Cambia esto si tienes un campo de nombre
                lastMessageTime={lastMessageTime}
                lastMessage={lastMessageContent}
                unreadCount={unreadCount}
              />
            </div>
          );
        })}
        
      </div>
    </div>
  );
}

export default Sidebar;