import ContactCard from "./ContactCard";

function Sidebar({ onSelectedContact }) {

  const contacts = ["Rodrigo"]
  return(
    <div className="flex flex-col bg-gray-100 h-screen border-r border-gray-200">
      <div className="w-full bg-white px-3 py-2">
        <div className="flex flex-col gap-y-4">
          <h1 className="font-semibold text-2xl">Chats</h1>
          <input type="text" placeholder="Buscar..." className="p-1 bg-gray-100 rounded-md outline-none"/>
        </div>
      </div>
      <div>
        {contacts.map((contact, index) => {
          return (
            <div key={index} onClick={() => onSelectedContact(contact)}>
              <ContactCard name={contact} />
            </div>
          )  
        })}
      </div>
    </div>
  )
}

export default Sidebar;