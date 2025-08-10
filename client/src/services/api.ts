import { getAuthToken } from './auth'

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

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