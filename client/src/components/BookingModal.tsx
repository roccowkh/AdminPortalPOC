import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import { X, Trash2, Save } from 'lucide-react'
import { api } from '../services/api'
import { format } from 'date-fns'

interface BookingModalProps {
  booking?: any
  isOpen: boolean
  onClose: () => void
  isCreating: boolean
  onDelete?: () => void
  isDeleting?: boolean
}

interface BookingForm {
  startTime: string
  endTime: string
  userIds: string[]
  serviceIds: string[]
  notes: string
  status: string
}

export default function BookingModal({
  booking,
  isOpen,
  onClose,
  isCreating,
  onDelete,
  isDeleting = false,
}: BookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingForm>()

  // Fetch users and services
  const { data: users = [] } = useQuery('users', () => api.get('/users'))
  const { data: services = [] } = useQuery('services', () => api.get('/services'))

  // Create/Update booking mutation
  const bookingMutation = useMutation(
    (data: BookingForm) => {
      if (isCreating) {
        return api.post('/bookings', data)
      } else {
        return api.put(`/bookings/${booking?.id}`, data)
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bookings')
        toast.success(isCreating ? 'Booking created successfully' : 'Booking updated successfully')
        onClose()
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to save booking')
      },
    }
  )

  // Initialize form with booking data
  useEffect(() => {
    if (booking && !isCreating) {
      setValue('startTime', format(new Date(booking.start), "yyyy-MM-dd'T'HH:mm"))
      setValue('endTime', format(new Date(booking.end), "yyyy-MM-dd'T'HH:mm"))
      setValue('userIds', booking.users.map((u: any) => u.user.id))
      setValue('serviceIds', booking.services.map((s: any) => s.service.id))
      setValue('notes', booking.notes || '')
      setValue('status', booking.status)
    } else {
      reset()
    }
  }, [booking, isCreating, setValue, reset])

  const onSubmit = async (data: BookingForm) => {
    setIsSubmitting(true)
    try {
      await bookingMutation.mutateAsync(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {isCreating ? 'Create New Booking' : 'Edit Booking'}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    {...register('startTime', { required: 'Start time is required' })}
                    type="datetime-local"
                    className="input"
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    {...register('endTime', { required: 'End time is required' })}
                    type="datetime-local"
                    className="input"
                  />
                  {errors.endTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                  )}
                </div>
              </div>

              {/* Users */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Users
                </label>
                <select
                  {...register('userIds', { required: 'At least one user is required' })}
                  multiple
                  className="input"
                  size={3}
                >
                  {users.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                {errors.userIds && (
                  <p className="mt-1 text-sm text-red-600">{errors.userIds.message}</p>
                )}
              </div>

              {/* Services */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Services
                </label>
                <select
                  {...register('serviceIds', { required: 'At least one service is required' })}
                  multiple
                  className="input"
                  size={3}
                >
                  {services.map((service: any) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.duration}min)
                    </option>
                  ))}
                </select>
                {errors.serviceIds && (
                  <p className="mt-1 text-sm text-red-600">{errors.serviceIds.message}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  {...register('status', { required: 'Status is required' })}
                  className="input"
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="NO_SHOW">No Show</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="input"
                  placeholder="Optional notes about the booking..."
                />
              </div>
            </form>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : isCreating ? 'Create Booking' : 'Update Booking'}
            </button>
            
            {!isCreating && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="btn btn-danger flex items-center gap-2 mr-3"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
            
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 