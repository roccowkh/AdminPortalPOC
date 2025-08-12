import { getAuthToken, getRefreshToken, setAuthToken, removeAllTokens } from './auth'

const API_BASE_URL = '/api'

interface ApiResponse<T> {
  data?: T
  error?: string
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()
  
  console.log('API Request:', { endpoint, token: token ? 'Present' : 'Missing' })
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  // If token is expired, try to refresh it and retry the request
  if (response.status === 403) {
    const errorData = await response.json().catch(() => ({}))
    
    if (errorData.error === 'Invalid or expired token') {
      console.log('Token expired, attempting to refresh...')
      
      try {
        const refreshTokenValue = getRefreshToken()
        if (!refreshTokenValue) {
          throw new Error('No refresh token available')
        }

        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: refreshTokenValue }),
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          
          // Update stored token
          setAuthToken(refreshData.token)
          
          // Retry the original request with new token
          const newConfig: RequestInit = {
            ...config,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${refreshData.token}`,
            },
          }
          
          response = await fetch(`${API_BASE_URL}${endpoint}`, newConfig)
          console.log('Request retried with refreshed token')
        } else {
          throw new Error('Token refresh failed')
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
        // Clear all tokens and redirect to login
        removeAllTokens()
        window.location.href = '/'
        throw new Error('Authentication failed. Please login again.')
      }
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint),
  
  post: <T>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  postFormData: <T>(endpoint: string, data: FormData) => {
    const token = getAuthToken()
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
  },
  
  put: <T>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  putFormData: <T>(endpoint: string, data: FormData) => {
    const token = getAuthToken()
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
  },
  
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, {
      method: 'DELETE',
    }),
} 