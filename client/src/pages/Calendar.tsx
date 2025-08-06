import { useState, useCallback } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { api } from '../services/api'
import BookingModal from '../components/BookingModal'
import LoadingSpinner from '../components/LoadingSpinner'

import enUS from 'date-fns/locale/en-US'

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface Booking {
  id: string
  title: string
  start: Date
  end: Date
  status: string
  notes?: string
  users: Array<{
    user: {
      id: string
      name: string
      email: string
      phone?: string
    }
  }>
  services: Array<{
    service: {
      id: string
      name: string
      duration: number
      price?: number
    }
  }>
}

export default function Calendar() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const queryClient = useQueryClient()

  // Fetch bookings
  const { data: bookings = [], isLoading } = useQuery<Booking[]>(
    'bookings',
    () => api.get('/bookings/calendar')
  )

  // Delete booking mutation
  const deleteMutation = useMutation(
    (id: string) => api.delete(`/bookings/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bookings')
        toast.success('Booking deleted successfully')
        setSelectedBooking(null)
        setIsModalOpen(false)
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to delete booking')
      },
    }
  )

  const handleSelectEvent = useCallback((booking: Booking) => {
    setSelectedBooking(booking)
    setIsCreating(false)
    setIsModalOpen(true)
  }, [])

  const handleSelectSlot = useCallback((slotInfo: any) => {
    setSelectedBooking(null)
    setIsCreating(true)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedBooking(null)
    setIsCreating(false)
  }

  const handleDeleteBooking = () => {
    if (selectedBooking) {
      deleteMutation.mutate(selectedBooking.id)
    }
  }

  const eventStyleGetter = (event: Booking) => {
    let backgroundColor = '#3b82f6' // default blue
    
    switch (event.status) {
      case 'CONFIRMED':
        backgroundColor = '#10b981' // green
        break
      case 'PENDING':
        backgroundColor = '#f59e0b' // yellow
        break
      case 'CANCELLED':
        backgroundColor = '#ef4444' // red
        break
      case 'COMPLETED':
        backgroundColor = '#6b7280' // gray
        break
      default:
        backgroundColor = '#3b82f6' // blue
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <button
          onClick={() => {
            setIsCreating(true)
            setSelectedBooking(null)
            setIsModalOpen(true)
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Booking
        </button>
      </div>

      <div className="card p-6">
        <div className="h-[600px]">
          <BigCalendar
            localizer={localizer}
            events={bookings}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'day']}
            defaultView="week"
            step={15}
            timeslots={4}
            min={new Date(0, 0, 0, 8, 0, 0)} // 8 AM
            max={new Date(0, 0, 0, 18, 0, 0)} // 6 PM
          />
        </div>
      </div>

      {/* Legend */}
      <div className="card p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Booking Status Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Cancelled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span className="text-sm text-gray-600">Completed</span>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isModalOpen && (
        <BookingModal
          booking={selectedBooking}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          isCreating={isCreating}
          onDelete={handleDeleteBooking}
          isDeleting={deleteMutation.isLoading}
        />
      )}
    </div>
  )
} 