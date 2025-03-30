

const getState = ({ getStore, setStore }) => {
  return {
    store: {
      userDataLogin: {},
      contacts: [],
      recentContacts: [],
      messages: []
    },
    actions: {
      //${import.meta.env.VITE_SERVER_URL} is the URL of the server instead of http://localhost:3000
      login : async (loginUserData) => {
        try{
          const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginUserData)
  
          })
          const result = await res.json()
  
          if(!res.ok){
            throw new Error(result.error)
          }

          setStore({ ...getStore(), userDataLogin: result})

          localStorage.setItem('token', result.token)
          localStorage.setItem('userId', result.user.id)
          return result
        } catch(error){
          console.error('Error:', error)
          throw error
        }
      },
      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        setStore({ ...getStore(), userDataLogin: {}})
      },
      setContacts: (contacts) => {
        setStore({ ...getStore(), contacts})
      },
      setRecentContacts: (recentContacts) => {
        setStore({ ...getStore(), recentContacts})
      },
      fetchMessages: async (senderId, receiverId) => {
        try{
          const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/messages?sender_id=${senderId}&receiver_id=${receiverId}`)
          const data = await res.json()
          setStore({ ...getStore(), messages: data})
        }catch(error){
          console.error('Error:', error)
        }
      },
      addContact: async (userId, contactId) => {
        try{
          await fetch(`${import.meta.env.VITE_SERVER_URL}/api/contacts`, {
            method: 'POST', 
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({user_id: userId, contact_id: contactId})
          })
        }catch(error){
          console.error('Error:', error)
        }
      },
      deleteMessages: async (messageId) => {
        try{
          await fetch(`${import.meta.env.VITE_SERVER_URL}/api/messages?id=${messageId}`, {
            method: 'DELETE'
          })
        }catch(error){
          console.error('Error:', error)
        }
      }
    }
  }
}

export default getState;