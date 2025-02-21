import { useState, useEffect } from "react";
import socket from "../client";

function ContainerMessageText() {

  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')

  const sendMessage = () => {
    if(message.trim() !== ''){
      socket.emit('sendMessage', message)
      console.log(messages)
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
      <div className="w-full h-full bg-gray-100">
        {messages.length > 0 ? (
          messages.map((msg, index) => (
              <div key={index} className="w-full h-1 flex items-center justify-start px-4">
                <p>{msg}</p>
              </div>
            ))
          ): (
              <div className="w-full h-1 flex items-center justify-start px-4">
                <p>No messages</p>
              </div>
        )}
      </div>
      <input
      type="text"
      placeholder='Escriba un mensaje...'
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      >
      </input>
      <button onClick={sendMessage}>Enviar</button> 
    </>
  );
}

export default ContainerMessageText;