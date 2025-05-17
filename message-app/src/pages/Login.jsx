import { useContext, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { Context } from '../context/AppContext.jsx'
import { GlobalContext } from '../context/GlobalContext.jsx'


const supabaseUrl = "https://kiinqpxnutbuauziwbbu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaW5xcHhudXRidWF1eml3YmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0OTMxMTAsImV4cCI6MjA1NjA2OTExMH0.MdYSZzhTPRafSOUeZ_qxKpizVPT0rEU9f0c2vSJ5-zo"
const supabase = createClient(supabaseUrl, supabaseKey)


export function Login() {
  const { actions } = useContext(Context)
  const { setUserId } = useContext(GlobalContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const navigate = useNavigate()

  //Sign up function
  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    })
  
    if(error) {
      toast.error(error.message)
      return
    }

    console.log("User created:", data)
    toast.success('User created')

    const {error: dbError} = await supabase
      .from('users')
      .insert([{id: data.user.id, username, email, password_hash:password, created_at: new Date()}])

      if(dbError) {
        toast.error(dbError.message)
      }else{
        console.log("User added to database")
      }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try{
      const user = await actions.login({email, password})
      setUserId(user.user.id)
      localStorage.setItem('userId', user.id)
      navigate('/')
    }catch(error){
      toast.error(error.message)
    }
  }

  return (
    <>
    <Toaster richColors/>
    <section className='flex flex-col justify-center items-center w-full h-screen'>
      <div className={`container ${isSignUp ? 'right-panel-active': ''}`} id="container">
        <div className="form-container sign-up-container">
          <form action="#">
            <h1 className='mb-4 text-2xl'>Crear cuenta</h1>
            <span>Usa tu correo para registrarte</span>
            <input className='input-login' type="text" placeholder="Nombre" onChange={(e) => setUsername(e.target.value)}/>
            <input className='input-login' type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)}/>
            <input className='input-login' type="password" placeholder="Contraseña" onChange={(e) => setPassword(e.target.value)}/>
            <button
              className='mt-5 button-login'
              onClick={(e) => {
                e.preventDefault()
                signUp()
              }}
            >Registrarme</button>
          </form>
        </div>
        <div className="form-container sign-in-container">
          <form action="#">
            <h1 className='mb-4 text-2xl'>Iniciar sesión</h1>
            <span>Usa tu cuenta para iniciar sesión</span>
            <input className='input-login' type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)}/>
            <input className='input-login' type="password" placeholder="Contraseña" onChange={(e) => setPassword(e.target.value)}/>
            <a href="#">Olvidaste tu contraseña?</a>
            <button className='button-login' onClick={handleLogin}>Iiniciar sesión</button>
          </form>
        </div>
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Bienvenido de nuevo!</h1>
              <p className='font-thin leading-5 tracking-wide my-5'>Inicie sesión para mantenerse conectado con nosotros</p>
              <button className="ghost button-login" id="signIn" onClick={() => setIsSignUp(false)}>Iniciar sesión</button>
            </div>
            <div className={`overlay-panel overlay-right `}>
              <h1>Bienvendo!</h1>
              <p className='font-thin leading-5 tracking-wide my-5'>Introduce tus datos personales y comienza a chatear</p>
              <button className="ghost button-login" id="signUp" onClick={() => setIsSignUp(true)}>Registrarme</button>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  )
}