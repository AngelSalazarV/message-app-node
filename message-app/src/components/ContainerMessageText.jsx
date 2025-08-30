import { useState, useEffect, useRef, useContext } from "react";
import { GlobalContext } from "../context/GlobalContext";
import socket from "../client";
import moment from "moment-timezone";
import { CheckCheck, ChevronDown } from "lucide-react"
import AudioRecorder from "./AudioRecorder"
import MessagesActionModal from "./MessagesActionModal"
import { Context } from "../context/AppContext";
import { getDeletedForMe, addDeletedForMe } from "../utils/deletedForMe";

const getChatId = (id1, id2) => {
  return [id1, id2].sort().join("-");
}

function ContainerMessageText({ receivedId }) {
  const { messages, loadMessages, deleteMessageFromState, contacts } = useContext(GlobalContext);
  const { actions } = useContext(Context);
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [modalPosition, setModalPosition] = useState(null);
  const messagesEndRef = useRef(null);

  const chatId = getChatId(receivedId, localStorage.getItem("userId"));
  const userId = localStorage.getItem("userId");

  const deletedForMe = getDeletedForMe();
  const filteredMessages = messages[chatId]?.filter(
    (msg) => !deletedForMe.includes(msg.id)
  ) || [];


  useEffect(() => {
    loadMessages(chatId, userId, receivedId);

    return () => {
      setMessage("");
    };
  }, [chatId, receivedId]);

  const sendMessage = async () => {
    if (message.trim() !== "") {
      const exists = contacts.some(c => c.contact_id === receivedId);
        if (!exists) {
          await actions.addContact(userId, receivedId)
        }

      const newMessage = {
        sender_id: userId,
        receiver_id: receivedId,
        content: message,
      };

      // Emitir el mensaje al servidor
      socket.emit("sendMessage", newMessage)

      // Limpiar el campo de entrada
      setMessage("");
    }
  };

  useEffect(() => {
    socket.on("deleteMessage", async ({ id }) => {
      try {
        // Delete message from GlobalContext and IndexedDB
        await deleteMessageFromState(chatId, id);
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    })

    // Clean up the socket listeners when the component unmounts
    return () => {
      socket.off("deleteMessage")
    };
  }, [chatId, deleteMessageFromState])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "auto" });

    const unseenMessages = messages[chatId]?.filter(
      (msg) =>
        msg.receiver_id === userId &&
        !msg.seen
    );
    unseenMessages?.forEach((msg) => {
      fetch(`${import.meta.env.VITE_SERVER_URL}/api/messages/seen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msg.id }),
      });
      socket.emit("messageSeen", { messageId: msg.id }); 
    });
  }, [messages, chatId, userId])

  const formatTimestamp = (timestamp) => {
    const date = moment.utc(timestamp).tz(moment.tz.guess())
    return date.format("HH:mm")
  };

  // Abrir modal
  const handleOpenModal = (message, event) => {
    const rect = event.target.getBoundingClientRect();
    setModalPosition({ top: rect.top, left: rect.left, height: rect.height })
    setSelectedMessage(message)
    console.log(message)
    setIsModalOpen(true)
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMessage(null)
  };

  // Eliminar mensaje
  const deleteMessages = () => {
    const msg = messages[chatId]?.find(m => m.id === selectedMessage);
    if (!msg) return;
    if (msg.sender_id === userId) {
      // Si es tuyo, eliminar de la BD
      socket.emit("deleteMessage", { id: selectedMessage });
    } else {
      // Si es recibido, solo ocultar localmente
      addDeletedForMe(selectedMessage);
      // Opcional: actualiza el estado local para re-renderizar
      // Si usas useState para mensajes, fuerza un update aquí si es necesario
    }
    setIsModalOpen(false)
  };

  return (
    <>
      <div className="w-full flex-1 px-50 bg-chat flex flex-col overflow-y-auto hide-scrollbar">
        <div className="flex-grow flex flex-col">
          <div className="flex flex-col py-5 justify-end flex-grow">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`w-full flex ${
                    msg.sender_id === userId ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`relative max-w-3xl flex mt-2 pl-3 pr-1.5 py-1 rounded-md shadow-sm gap-x-2 group
                    ${msg.sender_id === userId ? "bg-green-100" : "bg-gray-100"}
                    `}
                  >
                    <span
                      className="absolute top-0 right-0 m-2 text-gray-500 hidden group-hover:block cursor-pointer bg-opacity-20 backdrop-blur-sm rounded-sm"
                      onClick={(event) => handleOpenModal(msg.id, event)}
                    >
                      <ChevronDown />
                    </span>
                    <div>
                      {msg.type === "audio" ? (
                        <audio className="!bg-none" controls src={msg.content} />
                      ) : (
                        <p className="">{msg.content} </p>
                      )}
                    </div>
                    <div className="flex flex-col justify-end">
                      <p className="text-xs text-gray-500">{formatTimestamp(msg.created_at)}</p>
                    </div>
                    <div className="flex items-end">
                      {msg.sender_id === userId && msg.seen ? (
                        <CheckCheck color="#53BDEB" size={18} />
                      ) : msg.sender_id === userId ? (
                        <CheckCheck color="gray" size={18} />
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full flex items-center justify-start px-4">
                <p>No messages yet</p>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="w-full flex px-5 bg-gray-200 gap-x-2">
        <input
          className="py-3 px-1 bg-white w-full my-3 rounded-md outline-none"
          type="text"
          placeholder="Escriba un mensaje..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <AudioRecorder userId={userId} receivedId={receivedId} />
      </div>
      <MessagesActionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onDelete={deleteMessages}
        position={modalPosition}
      />
    </>
  );
}

export default ContainerMessageText;