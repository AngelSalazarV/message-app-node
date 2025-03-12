import { useState, useEffect, useRef, useContext } from "react";
import socket from "../client";
import moment from "moment-timezone";
import { Context } from "../context/AppContext";
import AudioRecorder from "./AudioRecorder";

function ContainerMessageText({ receivedId }) {

  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState(null)
  const messagesEndRef = useRef(null)

  const { actions } = useContext(Context)

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    setUserId(storedUserId)
    socket.emit('userConnected', storedUserId)

    //fetch initial messages
    const fetchMessages = async () => {
      const res = await fetch(`http://localhost:3000/api/messages?sender_id=${storedUserId}&receiver_id=${receivedId}`)
      const data = await res.json()
      setMessages(data)
    }
    fetchMessages()
  }, [receivedId])

  const sendMessage = async ()  => {
    if(message.trim() !== ''){
      const newMessage = {sender_id: userId, receiver_id: receivedId, content: message}
      socket.emit('sendMessage', newMessage)
      setMessage('')

      //Add contact to database
      actions.addContact(userId, receivedId)
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTimestamp = (timestamp) => {
    const date = moment.utc(timestamp).tz(moment.tz.guess())
    return date.format('HH:mm')
  }

  return (
    <>
      <div className="w-full flex-1 px-50 bg-chat flex flex-col overflow-y-auto hide-scrollbar">
        <div className="flex-grow  flex flex-col ">
          <div className="flex flex-col py-5 justify-end flex-grow">
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`w-full flex ${
                    msg.sender_id === userId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className="flex bg-gray-300 mt-2 px-3 py-1 rounded-md shadow-sm gap-x-3">
                    <div>
                      {msg.type === 'audio' ? (
                        <audio controls src={msg.content} />
                      ) : (
                        <p className="">{msg.content}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-end">
                      <p className="text-xs text-gray-500">{formatTimestamp(msg.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full flex items-center justify-start px-4">
                <p></p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      <div className="flex px-10 bg-gray-200">
        <input
          className="py-3 px-1 bg-white w-full my-3 rounded-md outline-none"
          type="text"
          placeholder="Escriba un mensaje..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <AudioRecorder userId={userId} receivedId={receivedId} />
      </div>
    </>
  );
}

export default ContainerMessageText;