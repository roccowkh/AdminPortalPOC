import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Users from './pages/Users'
import Staff from './pages/Staff'
import StaffDetail from './pages/StaffDetail'
import Services from './pages/Services'
import { useAuth } from './hooks/useAuth'

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  // Add console.log for debugging
  console.log('Auth state:', { isAuthenticated, loading })

  if (loading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/users" element={<Users />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/staff/:id" element={<StaffDetail />} />
        <Route path="/services" element={<Services />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return <AppRoutes />
}

export default App 