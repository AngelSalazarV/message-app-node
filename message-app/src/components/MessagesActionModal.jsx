import { useEffect, useState, useRef } from "react"

export function MessagesActionModal({ isOpen, onClose, onDelete, position}) {
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 })
  const modalRef = useRef(null)

  useEffect(() => {
    if(position){
      const { top, left, height } = position
      const windowHeight = window.innerHeight
      const modalHeight = 100
      const spaceBelow = windowHeight - (top + height)
      const spaceAbove = top

      if (spaceBelow < modalHeight && spaceAbove > modalHeight) {
        // Open modal above the span
        setModalPosition({ top: top - modalHeight, left });
      } else {
        // Open modal below the span
        setModalPosition({ top: top + height, left });
      }
    }
  }, [position])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if(modalRef.current && !modalRef.current.contains(e.target)){
        onClose()
      }
    }

    if(isOpen){
      document.addEventListener('mousedown', handleClickOutside)
    }else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if(!isOpen) return null

  return (
    <div 
      ref={modalRef}
      className="absolute bg-gray-100 flex flex-col w-30 shadow-md rounded overflow-hidden"
      style={{ top: modalPosition.top, left: modalPosition.left }}
    >
      <button 
        className="text-left border-gray-400 px-4 py-2 hover:bg-gray-200 "
        onClick={onDelete}
        >
          Eliminar
      </button>
    </div>
  )
}

export default MessagesActionModal