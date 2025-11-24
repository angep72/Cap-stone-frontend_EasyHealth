import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { Plus, UserCog, Trash2 } from 'lucide-react';

type UserRole = 'patient' | 'doctor' | 'lab_technician' | 'pharmacist' | 'admin' | 'nurse';

interface User {
  _id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  createdAt?: string;
}

export function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'doctor' as UserRole,
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.getAllProfiles();
      // Filter out patients and sort by creation date
      const staffUsers = data
        .filter((user: User) => user.role !== 'patient')
        .sort((a: User, b: User) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      setUsers(staffUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Use the API register method which creates both auth and profile
      const result = await api.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone || undefined,
      });

      setSuccess(`User ${formData.full_name} created successfully!`);
      setTimeout(() => {
        setShowModal(false);
        resetForm();
        fetchUsers();
      }, 1500);
    } catch (err: any) {
      console.error('User creation error:', err);
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (confirm(`Are you sure you want to delete the user: ${email}?`)) {
      try {
        await api.deleteProfile(id);
        // Refresh the list
        fetchUsers();
      } catch (error: any) {
        alert(`Failed to delete user: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'doctor',
      phone: '',
    });
    setError('');
    setSuccess('');
  };

  const roleOptions = [
    { value: 'doctor', label: 'Doctor' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'lab_technician', label: 'Lab Technician' },
    { value: 'pharmacist', label: 'Pharmacist' },
    { value: 'admin', label: 'Administrator' },
  ];

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'nurse':
        return 'bg-teal-100 text-teal-800';
      case 'lab_technician':
        return 'bg-purple-100 text-purple-800';
      case 'pharmacist':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    return roleOptions.find((opt) => opt.value === role)?.label || role;
  };

  return (
    <>
      <Card
        title="Staff User Accounts"
        actions={
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={16} className="mr-1" />
            Add User
          </Button>
        }
      >
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Create user accounts for doctors, lab technicians, pharmacists, and administrators.
            Patients register themselves through the public registration page.
          </p>
        </div>

        {users.length === 0 ? (
          <p className="text-center text-gray-600 py-8">No staff users created yet</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Name</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 hidden sm:table-cell">Email</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Role</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 hidden md:table-cell">Phone</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 hidden lg:table-cell">Created</th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-900">
                        <div className="flex flex-col">
                          <span className="break-words">{user.full_name}</span>
                          <span className="text-gray-500 sm:hidden text-xs">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden sm:table-cell break-words">
                        {user.email}
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                        {user.phone || '-'}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-right">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(user._id, user.email)}
                          title="Delete user"
                          className="p-1.5 sm:p-2"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title="Create Staff User Account"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              After creating a user account, assign them to specific entities:
              <ul className="list-disc list-inside mt-2">
                <li>Doctors: Assign to hospital and department</li>
                <li>Lab Technicians: Ready to receive test requests</li>
                <li>Pharmacists: Ready to manage prescriptions</li>
              </ul>
            </p>
          </div>

          <Input
            label="Full Name"
            placeholder="Enter full name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="0781234567"
            value={formData.phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setFormData({ ...formData, phone: value });
            }}
            maxLength={10}
          />

          <Select
            label="Role"
            options={roleOptions}
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            required
          />

          <Input
            label="Temporary Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <p className="text-xs text-gray-600">
            The user should change this password after their first login.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
