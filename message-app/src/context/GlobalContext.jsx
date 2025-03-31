import { createContext, useState, useEffect } from "react";
import { initDB, getContacts, saveContacts, getMessages, saveMessages } from "../utils/indexedDB";
import { supabase } from "../client";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true); // Estado de carga

  useEffect(() => {
    const initializeData = async () => {
      await initDB();

      const userId = localStorage.getItem("userId");

      if (!userId) {
        console.error("User ID not found in localStorage");
        setLoading(false);
        return;
      }

      // Intentar cargar contactos desde IndexedDB
      const storedContacts = await getContacts();
      if (storedContacts.length > 0) {
        console.log("Contacts loaded from IndexedDB:", storedContacts);
        setContacts(storedContacts);
      } else {
        const { data: supabaseContacts, error: contactsError } = await supabase
          .from("contacts")
          .select(`
            id,
            user_id,
            contact_id,
            created_at,
            users:contact_id (username)
          `)
          .eq("user_id", userId);

        if (contactsError) {
          console.error("Error fetching contacts from Supabase:", contactsError.message);
        } else {
          console.log("Contacts fetched from Supabase:", supabaseContacts);
          await saveContacts(supabaseContacts);
          setContacts(supabaseContacts);
        }
      }

      // Sincronizar mensajes desde Supabase
      const { data: supabaseMessages, error: messagesError } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, type, created_at, seen");

      if (messagesError) {
        console.error("Error fetching messages from Supabase:", messagesError.message);
      } else {
        console.log("Messages fetched from Supabase:", supabaseMessages);
        await saveMessages(supabaseMessages);

        // Organizar mensajes por chat ID y ordenarlos por fecha
        const messagesByChat = supabaseMessages.reduce((acc, message) => {
          const chatId = `${message.sender_id}-${message.receiver_id}`;
          if (!acc[chatId]) acc[chatId] = [];
          acc[chatId].push(message);
          acc[chatId].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // Ordenar por fecha
          return acc;
        }, {});

        setMessages(messagesByChat);
      }

      setLoading(false); // Finalizar la carga
    };

    initializeData();
  }, []);

  const loadMessages = async (chatId, sender_id, receiver_id, limit = 20, offset = 0) => {
    const storedMessages = await getMessages(sender_id, receiver_id, limit, offset);

    setMessages((prev) => {
      const existingMessages = prev[chatId] || [];
      const newMessages = storedMessages.filter(
        (msg) => !existingMessages.some((existingMsg) => existingMsg.id === msg.id)
      );

      return {
        ...prev,
        [chatId]: [...existingMessages, ...newMessages].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ),
      };
    });
  };

  const addMessages = async (chatId, newMessages) => {
    await saveMessages(newMessages);
    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), ...newMessages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    }));
  };

  const addContacts = async (newContacts) => {
    await saveContacts(newContacts);
    setContacts((prev) => [...prev, ...newContacts]);
  };

  return (
    <GlobalContext.Provider value={{ contacts, messages, loadMessages, addMessages, addContacts, loading }}>
      {children}
    </GlobalContext.Provider>
  );
};