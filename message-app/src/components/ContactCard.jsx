function ContactCard({ name }) {
  return (
    <div className="flex items-center w-full p-4 border-b border-gray-300">
      <p className="text-gray-800">{name}</p>
    </div>
  )
}

export default ContactCard