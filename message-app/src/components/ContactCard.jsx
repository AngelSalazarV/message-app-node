function ContactCard({ name }) {
  return (
    <div className="flex items-center w-full p-4 border-b border-gray-300">
      <p className="">{name}</p>
      <p className="text-gray-500 ml-auto">1:30 PM</p>
    </div>
  )
}

export default ContactCard