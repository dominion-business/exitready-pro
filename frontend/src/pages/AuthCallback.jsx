import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Handle the OAuth callback
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error during auth callback:', error)
        navigate('/login')
        return
      }

      if (session) {
        // Successfully authenticated
        navigate('/dashboard')
      } else {
        navigate('/login')
      }
    })
  }, [navigate])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <div>
        <h2>Completing sign in...</h2>
        <p>Please wait while we redirect you.</p>
      </div>
    </div>
  )
}

export default AuthCallback
