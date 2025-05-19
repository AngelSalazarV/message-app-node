import moment from "moment-timezone";

function ContactCard({ name, lastMessageTime, lastMessage, unreadCount, active }) {

  const formatTimestamp = (timestamp) => {
      const date = moment.utc(timestamp).tz(moment.tz.guess())
      return date.format('HH:mm')
    }

  return (
    <div className={`flex items-center justify-between w-full px-4 h-18 border-b border-gray-300 ${active ? 'bg-gray-100' : ''}`}>
      <div className=" flex flex-col flex-grow max-w-3/4">
        <p>{name}</p>
        <p className="text-gray-500 truncate">{lastMessage || ''}</p>
      </div>
      <div className="flex flex-col items-center">
        {lastMessageTime && 
        <>
        <p className="text-gray-500">{formatTimestamp(lastMessageTime)}</p>
        {unreadCount > 0 &&
          <span className="w-5 text-white bg-green-500 rounded-3xl text-center font-semibold text-sm">
            {unreadCount}
          </span>
        }
        </>
        }
      </div>
    </div>
  )
}

export default ContactCard