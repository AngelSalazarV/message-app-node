import { useState, useEffect } from "react";
import socket from "../client";

function ContainerMessageText({ receivedId }) {

  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    setUserId(storedUserId)
    socket.emit('userConnected', storedUserId)

    //fetch initial messages
    const fetchMessages = async () => {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/messages?sender_id=${storedUserId}&receiver_id=${receivedId}`)
      const data = await res.json()
      setMessages(data)
    }
    fetchMessages()
  }, [receivedId])

  const sendMessage = () => {
    if(message.trim() !== ''){
      const newMessage = {sender_id: userId, receiver_id: receivedId, content: message}
      socket.emit('sendMessage', newMessage)
      setMessage('')
    }
  }

  useEffect(() => {
    socket.on('receivedMessage', (newMessage) => {
      setMessages((prev) => [...prev, newMessage])
    })

    return () => {
      socket.off('receivedMessage')
    }
  }, [])

  return (
    <>
      <div className="w-full h-full px-10 py-5 flex flex-col justify-end">
        {messages.length > 0 ? (
          messages.map((msg, index) => (
              <div 
              key={index} 
              className={`w-full flex ${
                msg.sender_id === userId
                ? 'justify-end': 'justify-start'
              }`}
              >
                <p className="bg-gray-300 mt-3 px-3 rounded-md shadow-sm">{msg.content}</p>
              </div>
            ))
          ): (
              <div className="w-full flex items-center justify-start px-4">
                <p></p>
              </div>
        )}
      </div>
      <div className="px-10 bg-gray-200">
        <input
        className="py-3 px-1 bg-white w-full my-3 rounded-md outline-none"
        type="text"
        placeholder='Escriba un mensaje...'
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        >
        </input>
      </div>
    </>
  );
}

export default ContainerMessageText;