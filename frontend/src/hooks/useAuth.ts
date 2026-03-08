import { useState, useEffect } from 'react'
import { authApi, type Agent } from '../api/client'

export function useAuth() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then((r) => setAgent(r.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    setAgent(null)
    window.location.href = '/login'
  }

  const isAdmin = agent?.role === 'admin'

  return { agent, loading, logout, isAdmin }
}

