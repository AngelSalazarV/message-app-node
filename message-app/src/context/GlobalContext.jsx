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
        //console.log("Contacts loaded from IndexedDB:", storedContacts);
        setContacts(storedContacts);
      } else {
        try {
          const response = await fetch(`http://localhost:3000/api/contacts?user_id=${userId}`);
          const backendContacts = await response.json();
          console.log("Contacts fetched from backend:", backendContacts);
          await saveContacts(backendContacts);
          setContacts(backendContacts);
        } catch (error) {
          console.error("Error fetching contacts from backend:", error);
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
  }, [])

  const loadMessages = async (chatId, sender_id, receiver_id, limit = 20, offset = 0) => {
    // Obtener mensajes desde IndexedDB o Supabase
    const storedMessages = await getMessages(sender_id, receiver_id, limit, offset);
  
    setMessages((prev) => {
      const newMessages = storedMessages.filter(
        (msg) =>
          (msg.sender_id === sender_id && msg.receiver_id === receiver_id) ||
          (msg.sender_id === receiver_id && msg.receiver_id === sender_id)
      );
  
      return {
        ...prev,
        [chatId]: [...newMessages].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ),
      };
    });
  }

  

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
  }

  const updateLastMessage = async (message) => {
    setContacts((prev) => {
      const updatedContacts = prev.map((contact) =>
        contact.contact_id === message.sender_id || contact.contact_id === message.receiver_id
          ? { ...contact, last_message: message }
          : contact
      );
      // Actualiza también en IndexedDB
      saveContacts(updatedContacts);
      return updatedContacts;
    });
  }

  return (
    <GlobalContext.Provider value={{ contacts, messages, loadMessages, addMessages, addContacts, deleteMessageFromState, loading, updateLastMessage }}>
      {children}
    </GlobalContext.Provider>
  );
};