import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Upload, Trash2, Users } from 'lucide-react'
import { api } from '../services/api'
import { getImageUrl } from '../config'
import LoadingSpinner from '../components/LoadingSpinner'

interface Staff {
  id: number
  name: string
  staffId: string
  pictures: string[]
  status: string
  remarks?: string
  createdAt: string
}

interface StaffForm {
  name: string
  staffId: string
  status: string
  remarks: string
}

export default function StaffDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [newPictures, setNewPictures] = useState<File[]>([])

  const { register, handleSubmit, setValue, formState: { errors }, reset, watch } = useForm<StaffForm>()

  const { data: staff, isLoading, error } = useQuery<Staff>(
    ['staff', id],
    async () => {
      const response = await api.get(`/staff/${id}`)
      console.log('Staff API response:', response)
      
      // Type the response properly
      const staffData = response as Staff
      console.log('Staff pictures array:', staffData.pictures)
      console.log('Staff pictures type:', typeof staffData.pictures)
      console.log('Staff pictures length:', staffData.pictures?.length)
      
      return staffData
    },
    {
      enabled: !!id
    }
  )

  const updateMutation = useMutation(
    (data: { staffData: FormData }) => api.putFormData(`/staff/${id}`, data.staffData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['staff', id])
        queryClient.invalidateQueries(['staff'])
        toast.success('Staff member updated successfully!')
        setIsEditing(false)
        setNewPictures([])
        // Reset form with updated data
        if (staff) {
          reset({
            name: staff.name,
            staffId: staff.staffId,
            status: staff.status,
            remarks: staff.remarks || ''
          })
        }
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to update staff member')
      }
    }
  )

  useEffect(() => {
    if (staff) {
      setValue('name', staff.name)
      setValue('staffId', staff.staffId)
      setValue('status', staff.status)
      setValue('remarks', staff.remarks || '')
      
      // Test if backend uploads directory is accessible
      if (staff.pictures && staff.pictures.length > 0) {
        console.log('Testing image URLs...')
        staff.pictures.forEach((picture, index) => {
          const testUrl = getImageUrl(picture)
          console.log(`Testing image ${index}:`, testUrl)
          
          // Test if image is accessible
          fetch(testUrl, { method: 'HEAD' })
            .then(response => {
              console.log(`Image ${index} accessible:`, response.ok, response.status)
            })
            .catch(error => {
              console.error(`Image ${index} not accessible:`, error)
            })
        })
      }
    }
  }, [staff, setValue])

  // Watch form values to prevent unnecessary resets
  const watchedValues = watch()

  const handleCancel = () => {
    setIsEditing(false)
    setNewPictures([])
    // Reset form to original values
    if (staff) {
      reset({
        name: staff.name,
        staffId: staff.staffId,
        status: staff.status,
        remarks: staff.remarks || ''
      })
    }
  }

  const onSubmit = (data: StaffForm) => {
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('staffId', data.staffId)
    formData.append('status', data.status)
    if (data.remarks) formData.append('remarks', data.remarks)
    
    // Add new pictures if any
    if (newPictures.length > 0) {
      newPictures.forEach(file => {
        formData.append('pictures', file)
      })
    }

    updateMutation.mutate({ staffData: formData })
  }

  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setNewPictures(prev => [...prev, ...files])
  }

  const removeNewPicture = (index: number) => {
    setNewPictures(prev => prev.filter((_, i) => i !== index))
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <div className="text-red-600">Error loading staff member</div>
  if (!staff) return <div>Staff member not found</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/staff')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Staff
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{staff.name}</h1>
              <p className="text-gray-600">Staff ID: {staff.staffId}</p>
            </div>
            
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Edit Staff
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={updateMutation.isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateMutation.isLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Staff Information */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Staff Information</h2>
            
            {isEditing ? (
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    type="text"
                    className="input"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Staff ID
                  </label>
                  <input
                    {...register('staffId', { required: 'Staff ID is required' })}
                    type="text"
                    className="input"
                  />
                  {errors.staffId && (
                    <p className="mt-1 text-sm text-red-600">{errors.staffId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    {...register('status', { required: 'Status is required' })}
                    className="input"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    {...register('remarks')}
                    rows={3}
                    className="input"
                  />
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{staff.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Staff ID</label>
                  <p className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">{staff.staffId}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    staff.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {staff.status}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="text-gray-900">{staff.remarks || 'No remarks'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-gray-900">{new Date(staff.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Pictures Section */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Pictures</h2>
              {isEditing && (
                <label className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Add Pictures
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePictureUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* New Pictures Preview */}
            {isEditing && newPictures.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">New Pictures to Upload:</h3>
                <div className="grid grid-cols-4 gap-2">
                  {newPictures.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New ${index + 1}`}
                        className="h-20 w-20 object-cover rounded border"
                      />
                      <button
                        onClick={() => removeNewPicture(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Pictures */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current Pictures:</h3>
              {staff.pictures && staff.pictures.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {staff.pictures.map((picture, index) => {
                    // Use utility function to construct full image URL
                    const fullImageUrl = getImageUrl(picture)
                    
                    console.log('Picture data:', { 
                      picture, 
                      fullImageUrl, 
                      index,
                      staffName: staff.name,
                      backendUrl: 'http://localhost:5001'
                    })
                    
                    return (
                      <div key={index} className="relative">
                        <img
                          src={fullImageUrl}
                          alt={`${staff.name} ${index + 1}`}
                          className="h-20 w-20 object-cover rounded border"
                          onError={(e) => {
                            console.error('Image failed to load:', fullImageUrl)
                            console.error('Error details:', e)
                            // Replace with a placeholder when image fails to load
                            e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                              <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                                <rect width="80" height="80" fill="#f3f4f6"/>
                                <text x="40" y="45" font-family="Arial" font-size="12" text-anchor="middle" fill="#9ca3af">
                                  ${staff.name} ${index + 1}
                                </text>
                              </svg>
                            `)}`
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500">No pictures uploaded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
