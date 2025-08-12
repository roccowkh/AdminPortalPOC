import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { Plus, Edit, Trash2, Search, Users } from 'lucide-react'
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
  pictures: File[]
  status: string
  remarks: string
}

export default function Staff() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isBulkEditing, setIsBulkEditing] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<number[]>([])
  const [sortField, setSortField] = useState<keyof Staff>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const queryClient = useQueryClient()

  const { data: staff = [], isLoading } = useQuery<Staff[]>(
    ['staff', searchTerm],
    async () => {
      const response = await api.get(`/staff${searchTerm ? `?search=${searchTerm}` : ''}`)
      return response as Staff[]
    }
  )

  const createMutation = useMutation(
    (data: FormData) => api.postFormData('/staff', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['staff']);
        toast.success('Staff member created successfully!');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to create staff member');
      }
    }
  );

  const updateMutation = useMutation(
    (data: { id: number; staffData: FormData }) => api.putFormData(`/staff/${data.id}`, data.staffData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['staff']);
        toast.success('Staff member updated successfully!');
        setIsModalOpen(false);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to update staff member');
      }
    }
  );

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/staff/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('staff')
        toast.success('Staff member deleted successfully')
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to delete staff member')
      },
    }
  )

  const bulkStatusMutation = useMutation(
    (data: { ids: number[]; status: string }) => api.put('/staff/bulk-status', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['staff'])
        toast.success('Staff status updated successfully')
        setSelectedStaff([])
        setIsBulkEditing(false)
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to update staff status')
      }
    }
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StaffForm>()

  const onSubmit = (data: StaffForm) => {
    if (editingStaff) {
      // Update existing staff
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('staffId', data.staffId);
      if (data.remarks) formData.append('remarks', data.remarks);
      if (data.status) formData.append('status', data.status);
      if (data.pictures && data.pictures.length > 0) {
        data.pictures.forEach((file, index) => {
          formData.append('pictures', file);
        });
      }
      
      updateMutation.mutate({
        id: editingStaff.id,
        staffData: formData as any
      });
    } else {
      // Create new staff
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('staffId', data.staffId);
      if (data.remarks) formData.append('remarks', data.remarks);
      if (data.status) formData.append('status', data.status);
      if (data.pictures && data.pictures.length > 0) {
        data.pictures.forEach((file, index) => {
          formData.append('pictures', file);
        });
      }
      
      createMutation.mutate(formData as any);
    }
    
    setIsModalOpen(false);
    reset();
  };

  const handleStaffClick = (staffMember: Staff) => {
    // Navigate to staff detail page
    window.location.href = `/staff/${staffMember.id}`;
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember)
    setValue('name', staffMember.name)
    setValue('staffId', staffMember.staffId)
    setValue('status', staffMember.status)
    setValue('remarks', staffMember.remarks || '')
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingStaff(null)
    reset()
    setValue('status', 'active') // Set default status
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSort = (field: keyof Staff) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = () => {
    if (selectedStaff.length === staff.length) {
      setSelectedStaff([])
    } else {
      setSelectedStaff(staff.map(s => s.id))
    }
  }

  const handleSelectStaff = (id: number) => {
    setSelectedStaff(prev => 
      prev.includes(id) 
        ? prev.filter(staffId => staffId !== id)
        : [...prev, id]
    )
  }

  const handleBulkStatusUpdate = (status: string) => {
    if (selectedStaff.length === 0) return
    
    if (window.confirm(`Are you sure you want to set ${selectedStaff.length} staff member(s) to ${status}?`)) {
      bulkStatusMutation.mutate({ ids: selectedStaff, status })
    }
  }

  const sortedStaff = [...staff].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === 'asc' 
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime()
    }
    
    return 0
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
          <div className="flex space-x-3">
            {isBulkEditing && selectedStaff.length > 0 && (
              <>
                <button
                  onClick={() => handleBulkStatusUpdate('active')}
                  disabled={bulkStatusMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50"
                >
                  Set Active ({selectedStaff.length})
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('inactive')}
                  disabled={bulkStatusMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50"
                >
                  Set Inactive ({selectedStaff.length})
                </button>
                <button
                  onClick={() => {
                    setIsBulkEditing(false)
                    setSelectedStaff([])
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm"
                >
                  Cancel Bulk Edit
                </button>
              </>
            )}
            {!isBulkEditing && (
              <>
                <button
                  onClick={() => setIsBulkEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm"
                >
                  Bulk Edit
                </button>
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search staff by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="card p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {isBulkEditing && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedStaff.length === staff.length && staff.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center space-x-1">
                    <span>ID</span>
                    {sortField === 'id' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Picture
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    {sortField === 'name' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('staffId')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Staff ID</span>
                    {sortField === 'staffId' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {sortField === 'status' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Created</span>
                    {sortField === 'createdAt' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStaff.map((staffMember) => (
                <tr key={staffMember.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleStaffClick(staffMember)}>
                  {isBulkEditing && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStaff.includes(staffMember.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleSelectStaff(staffMember.id)
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">{staffMember.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {staffMember.pictures && staffMember.pictures.length > 0 ? (
                      <img 
                        src={getImageUrl(staffMember.pictures[0])}
                        alt={`${staffMember.name}`}
                        className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No Pic</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{staffMember.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">{staffMember.staffId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      staffMember.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {staffMember.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {staffMember.remarks || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(staffMember.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                </h3>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      {...register('name', { required: 'Name is required' })}
                      type="text"
                      className="input"
                      placeholder="Enter full name"
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
                      placeholder="Enter staff ID (e.g., 0001)"
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
                      Pictures
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setValue('pictures', files);
                      }}
                      className="input"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Upload multiple images (JPEG, PNG, GIF) - Max 5MB each, up to 10 images
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remarks
                    </label>
                    <textarea
                      {...register('remarks')}
                      rows={3}
                      className="input"
                      placeholder="Optional remarks or notes"
                    />
                  </div>
                </form>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="btn btn-primary"
                >
                  {createMutation.isLoading || updateMutation.isLoading
                    ? 'Saving...'
                    : editingStaff
                    ? 'Update Staff Member'
                    : 'Create Staff Member'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
