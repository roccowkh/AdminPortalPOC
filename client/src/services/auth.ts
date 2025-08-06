const API_BASE_URL = '/api'

export interface LoginResponse {
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

export function getAuthToken(): string | null {
  return localStorage.getItem('token')
}

export function setAuthToken(token: string): void {
  localStorage.setItem('token', token)
}

export function removeAuthToken(): void {
  localStorage.removeItem('token')
} 