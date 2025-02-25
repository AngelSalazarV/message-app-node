import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = "https://kiinqpxnutbuauziwbbu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaW5xcHhudXRidWF1eml3YmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0OTMxMTAsImV4cCI6MjA1NjA2OTExMH0.MdYSZzhTPRafSOUeZ_qxKpizVPT0rEU9f0c2vSJ5-zo"
const supabase = createClient(supabaseUrl, supabaseKey)

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const navigate = useNavigate()

  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    })
  
    if(error) {
      console.log("Error:", error.message)
      return
    }

    console.log("User created:", data)

    const {error: dbError} = await supabase
      .from('users')
      .insert([{id: data.user.id, username, email, password_hash:password, created_at: new Date()}])

      if(dbError) {
        console.log("Error:", dbError.message)
      }else{
        console.log("User added to database")
      }
  }

  const login = async () => {
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({email, password})

    })
    const result = await res.json()

    if(!res.ok){
      console.log('Error: ', result.message)
      return
    }
    console.log('User logged in:',result.user)
    localStorage.setItem('token', result.token)
    navigate('/')
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