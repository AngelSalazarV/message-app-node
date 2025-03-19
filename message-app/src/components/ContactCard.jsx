import moment from "moment-timezone";

function ContactCard({ name, lastMessageTime, lastMessage }) {

  const formatTimestamp = (timestamp) => {
      const date = moment.utc(timestamp).tz(moment.tz.guess())
      return date.format('HH:mm')
    }

  return (
    <div className="flex items-center justify-between w-full px-4 py-3 border-b border-gray-300">
      <div>
        <p className="">{name}</p>
        <p className="text-gray-500 ml-auto">{lastMessage || ''}</p>
      </div>
      <div>
        <p className="text-gray-500 ml-auto">{formatTimestamp(lastMessageTime) || ''}</p>
      </div>
    </div>
  )
}

export default ContactCard