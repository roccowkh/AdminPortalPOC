import { useState, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { api } from '../services/api'
import BookingModal from '../components/BookingModal'
import LoadingSpinner from '../components/LoadingSpinner'

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

  const handleSelectSlot = useCallback((selectInfo: any) => {
    setSelectedBooking(null)
    setIsCreating(true)
    setIsModalOpen(true)
  }, [])

  const renderEventContent = (eventInfo: any) => {
    return (
      <div className="p-1 text-xs">
        <div className="font-semibold">{eventInfo.event.title}</div>
        <div className="text-xs opacity-75">
          {eventInfo.timeText}
        </div>
      </div>
    )
  }

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
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            initialView="timeGridWeek"
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={bookings}
            select={handleSelectSlot}
            eventClick={handleSelectEvent}
            eventContent={renderEventContent}
            height="100%"
            slotMinTime="08:00:00"
            slotMaxTime="18:00:00"
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