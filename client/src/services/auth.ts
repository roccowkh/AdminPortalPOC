const API_BASE_URL = '/api'

export interface LoginResponse {
  token: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'USER'
  }
}

export interface RefreshResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'USER'
  }
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Login failed')
  }

  return response.json()
}

export async function refreshToken(): Promise<RefreshResponse> {
  const refreshToken = localStorage.getItem('refreshToken')
  
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Token refresh failed')
  }

  return response.json()
}

export async function logoutUser(): Promise<void> {
  const refreshToken = localStorage.getItem('refreshToken')
  
  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })
    } catch (error) {
      console.error('Logout API call failed:', error)
    }
  }
}

export function getAuthToken(): string | null {
  const token = localStorage.getItem('token')
  console.log('Getting auth token:', token ? 'Present' : 'Missing')
  return token
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken')
}

export function setAuthToken(token: string): void {
  localStorage.setItem('token', token)
}

export function setRefreshToken(refreshToken: string): void {
  localStorage.setItem('refreshToken', refreshToken)
}

export function removeAuthToken(): void {
  localStorage.removeItem('token')
}

export function removeRefreshToken(): void {
  localStorage.removeItem('refreshToken')
}

export function removeAllTokens(): void {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
} 