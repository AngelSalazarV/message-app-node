import { createContext, useState, useEffect } from "react";
import { initDB, getContacts, saveContacts, getMessages, saveMessages, deleteMessage } from "../utils/indexedDB";
import socket, { supabase } from "../client";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true); // Estado de carga

  useEffect(() => {
    const initializeData = async () => {
      await initDB();

      const userId = localStorage.getItem("userId");


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
          acc[chatId].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          return acc;
        }, {});

        setMessages(messagesByChat);
      }

      setLoading(false)
    };

    initializeData();
  }, []);

  useEffect(() => {
    socket.on("newContact", async ({contact}) => {
      console.log("Nuevo contacto recibido:", contact);

      // Verificar si el contacto ya existe
      const existingContact = contacts.find(c => c.contact_id === contact.contact_id);

      if(!existingContact) {
        await saveContacts([contact]);

        setContacts((prev) => [...prev, contact]);
      }
    })

    return () => {
      socket.off("newContact");
    }
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

  const deleteMessageFromState = async (chatId, messageId) => {
    // Eliminar el mensaje de IndexedDB
    await deleteMessage(messageId);
    
    // Actualizar el estado global
    setMessages((prev) => {
      const updatedMessages = { ...prev };
      if (updatedMessages[chatId]) {
        updatedMessages[chatId] = updatedMessages[chatId].filter((msg) => msg.id !== messageId);
      }
      return updatedMessages;
    });
  }

  const addContacts = async (newContacts) => {
    // Verificar si el contacto ya existe
    const existingContactIds = contacts.map(contact => contact.contact_id)

    const contactsToAdd = newContacts.filter(contact => !existingContactIds.includes(contact.contact_id))

    if (contactsToAdd.length === 0) {
      console.log("No new contacts to add.")
      return
    }

    // Guardar los nuevos contactos en IndexedDB
    await saveContacts(contactsToAdd)

    // Actualizar el estado de contactos
    setContacts((prev) => [...prev, ...contactsToAdd])

    console.log("New contacts added:", contactsToAdd)
  };

  return (
    <GlobalContext.Provider value={{ contacts, messages, loadMessages, addMessages, addContacts, deleteMessageFromState, loading }}>
      {children}
    </GlobalContext.Provider>
  );
};