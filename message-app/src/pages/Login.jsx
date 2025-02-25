import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = "https://kiinqpxnutbuauziwbbu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaW5xcHhudXRidWF1eml3YmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0OTMxMTAsImV4cCI6MjA1NjA2OTExMH0.MdYSZzhTPRafSOUeZ_qxKpizVPT0rEU9f0c2vSJ5-zo"
const supabase = createClient(supabaseUrl, supabaseKey)

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')

  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    })
  
    if(error) {
      console.log("Error:", error.message)
    } else {
      console.log("User created:", data)
    }
  }

  const login = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if(error) {
      console.log("Error:", error.message)
    } else {
      console.log("User logged:", data)
      localStorage.setItem('token', data.session.access_token)
    }
  }

  return (
    <section className='flex flex-col items-center justify-center w-full h-screen'>
      <div className='flex flex-col items-center bg-gray-100 p-10 rounded-md shadow-md'>
        <h1 className='text-3xl font-bold'>Login</h1>
        <form className='flex flex-col'>
          <input 
            className='my-3 py-2 px-3 rounded-md outline-none border' 
            type='text' 
            placeholder='Email' 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            className='my-3 py-2 px-3 rounded-md outline-none border' 
            type='password' 
            placeholder='Password' 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input 
            className='my-3 py-2 px-3 rounded-md outline-none border' 
            type='text' 
            placeholder='Username' 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button 
            className='my-3 py-2 px-3 rounded-md bg-blue-500 text-white cursor-pointer'
            onClick={(e) => {
              e.preventDefault()
              signUp()
            }}
          >Sign Up</button>
          <button 
            className='my-3 py-2 px-3 rounded-md bg-blue-500 text-white cursor-pointer'
            onClick={(e) => {
              e.preventDefault()
              login()
            }}
          >Login</button>
        </form>
      </div>
    </section>
  )
}