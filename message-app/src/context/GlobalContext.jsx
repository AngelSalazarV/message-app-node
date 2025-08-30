import { createContext, useState, useEffect } from "react";
import { initDB, getContacts, saveContacts, getMessages, saveMessages, deleteMessage } from "../utils/indexedDB";
import socket, { supabase } from "../client";
import { Loader } from "../components/Loader";
import { ForceLogoutModal } from "../components/ForceLogoutModal";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const [forceLogout, setForceLogout] = useState(false);

  // Función de logout global
  const logout = () => {
    localStorage.clear();
    indexedDB.deleteDatabase("MessageAppDB"); // Limpia IndexedDB si quieres
    setUserId(null);
    window.location.href = "/login";
  };

  // Helper para fetch seguro
  const safeFetch = async (...args) => {
    const res = await fetch(...args);
    if ([401, 403, 404].includes(res.status)) {
      setForceLogout(true);
      throw new Error("Sesión inválida o recurso no encontrado");
    }
    return res;
  };

  useEffect(() => {
    setLoading(true);
    setProgress(0);
    const initializeData = async () => {
      setProgress(10)
      await initDB();
      setProgress(20)

      if (!userId) {
        setContacts([]);
        setMessages({});
        setLoading(false);
        setProgress(100);
        return;
      }


      // Intentar cargar contactos desde IndexedDB
      const storedContacts = await getContacts(userId);
      setProgress(40)
      if (storedContacts.length > 0) {
        setContacts(storedContacts);
      } else {
        try {
          const response = await safeFetch(`${import.meta.env.VITE_SERVER_URL}/api/contacts?user_id=${userId}`);
          const backendContacts = await response.json();
          console.log("Contacts fetched from backend:", backendContacts);
          await saveContacts(backendContacts, userId);
          setContacts(backendContacts);
        } catch (error) {
          console.error("Error fetching contacts from backend:", error);
        }
      }
      setProgress(60)

      // Sincronizar mensajes desde Supabase
      const { data: supabaseMessages, error: messagesError } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, type, created_at, seen");

      setProgress(80)

      if (messagesError) {
        setForceLogout(true);
        console.error("Error fetching messages from Supabase:", messagesError.message);
        return
      } else {
        await saveMessages(supabaseMessages, userId);

        // Organizar mensajes por chat ID y ordenarlos por fecha
        const messagesByChat = supabaseMessages.reduce((acc, message) => {
          const chatId = [message.sender_id, message.receiver_id].sort().join("-");
          if (!acc[chatId]) acc[chatId] = [];
          acc[chatId].push(message);
          acc[chatId].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          return acc;
        }, {});

        setMessages(messagesByChat);
      }

      setProgress(100);
      setLoading(false);
    };

    initializeData();
  }, [userId]);

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
  }, [contacts])

  useEffect(() => {
    socket.on("messageSeen", (updatedMessage) => {
      const chatId = [updatedMessage.sender_id, updatedMessage.receiver_id].sort().join("-");
      setMessages((prev) => ({
        ...prev,
        [chatId]: prev[chatId]?.map(msg =>
          msg.id === updatedMessage.id ? { ...msg, seen: true } : msg
        ),
      }));
    });

    return () => {
      socket.off("messageSeen");
    };
  }, []);

  //  const addMessages = useCallback(async (chatId, newMessages) => {
  //   await saveMessages(newMessages);
  //   setMessages((prev) => {
  //     const updated = [...(prev[chatId] || []), ...newMessages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  //     console.log("[addMessages] updated state for", chatId, updated);
  //     return {
  //       ...prev,
  //       [chatId]: updated,
  //     };
  //   });
  // }, []);

  const loadMessages = async (chatId, sender_id, receiver_id, limit = 20, offset = 0) => {
    // Espera ambos resultados antes de actualizar el estado
    const [storedMessages, backendResponse] = await Promise.all([
      getMessages(sender_id, receiver_id, userId, limit, offset),
      fetch(`${import.meta.env.VITE_SERVER_URL}/api/messages?sender_id=${sender_id}&receiver_id=${receiver_id}`)
    ]);
    const backendMessages = await backendResponse.json();

    // Combina y evita duplicados
    const allMessages = [...storedMessages, ...backendMessages].reduce((acc, msg) => {
      if (!acc.find(m => m.id === msg.id)) acc.push(msg);
      return acc;
    }, []);

    // Guarda en IndexedDB solo los nuevos mensajes
    await saveMessages(allMessages, userId);

    // Actualiza el estado global SOLO UNA VEZ
    setMessages((prev) => ({
      ...prev,
      [chatId]: allMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    }));
  };

  useEffect(() => {
    socket.on("receivedMessage", (newMessage) => {
      const chatId = [newMessage.sender_id, newMessage.receiver_id].sort().join("-");
      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), newMessage].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
      }));
    });

    return () => {
      socket.off("receivedMessage");
    };
  }, []);
 
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

    // Actualizar el last_message del contacto correspondiente
    setContacts((prev) => {
      return prev.map((contact) => {
        const thisChatId = [contact.contact_id, userId].sort().join("-");
        if (thisChatId === chatId) {
          // Buscar el nuevo último mensaje
          const chatMessages = (messages[chatId] || []).filter((msg) => msg.id !== messageId);
          const lastMsg = chatMessages.length > 0
            ? chatMessages[chatMessages.length - 1]
            : null;
          return { ...contact, last_message: lastMsg };
        }
        return contact;
      });
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
    await saveContacts(contactsToAdd, userId)

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
      saveContacts(updatedContacts, userId);
      return updatedContacts;
    });
  }

  return (
    <GlobalContext.Provider value={{ contacts, messages, loadMessages, addContacts, deleteMessageFromState, loading, updateLastMessage, userId, setUserId, logout }}>
      {forceLogout && <ForceLogoutModal onConfirm={logout} />}
      {loading ? <Loader progress={progress} /> : children}
    </GlobalContext.Provider>
  );
};