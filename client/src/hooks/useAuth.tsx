import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { loginUser, refreshToken, logoutUser, removeAllTokens } from '../services/auth'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Function to clear all timeouts
  const clearTimeouts = () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current)
      sessionTimeoutRef.current = null
    }
  }

  // Function to schedule token refresh
  const scheduleTokenRefresh = () => {
    clearTimeouts()
    
    // Refresh token 2 minutes before it expires (15 min - 2 min = 13 min)
    const refreshDelay = 13 * 60 * 1000 // 13 minutes in milliseconds
    
    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('Attempting to refresh token...')
        const response = await refreshToken()
        
        // Update stored tokens
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        setUser(response.user)
        
        console.log('Token refreshed successfully')
        
        // Schedule next refresh
        scheduleTokenRefresh()
      } catch (error) {
        console.error('Token refresh failed:', error)
        // If refresh fails, logout the user
        handleLogout()
      }
    }, refreshDelay)
  }

  // Function to schedule session timeout
  const scheduleSessionTimeout = () => {
    // Set session timeout to 7 days (refresh token expiry)
    const sessionTimeout = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    
    sessionTimeoutRef.current = setTimeout(() => {
      console.log('Session expired, logging out...')
      handleLogout()
    }, sessionTimeout)
  }

  // Function to reset session timeout on user activity
  const resetSessionTimeout = () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current)
      scheduleSessionTimeout()
    }
  }

  // Function to handle logout
  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      removeAllTokens()
      setUser(null)
      clearTimeouts()
      // Redirect to login page
      window.location.href = '/'
    }
  }

  useEffect(() => {
    // Check for stored tokens on app load
    const token = localStorage.getItem('token')
    const refreshTokenValue = localStorage.getItem('refreshToken')
    const userData = localStorage.getItem('user')
    
    if (token && refreshTokenValue && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        
        // Schedule token refresh and session timeout
        scheduleTokenRefresh()
        scheduleSessionTimeout()
        
        console.log('User authenticated, scheduled token refresh')
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        removeAllTokens()
      }
    }
    
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await loginUser(email, password)
      const { token, refreshToken: refreshTokenValue, user: userData } = response
      
      console.log('Login successful:', { 
        token: token ? 'Present' : 'Missing', 
        refreshToken: refreshTokenValue ? 'Present' : 'Missing',
        user: userData 
      })
      
      // Store tokens and user data
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshTokenValue)
      localStorage.setItem('user', JSON.stringify(userData))
      
      setUser(userData)
      
      // Schedule token refresh and session timeout
      scheduleTokenRefresh()
      scheduleSessionTimeout()
      
      console.log('Login completed, scheduled token refresh')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = () => {
    handleLogout()
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeouts()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated: !!user, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 