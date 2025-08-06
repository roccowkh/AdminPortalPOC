import { useQuery } from 'react-query'
import { Calendar, Users, Settings, Clock } from 'lucide-react'
import { api } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Dashboard() {
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery(
    'bookings',
    () => api.get('/bookings')
  )

  const { data: users = [], isLoading: usersLoading } = useQuery(
    'users',
    () => api.get('/users')
  )

  const { data: services = [], isLoading: servicesLoading } = useQuery(
    'services',
    () => api.get('/services')
  )

  if (bookingsLoading || usersLoading || servicesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  const totalBookings = bookings.length
  const confirmedBookings = bookings.filter((b: any) => b.status === 'CONFIRMED').length
  const pendingBookings = bookings.filter((b: any) => b.status === 'PENDING').length
  const todayBookings = bookings.filter((b: any) => {
    const today = new Date().toDateString()
    const bookingDate = new Date(b.startTime).toDateString()
    return today === bookingDate
  }).length

  const stats = [
    {
      name: 'Total Bookings',
      value: totalBookings,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      name: 'Confirmed',
      value: confirmedBookings,
      icon: Clock,
      color: 'bg-green-500',
    },
    {
      name: 'Pending',
      value: pendingBookings,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      name: 'Today',
      value: todayBookings,
      icon: Calendar,
      color: 'bg-purple-500',
    },
    {
      name: 'Total Users',
      value: users.length,
      icon: Users,
      color: 'bg-indigo-500',
    },
    {
      name: 'Active Services',
      value: services.filter((s: any) => s.isActive).length,
      icon: Settings,
      color: 'bg-pink-500',
    },
  ]

  const recentBookings = bookings
    .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="card p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Bookings</h2>
        {recentBookings.length === 0 ? (
          <p className="text-gray-500">No bookings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentBookings.map((booking: any) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.users[0]?.user.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.users[0]?.user.email || 'No email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.services[0]?.service.name || 'Unknown Service'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.services[0]?.service.duration} minutes
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.startTime).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(booking.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          booking.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : booking.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 