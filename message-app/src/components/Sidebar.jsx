import { useContext, useState, useEffect } from "react";
import { GlobalContext } from "../context/GlobalContext";
import socket from "../client";
import ContactCard from "./ContactCard";

function Sidebar({ onSelectedContact }) {
  const { contacts, messages, updateLastMessage } = useContext(GlobalContext);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const userId = localStorage.getItem("userId");

  const getChatId = (id1, id2) => {
    return [id1, id2].sort().join("-");
  };


  useEffect(() => {
    socket.on("newLastMessage", ({ message }) => {
      // Actualizar el último mensaje en los contactos
      updateLastMessage(message);
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
    <div className="w-100 flex flex-col h-screen border-r border-gray-200 pr-2">
      <div className="w-full px-3 py-2 border-b border-gray-200">
        <div className="flex flex-col gap-y-4 mb-5">
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
          const chatId = getChatId(contact.contact_id, userId);
          const lastMessage = contact.last_message
          const lastMessageTime = lastMessage?.created_at;
          const lastMessageContent = lastMessage?.type === "audio" ? "Audio" : lastMessage?.content;
          const unreadCount = messages[chatId]?.filter((msg) => !msg.seen && msg.receiver_id === userId).length || 0;

          return (
            <div key={chatId} onClick={() => onSelectedContact(contact)}
              className="cursor-pointer hover:bg-gray-100"
            >
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