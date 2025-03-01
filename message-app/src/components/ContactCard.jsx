function ContactCard({ name, lastMessageTime }) {
  return (
    <div className="flex items-center w-full p-4 border-b border-gray-300">
      <p className="">{name}</p>
      <p className="text-gray-500 ml-auto">{lastMessageTime}</p>
    </div>
  )
}

export default ContactCard