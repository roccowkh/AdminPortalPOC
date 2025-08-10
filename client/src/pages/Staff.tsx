import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { Plus, Edit, Trash2, Search, Users } from 'lucide-react'
import { api } from '../services/api'
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
        <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
        <button
          onClick={handleCreate}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Staff Member
        </button>
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

      {/* Staff Table */}
      <div className="card p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pictures
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((staffMember) => (
                <tr key={staffMember.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleStaffClick(staffMember)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">{staffMember.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {staffMember.pictures && staffMember.pictures.length > 0 ? (
                      <div className="flex space-x-1">
                        {staffMember.pictures.slice(0, 3).map((picture, index) => (
                          <img 
                            key={index}
                            src={picture} 
                            alt={`${staffMember.name} ${index + 1}`}
                            className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                          />
                        ))}
                        {staffMember.pictures.length > 3 && (
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">+{staffMember.pictures.length - 3}</span>
                          </div>
                        )}
                      </div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(staffMember.id);
                      }}
                      disabled
                      className="text-gray-400 cursor-not-allowed"
                      title="Delete functionality is disabled"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
