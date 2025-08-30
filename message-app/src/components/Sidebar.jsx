import { useContext, useState, useEffect } from "react";
import { GlobalContext } from "../context/GlobalContext";
import socket from "../client";
import ContactCard from "./ContactCard";
import { LogOut } from "lucide-react";
import LogoutModal from "./LogoutModalNew";

function Sidebar({ onSelectedContact }) {
  const { contacts, messages, updateLastMessage } = useContext(GlobalContext);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeContactId, setActiveContactId] = useState(null);
  const [logoutModalActive, setLogoutModalActive] = useState(false);
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
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/users?query=${e.target.value}&userId=${userId}`);
      const data = await res.json();
      setSearchResults(data);
    } else {
      setSearchResults([]);
    }
  };

  const combinedContacts = search.length > 2 ? searchResults : contacts;

  const sortedContacts = [...combinedContacts].sort((a, b) => {
  const aTime = a.last_message?.created_at ? new Date(a.last_message.created_at).getTime() : 0;
  const bTime = b.last_message?.created_at ? new Date(b.last_message.created_at).getTime() : 0;
  return bTime - aTime;
});

const handleOpenLogoutModal = () => {
  setLogoutModalActive(true);
}
const handleCloseLogoutModal = () => {
  setLogoutModalActive(false);
}

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  setLogoutModalActive(false);
  window.location.reload();
}

  return (
    <>
    <div className="w-100 flex flex-col h-screen border-r border-gray-200 pr-2">
      <div className="w-full px-3 py-2 border-b border-gray-200">
        <div className="flex flex-col gap-y-4 mb-5">
          <div className="flex justify-between items-center">
            <h1 className="font-semibold text-2xl">Chats</h1>
            <LogOut onClick={handleOpenLogoutModal} className="cursor-pointer bg-red-200 rounded-2xl p-1" color="red" />
          </div>
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
        {sortedContacts.map((contact) => {
          const chatId = getChatId(contact.contact_id, userId);
          const lastMessage = contact.last_message
          const lastMessageTime = lastMessage?.created_at;
          const lastMessageContent = lastMessage?.type === "audio" ? "Audio" : lastMessage?.content;
          const unreadCount = messages[chatId]?.filter((msg) => !msg.seen && msg.receiver_id === userId).length || 0;
        
          return (
            <div key={chatId} onClick={() => { onSelectedContact(contact); setActiveContactId(contact.contact_id); }}
              className="cursor-pointer hover:bg-gray-100"
            >
              <ContactCard
                name={contact.username || contact.users?.username} 
                lastMessageTime={lastMessageTime}
                lastMessage={lastMessageContent}
                unreadCount={unreadCount}
                active={activeContactId === contact.contact_id}
              />
            </div>
          );
        })}
        
      </div>
    </div>
    <LogoutModal active={logoutModalActive} onClose={handleCloseLogoutModal} onLogout={handleLogout} />
    </>
  );
}

export default Sidebar;